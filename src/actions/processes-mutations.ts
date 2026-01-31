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
    if (!userId) throw new Error("Unauthorized");

    if (!data.name) throw new Error("Zone Name is required");

    // LIMIT CHECK
    const userSettings = await prisma.userSettings.findUnique({ where: { userId } })
    if (userSettings) {
        const { isLimitReached, FREE_PLAN_LIMITS } = await import('@/lib/limits')

        // 1. Check Zone Count
        const existingZones = await prisma.processZone.count({ where: { userId } })
        if (isLimitReached(existingZones, FREE_PLAN_LIMITS.MAX_PROCESS_FLOWS, userSettings.plan)) {
            throw new Error("Límite de flujos alcanzado (Plan Gratuito: 1). Actualiza tu plan.")
        }

        // 2. Check Tasks Count (in this creation payload)
        // If they try to create a zone with > 1 task
        if (isLimitReached(data.tasks.length, FREE_PLAN_LIMITS.MAX_PROCESS_TASKS_ASSIGNED + 1, userSettings.plan)) {
            // Logic: isLimitReached(2, 2, 'FREE') -> true. We want to allow 1. So if length >= 2...
            // Wait, isLimitReached(val, limit) returns val >= limit.
            // If MAX is 1. If length is 2. 2 >= 1? True. Blocked?
            // My helper isLimitReached(current, limit) { return current >= limit }.
            // If limit is 1. If I have 1, it returns true? No, I should be able to HAVE 1.
            // Limit usually means "Max allowed". Usage < Limit is ok. Usage == Limit is full. Usage > Limit is bad.
            // If I have 0, create 1 -> 1. 1 >= 1? True.
            // The helper `isLimitReached` checks if current count ALREADY met the limit? 
            // "Limit Reached" usually means "You are at capacity, cannot add more".
            // So if current == limit, you CANNOT add more.
            // currentZones = 0. limit = 1. isLimitReached(0, 1) -> false. Proceed.
            // currentZones = 1. limit = 1. isLimitReached(1, 1) -> true. Block.
            // That logic holds for "Adding New Item".

            // For Tasks in Payload:
            // If I send 2 tasks. Limit is 1.
            // I should check if data.tasks.length > limit.
            // Actually, strictly: data.tasks.length > 1.
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

            if (staffMember) {
                const client = await clerkClient();
                const staffUser = await client.users.getUser(staffMember.userId);
                const staffEmail = staffUser.emailAddresses[0]?.emailAddress;
                // Owner name logic: could fetch from Clerk or UserSettings. For now use "Tu Administrador"
                const ownerSettings = await prisma.userSettings.findUnique({ where: { userId } });
                const managerName = ownerSettings?.businessName || "Tu Administrador";

                if (staffEmail) {
                    await sendStaffAssignmentEmail(
                        staffEmail,
                        staffMember.user.businessName || "Staff",
                        data.name,
                        managerName
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
    if (!userId) throw new Error("Unauthorized");

    const existingZone = await prisma.processZone.findUnique({
        where: { id: data.zoneId, userId }
    });

    if (!existingZone) throw new Error("Zone not found");

    // LIMIT CHECK (Tasks)
    const userSettings = await prisma.userSettings.findUnique({ where: { userId } })
    if (userSettings && userSettings.plan === 'FREE') {
        const { FREE_PLAN_LIMITS } = await import('@/lib/limits')

        // Count current tasks
        const currentTaskCount = await prisma.processTask.count({ where: { zoneId: data.zoneId } })

        // Calculate net change
        // data.tasks contains: new tasks (no id), updates (id), deletes (id + deleted)
        // We only care about the resulting total

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

            if (staffMember) {
                const client = await clerkClient();
                const staffUser = await client.users.getUser(staffMember.userId);
                const staffEmail = staffUser.emailAddresses[0]?.emailAddress;

                const ownerSettings = await prisma.userSettings.findUnique({ where: { userId } });
                const managerName = ownerSettings?.businessName || "Tu Administrador";

                if (staffEmail) {
                    await sendStaffAssignmentEmail(
                        staffEmail,
                        staffMember.user.businessName || "Staff",
                        data.name,
                        managerName
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
    if (!userId) throw new Error("Unauthorized");

    await prisma.processZone.delete({
        where: { id: zoneId, userId }
    });

    revalidatePath('/dashboard/processes');
    redirect('/dashboard/processes');
}
