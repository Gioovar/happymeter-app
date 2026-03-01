'use server';

import { prisma } from '@/lib/prisma';
import { auth, clerkClient } from '@clerk/nextjs/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { ProcessEvidenceType } from '@prisma/client';
import { sendStaffAssignmentEmail } from '@/lib/email';

interface CreateZonePayload {
    name: string;
    description?: string;
    assignedStaffId?: string;
    tasks: {
        title: string;
        description?: string;
        limitTime?: string; // "HH:MM"
        days?: string[]; // ["Mon", "Tue", ...]
        evidenceType: ProcessEvidenceType;
    }[]
}

export async function createProcessZoneWithTasks(data: CreateZonePayload) {
    const { userId } = await auth();
    if (!userId) throw new Error("No autorizado");

    if (!data.name) throw new Error("El nombre de la zona es requerido");

    // LIMIT CHECK
    const userSettings = await prisma.userSettings.findUnique({ where: { userId } })
    if (userSettings) {
        const { isLimitReached, FREE_PLAN_LIMITS } = await import('@/lib/limits')

        // 1. Check Zone Count
        const existingZones = await prisma.processZone.count({ where: { userId } })
        if (isLimitReached(existingZones, FREE_PLAN_LIMITS.MAX_PROCESS_FLOWS, userSettings.plan)) {
            throw new Error("Límite de flujos alcanzado (Plan Gratuito: 1). Actualiza tu plan.")
        }

        if (userSettings.plan === 'FREE' && data.tasks.length > FREE_PLAN_LIMITS.MAX_PROCESS_TASKS_ASSIGNED) {
            throw new Error("Límite de tareas alcanzado (Plan Gratuito: 1 tarea por flujo).")
        }
    }

    const zone = await prisma.processZone.create({
        data: {
            userId,
            name: data.name,
            description: data.description,
            assignedStaffId: data.assignedStaffId || null,
            tasks: {
                create: data.tasks.map(task => ({
                    title: task.title,
                    description: task.description,
                    limitTime: task.limitTime || null,
                    days: task.days || [],
                    evidenceType: task.evidenceType
                }))
            }
        }
    });

    // Notify Staff if assigned
    if (data.assignedStaffId) {
        try {
            const staffMember = await prisma.teamMember.findUnique({
                where: { id: data.assignedStaffId },
                include: { user: true } // We get the UserSettings, but we need the email from Clerk
            });

            if (staffMember && staffMember.user) {
                const client = await clerkClient();
                const staffUser = await client.users.getUser(staffMember.userId);
                const staffEmail: string | undefined = staffUser.emailAddresses[0]?.emailAddress;
                // Owner name logic: could fetch from Clerk or UserSettings. For now use "Tu Administrador"
                const ownerSettings = await prisma.userSettings.findUnique({ where: { userId } });
                const managerName = ownerSettings?.businessName || "Tu Administrador";

                if (staffEmail) {
                    await sendStaffAssignmentEmail(
                        staffEmail,
                        staffMember.user.businessName || staffMember.name || "Staff",
                        data.name,
                        managerName || "Tu Administrador"
                    );
                }
            }
        } catch (error) {
            console.error("Failed to notify staff:", error);
            // Don't fail the request if email fails
        }
    }

    revalidatePath('/dashboard/processes');
    return { success: true };
}

interface UpdateZonePayload {
    zoneId: string;
    name: string;
    description?: string;
    assignedStaffId?: string;
    tasks: {
        id?: string; // If present, update. If missing, create.
        title: string;
        description?: string;
        limitTime?: string;
        days?: string[];
        evidenceType: ProcessEvidenceType;
        deleted?: boolean; // Flag to delete
    }[]
}

export async function updateProcessZoneWithTasks(data: UpdateZonePayload) {
    const { userId } = await auth();
    if (!userId) throw new Error("No autorizado");

    const existingZone = await prisma.processZone.findUnique({
        where: { id: data.zoneId },
        include: { tasks: true }
    });

    if (!existingZone || existingZone.userId !== userId) {
        throw new Error("Zona no encontrada o no autorizada");
    }

    // LIMIT CHECK (Tasks)
    const userSettings = await prisma.userSettings.findUnique({ where: { userId } })
    if (userSettings && userSettings.plan === 'FREE') {
        const { FREE_PLAN_LIMITS } = await import('@/lib/limits')

        // Count current tasks
        const currentTaskCount = await prisma.processTask.count({ where: { zoneId: data.zoneId } })

        // Calculate net change
        let newTotal = currentTaskCount

        for (const task of data.tasks) {
            if (task.deleted && task.id) {
                newTotal--
            } else if (!task.id && !task.deleted) {
                newTotal++
            }
        }

        if (newTotal > FREE_PLAN_LIMITS.MAX_PROCESS_TASKS_ASSIGNED) {
            throw new Error(`Límite de tareas excedido (Plan Gratuito: ${FREE_PLAN_LIMITS.MAX_PROCESS_TASKS_ASSIGNED}). Elimina tareas antes de agregar nuevas.`)
        }
    }

    // Transaction to update zone and sync tasks
    await prisma.$transaction(async (tx) => {
        // 1. Update Zone details
        await tx.processZone.update({
            where: { id: data.zoneId },
            data: {
                name: data.name,
                description: data.description,
                assignedStaffId: data.assignedStaffId || null
            }
        });

        // 2. Handle Tasks
        for (const task of data.tasks) {
            if (task.deleted && task.id) {
                // Delete existing task
                await tx.processTask.delete({
                    where: { id: task.id }
                });
            } else if (task.id) {
                // Update existing task
                await tx.processTask.update({
                    where: { id: task.id },
                    data: {
                        title: task.title,
                        description: task.description,
                        limitTime: task.limitTime || null,
                        days: task.days || [],
                        evidenceType: task.evidenceType
                    }
                });
            } else if (!task.deleted) {
                // Create new task
                await tx.processTask.create({
                    data: {
                        zoneId: data.zoneId,
                        title: task.title,
                        description: task.description,
                        limitTime: task.limitTime || null,
                        days: task.days || [],
                        evidenceType: task.evidenceType
                    }
                });
            }
        }
    });

    // Notify Staff if NEWLY assigned or CHANGED
    if (data.assignedStaffId && data.assignedStaffId !== existingZone.assignedStaffId) {
        try {
            const staffMember = await prisma.teamMember.findUnique({
                where: { id: data.assignedStaffId },
                include: { user: true }
            });

            if (staffMember && staffMember.user) {
                const client = await clerkClient();
                const staffUser = await client.users.getUser(staffMember.userId);
                const staffEmail: string | undefined = staffUser.emailAddresses[0]?.emailAddress;

                const ownerSettings = await prisma.userSettings.findUnique({ where: { userId } });
                const managerName = ownerSettings?.businessName || "Tu Administrador";

                if (staffEmail) {
                    await sendStaffAssignmentEmail(
                        staffEmail,
                        staffMember.user.businessName || staffMember.name || "Staff",
                        data.name,
                        managerName || "Tu Administrador"
                    );
                }
            }
        } catch (error) {
            console.error("Failed to notify staff:", error);
        }
    }

    revalidatePath('/dashboard/processes');
    return { success: true };
}

export async function deleteProcessZone(zoneId: string) {
    const { userId } = await auth();
    if (!userId) throw new Error("No autorizado");

    // Verify ownership
    const existingZone = await prisma.processZone.findUnique({
        where: { id: zoneId },
        select: { userId: true }
    });

    if (!existingZone || existingZone.userId !== userId) {
        throw new Error("Zona no encontrada o no autorizada");
    }

    await prisma.processZone.delete({
        where: { id: zoneId }
    });

    revalidatePath('/dashboard/processes');
    return { success: true };
}

export async function assignTask(taskId: string, staffId: string | null) {
    const { userId } = await auth();
    if (!userId) throw new Error("No autorizado");

    // 1. Verify Ownership/Access
    const task = await prisma.processTask.findUnique({
        where: { id: taskId },
        include: { zone: true }
    });

    if (!task) throw new Error("Tarea no encontrada");

    // Check if user owns the zone directly
    let isAuthorized = task.zone.userId === userId;

    // If not the direct owner, check if user is the chain owner
    if (!isAuthorized) {
        const branchInfo = await prisma.chainBranch.findFirst({
            where: { branchId: task.zone.userId },
            select: {
                chain: {
                    select: { ownerId: true }
                }
            }
        });

        // User is authorized if they are the chain owner
        if (branchInfo && branchInfo.chain.ownerId === userId) {
            isAuthorized = true;
        }
    }

    if (!isAuthorized) {
        throw new Error("No autorizado");
    }

    // 2. Update Task
    await prisma.processTask.update({
        where: { id: taskId },
        data: {
            assignedStaffId: staffId
        }
    });

    // 3. Notify Staff (Optional, can be added later)
    if (staffId) {
        // Send notification logic here
    }

    revalidatePath(`/dashboard/processes/${task.zoneId}`);
    return { success: true };
}

interface UpdateTaskPayload {
    taskId: string;
    title: string;
    description?: string;
    limitTime?: string;
    evidenceType: ProcessEvidenceType;
    days: string[];
}

export async function updateProcessTask(data: UpdateTaskPayload) {
    const { userId } = await auth();
    if (!userId) throw new Error("No autorizado");

    const task = await prisma.processTask.findUnique({
        where: { id: data.taskId },
        include: { zone: true }
    });

    if (!task) throw new Error("Tarea no encontrada");
    if (task.zone.userId !== userId) throw new Error("No autorizado");

    await prisma.processTask.update({
        where: { id: data.taskId },
        data: {
            title: data.title,
            description: data.description,
            limitTime: (data.limitTime === "" || data.limitTime === null) ? null : data.limitTime,
            evidenceType: data.evidenceType,
            days: data.days
        }
    });

    revalidatePath(`/dashboard/processes/${task.zoneId}`);
    return { success: true };
}
