'use server';

import { prisma } from '@/lib/prisma';
import { auth } from '@clerk/nextjs/server';

export async function getTeamMembers() {
    const { userId } = await auth();
    if (!userId) return [];

    const members = await prisma.teamMember.findMany({
        where: { ownerId: userId },
        include: {
            user: {
                select: {
                    businessName: true,

                    phone: true
                }
            }
        }
    });

    // We might need to fetch the actual name from Clerk if it's not in UserSettings, 
    // but UserSettings has businessName which corresponds to "Name" in the profile typically 
    // or we might need a display name. 
    // For now assuming businessName or fallback to id/email.

    return members.map(m => ({
        id: m.id,
        name: m.user.businessName || "Sin Nombre",
        role: m.role
    }));
}

export async function getPendingInvitations() {
    const { userId } = await auth();
    if (!userId) return [];

    const invitations = await prisma.teamInvitation.findMany({
        where: { inviterId: userId },
        orderBy: { createdAt: 'desc' }
    });

    return invitations;
}
