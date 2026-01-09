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
        evidenceType: ProcessEvidenceType;
    }[]
}

export async function createProcessZoneWithTasks(data: CreateZonePayload) {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    if (!data.name) throw new Error("Zone Name is required");

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
