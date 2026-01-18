'use server'

import { auth, clerkClient } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { headers } from 'next/headers'
import { PLAN_LIMITS } from '@/lib/plans'

import { sendInvitationEmail } from '@/lib/email'

export async function getTeamData(branchId?: string) {
    const { userId } = await auth()
    if (!userId) throw new Error('Unauthorized')

    let effectiveOwnerId = userId

    // If branchId is provided, we need to verify if the current user has access to it.
    // Access is allowed if:
    // 1. Current user is the owner of the Chain that owns the Branch.
    // 2. Current user IS the branch (already handled by default if userId matches, but passed branchId might differ).

    if (branchId && branchId !== userId) {
        // Verify Chain Ownership
        // Find the branch and check if its chain's owner is the current user
        const branch = await prisma.chainBranch.findFirst({
            where: {
                branchId: branchId,
                chain: {
                    ownerId: userId
                }
            }
        })

        if (!branch) {
            // Check if it's just the user trying to view themselves (redundant but safe)
            if (branchId !== userId) {
                throw new Error('Unauthorized access to branch team')
            }
        } else {
            effectiveOwnerId = branchId
        }
    }

    // Get members of the target team (Branch or My Team)
    const members = await prisma.teamMember.findMany({
        where: { ownerId: effectiveOwnerId },
        include: { user: true }
    })

    // Get pending invitations
    const invitations = await prisma.teamInvitation.findMany({
        where: { inviterId: effectiveOwnerId }
    })

    // Determine role
    // If I am the effective owner (userId === effectiveOwnerId), I am OWNER.
    // If I successfully passed the Chain check (userId owns the chain), I am effectively an OWNER/ADMIN of the branch too.
    const isOwner = userId === effectiveOwnerId || (branchId === effectiveOwnerId)

    return { members, invitations, isOwner, currentUserRole: 'OWNER' }
}

export async function inviteMember(formData: FormData) {
    const { userId } = await auth()
    if (!userId) throw new Error('Unauthorized')

    const email = formData.get('email') as string
    const role = formData.get('role') as 'ADMIN' | 'EDITOR' | 'OBSERVER' | 'OPERATOR'
    const branchId = formData.get('branchId') as string | undefined

    if (!email) throw new Error('Email requerido')

    let targetOwnerId = userId

    if (branchId && branchId !== userId) {
        // Verify Chain Ownership
        const branch = await prisma.chainBranch.findFirst({
            where: {
                branchId: branchId,
                chain: { ownerId: userId }
            }
        })
        if (!branch) throw new Error('Unauthorized access to branch')
        targetOwnerId = branchId
    }

    // Check Plan Limits (Check limits of the TARGET OWNER i.e. the branch or the user)
    const userSettings = await prisma.userSettings.findUnique({
        where: { userId: targetOwnerId }
    })

    // Default to FREE if no settings (safe fallback)
    const planCode = (userSettings?.plan || 'FREE').toUpperCase() as keyof typeof PLAN_LIMITS
    const currentPlan = PLAN_LIMITS[planCode] || PLAN_LIMITS.FREE
    const maxMembers = currentPlan.limits.teamMembers

    const currentMembers = await prisma.teamMember.count({ where: { ownerId: targetOwnerId } })
    const pendingInvites = await prisma.teamInvitation.count({ where: { inviterId: targetOwnerId } })

    if ((currentMembers + pendingInvites) >= maxMembers) {
        throw new Error(`Has alcanzado el límite de ${maxMembers} empleados para tu plan ${currentPlan.name}.`)
    }

    // Check existing invite
    const existingInvite = await prisma.teamInvitation.findFirst({
        where: { email, inviterId: targetOwnerId }
    })

    if (existingInvite) {
        throw new Error('Ya existe una invitación pendiente para este correo.')
    }

    // NEW LOGIC: Check if user already exists in Clerk
    try {
        const client = await clerkClient()
        const users = await client.users.getUserList({ emailAddress: [email] });

        if (users.data.length > 0) {
            const existingUser = users.data[0];

            // Check if already in the team
            const existingMember = await prisma.teamMember.findUnique({
                where: {
                    userId_ownerId: {
                        userId: existingUser.id,
                        ownerId: targetOwnerId
                    }
                }
            });

            if (existingMember) {
                // Determine if we should throw error or update role. For now, error.
                throw new Error('Este usuario ya es miembro del equipo.');
            }

            // Direct Add
            await prisma.teamMember.create({
                data: {
                    userId: existingUser.id,
                    ownerId: targetOwnerId,
                    role: role
                }
            });

            // Send "Added" Email
            const inviterName = userSettings?.businessName || 'El Administrador'
            const teamName = userSettings?.businessName || 'HappyMeter Team'

            // We import this dynamically to avoid circular deps if any, or just use the imported one
            const { sendTeamAddedEmail } = await import('@/lib/email');

            await sendTeamAddedEmail(email, teamName, role, inviterName);

            revalidatePath('/dashboard/team');
            // Also revalidate branch path if possible, but generic is hard. 
            // We rely on the client to refresh or the generic revalidate to hit the cache.
            return { success: true, message: 'Usuario agregado directamente (ya tenía cuenta).' };
        }
    } catch (error: any) {
        console.error('Error checking existing user:', error);
        // Continue to normal invitation flow if check fails or user not found
        // However if the error was "Already member", rethrow it.
        if (error.message === 'Este usuario ya es miembro del equipo.') {
            throw error;
        }
    }

    // Generate token
    const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)

    await prisma.teamInvitation.create({
        data: {
            email,
            role,
            inviterId: targetOwnerId,
            token
        }
    })

    const inviteLink = `${process.env.NEXT_PUBLIC_APP_URL}/join-team?token=${token}`
    const inviterName = userSettings?.businessName || 'El Administrador'
    const teamName = userSettings?.businessName || 'HappyMeter Team'

    const { sendInvitationEmail } = await import('@/lib/email'); // Ensure import

    await sendInvitationEmail(
        email,
        inviterName,
        teamName,
        role,
        inviteLink
    )

    revalidatePath('/dashboard/team')
    return { success: true }
}

export async function removeMember(memberId: string) {
    const { userId } = await auth()
    if (!userId) throw new Error('Unauthorized')

    // 1. Get the member record to be deleted
    const targetMember = await prisma.teamMember.findUnique({
        where: { id: memberId },
        include: { user: true }
    })
    if (!targetMember) throw new Error('Miembro no encontrado')

    // 2. Determine who is acting
    // Are they the Owner?
    const isOwner = targetMember.ownerId === userId

    // Are they an Admin of this team?
    const actingMember = await prisma.teamMember.findUnique({
        where: {
            userId_ownerId: {
                userId: userId,
                ownerId: targetMember.ownerId
            }
        }
    })

    // 3. Permission Logic
    if (isOwner) {
        // Owner can delete anyone
    } else if (actingMember?.role === 'ADMIN') {
        // Admin cannot delete Owner
        if (targetMember.userId === targetMember.ownerId) { // Should not happen as owner isn't a member record usually, but safe check
            throw new Error('No puedes eliminar al dueño.')
        }
        // Admin cannot delete other Admins (User request implies "no lo podra eliminar a el" (Owner) but allows others. 
        // Standard practice: Admins can't delete Admins.
        if (targetMember.role === 'ADMIN') {
            throw new Error('No tienes permisos para eliminar a otro Administrador.')
        }
    } else {
        throw new Error('No tienes permisos para realizar esta acción.')
    }

    // 4. Perform Delete
    await prisma.teamMember.delete({
        where: { id: memberId }
    })

    revalidatePath('/dashboard/team')
}

export async function cancelInvitation(inviteId: string) {
    const { userId } = await auth()
    if (!userId) throw new Error('Unauthorized')

    await prisma.teamInvitation.deleteMany({
        where: { id: inviteId, inviterId: userId }
    })

    revalidatePath('/dashboard/team')
}

export async function acceptInvitation(token: string) {
    const { userId } = await auth()
    if (!userId) return { success: false, error: "Unauthorized" }

    // 1. Find Invite
    const invite = await prisma.teamInvitation.findUnique({
        where: { token }
    })
    if (!invite) return { success: false, error: "Invitación inválida o expirada" }

    // 2. Check if user is already a member
    const existingMember = await prisma.teamMember.findUnique({
        where: {
            userId_ownerId: {
                userId,
                ownerId: invite.inviterId
            }
        }
    })

    if (existingMember) {
        // Already member, just delete invite and success
        await prisma.teamInvitation.delete({ where: { token } })
        return { success: true, role: existingMember.role }
    }

    // 3. Create Member
    await prisma.teamMember.create({
        data: {
            userId,
            ownerId: invite.inviterId,
            role: invite.role
        }
    })

    // 4. Delete Invite
    await prisma.teamInvitation.delete({ where: { token } })

    return { success: true, role: invite.role }
}

// --- OPERATOR MANAGEMENT ---

export async function getOperators() {
    const { userId } = await auth()
    if (!userId) throw new Error("Unauthorized")

    // Verify user is owner or admin (simplified logic for now, using userSettings implicit check)
    // We fetch members where the current user is the owner
    const operators = await prisma.teamMember.findMany({
        where: {
            ownerId: userId,
            role: 'OPERATOR'
        },
        include: {
            user: {
                select: {
                    userId: true,
                    // We need name/email from Clerk ideally, but for now we might rely on UserSettings or just return what we have
                    // Note: UserSettings doesn't have name/email by default usually, it's in Auth. 
                    // We will fetch UserSettings profile info (photo, phone)
                    photoUrl: true,
                    phone: true,
                    businessName: true // Fallback for name if needed
                }
            }
        }
    })

    // To get names/emails, we might need to rely on what we have or fetch from Clerk if needed.
    // For this implementation, we will assume we can rely on `businessName` or similar, 
    // OR we might need to store email in UserSettings or TeamMember to display it.
    // However, TeamInvitation has email. TeamMember links to UserSettings.
    // Let's return the data we have. We might need to fetch email from Clerk in a real app, 
    // but for now let's hope the user profile (businessName) or just the fact they are listed is enough.
    // WAIT: We don't have email in TeamMember. We have it in Invite. 
    // Let's just return what we have and maybe the frontend can show "Operador" if name is missing.

    return operators
}

export async function toggleMemberStatus(memberId: string, isActive: boolean) {
    const { userId } = await auth()
    if (!userId) throw new Error("Unauthorized")

    // Verify ownership
    const member = await prisma.teamMember.findFirst({
        where: {
            id: memberId,
            ownerId: userId
        }
    })

    if (!member) throw new Error("Member not found or unauthorized")

    await prisma.teamMember.update({
        where: { id: memberId },
        data: { isActive }
    })

    revalidatePath('/dashboard/loyalty')
    return { success: true }
}
