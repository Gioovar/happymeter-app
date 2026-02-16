'use server'

import { auth, clerkClient } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { headers } from 'next/headers'
import { PLAN_LIMITS } from '@/lib/plans'
import { cookies } from 'next/headers' // For potential future use


import { sendInvitationEmail, sendTeamAddedEmail } from '@/lib/email'

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

// Fixed getMembershipContexts to use valid fields
export async function getMembershipContexts(userId: string) {
    const memberships = await prisma.teamMember.findMany({
        where: { userId, isActive: true },
        select: {
            id: true,
            role: true,
            // name and jobTitle DO exist on TeamMember model
            name: true,
            jobTitle: true,
            owner: {
                select: {
                    businessName: true,
                    logoUrl: true,
                    userId: true // This is the branch/owner ID
                }
            }
        }
    })
    return memberships
}


export async function inviteMember(formData: FormData) {
    try {
        const { userId } = await auth()
        if (!userId) throw new Error('Unauthorized')

        const email = (formData.get('email') as string)?.trim().toLowerCase()
        const role = formData.get('role') as 'ADMIN' | 'EDITOR' | 'OBSERVER' | 'OPERATOR'
        const name = formData.get('name') as string | undefined
        const jobTitle = formData.get('jobTitle') as string | undefined
        const phone = formData.get('phone') as string | undefined
        const branchId = formData.get('branchId') as string | undefined
        const branchSlug = formData.get('branchSlug') as string | undefined
        const assignedTaskId = formData.get('assignedTaskId') as string | undefined

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
        } else if (branchSlug) {
            // Resolve Branch ID from Slug
            const branch = await prisma.chainBranch.findFirst({
                where: {
                    slug: branchSlug,
                    chain: { ownerId: userId }
                }
            })
            if (!branch) throw new Error('Sucursal no encontrada o sin acceso')
            targetOwnerId = branch.branchId
        }

        // Check Plan Limits (Check limits of the TARGET OWNER i.e. the branch or the user)
        // BYPASS LIMIT FOR CHAINS: Check if targetOwnerId is a Chain Owner or a Branch
        const isChainOwner = await prisma.chain.findFirst({ where: { ownerId: targetOwnerId } })
        const isChainBranch = await prisma.chainBranch.findFirst({ where: { branchId: targetOwnerId } })

        const isChainContext = !!(isChainOwner || isChainBranch)

        if (!isChainContext) {
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
        } else {
            // Fetch basic settings for email templates if needed, even if unlimited
            // We might need userSettings later for businessName
        }

        // Fetch UserSettings for business name if not fetched above
        const userSettings = await prisma.userSettings.findUnique({
            where: { userId: targetOwnerId }
        })

        // Check existing invite
        const existingInvite = await prisma.teamInvitation.findFirst({
            where: { email, inviterId: targetOwnerId }
        })

        if (existingInvite) {
            // Re-send invitation if it exists, instead of failing
            console.log(`Re-sending invitation to ${email}`)
            // We proceed with the same logic but we'll update the record below
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
                    throw new Error('Este usuario ya es miembro del equipo.');
                }

                // Direct Add
                await prisma.teamMember.create({
                    data: {
                        userId: existingUser.id,
                        ownerId: targetOwnerId,
                        role: role,
                        // Store extra info if provided, even if they have a user account (as overrides or specific to this team)
                        name: name,
                        jobTitle: jobTitle,
                        phone: phone
                    }
                });

                // Send "Added" Email
                const inviterName = userSettings?.businessName || 'El Administrador'
                const teamName = userSettings?.businessName || 'HappyMeter Team'

                await sendTeamAddedEmail(email, teamName, role, inviterName);

                revalidatePath('/dashboard/team');
                return { success: true, message: 'Usuario agregado directamente (ya tenía cuenta).' };
            }
        } catch (error: any) {
            console.error('Error checking existing user:', error);
            if (error.message === 'Este usuario ya es miembro del equipo.') {
                throw error;
            }
        }

        // Generate token
        const isOperator = role === 'OPERATOR'

        let token: string
        if (isOperator) {
            // Generate a 6-digit numeric code
            token = Math.floor(100000 + Math.random() * 900000).toString()

            // Simple collision check (optional but robust)
            const existing = await prisma.teamInvitation.findUnique({ where: { token } })
            if (existing) {
                token = Math.floor(100000 + Math.random() * 900000).toString()
            }
        } else {
            // Standard long token for others
            token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
        }

        // Clean up any existing invitation for this email + inviter to avoid unique constraint error
        if (existingInvite) {
            await prisma.teamInvitation.delete({
                where: { id: existingInvite.id }
            })
        }

        await prisma.teamInvitation.create({
            data: {
                email,
                role,
                inviterId: targetOwnerId,
                token,
                name,
                jobTitle,
                phone,
                meta: assignedTaskId ? { assignedTaskId } : undefined
            }
        })

        const inviteLink = isOperator
            ? `${process.env.NEXT_PUBLIC_APP_URL}/ops/join?token=${token}`
            : `${process.env.NEXT_PUBLIC_APP_URL}/join-team?token=${token}`

        const inviterName = userSettings?.businessName || 'El Administrador'
        const teamName = userSettings?.businessName || 'HappyMeter Team'

        await sendInvitationEmail(
            email,
            inviterName,
            teamName,
            role,
            inviteLink,
            isOperator,
            token, // Use token as the access code
            name,
            jobTitle
        )

        revalidatePath('/dashboard/team')
        return { success: true }
    } catch (error: any) {
        console.error('Error inviting member:', error)
        return { success: false, error: error.message || 'Error desconocido al invitar miembro' }
    }
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

    // Find the invitation first to check permissions
    const invite = await prisma.teamInvitation.findUnique({
        where: { id: inviteId }
    })

    if (!invite) throw new Error('Invitación no encontrada')

    // Verify ownership or chain access
    const isOwner = invite.inviterId === userId
    let isChainOwner = false

    if (!isOwner) {
        const branch = await prisma.chainBranch.findFirst({
            where: {
                branchId: invite.inviterId,
                chain: { ownerId: userId }
            }
        })
        if (branch) isChainOwner = true
    }

    if (!isOwner && !isChainOwner) {
        throw new Error('No tienes permiso para cancelar esta invitación')
    }

    await prisma.teamInvitation.delete({
        where: { id: inviteId }
    })

    revalidatePath('/dashboard/[branchSlug]/processes/team', 'page')
    revalidatePath('/dashboard/team')
}

export async function resendInvitation(inviteId: string) {
    const { userId } = await auth()
    if (!userId) throw new Error('Unauthorized')

    const invite = await prisma.teamInvitation.findUnique({
        where: { id: inviteId }
    })

    if (!invite) throw new Error('Invitación no encontrada')

    // Verify ownership or chain access
    const isOwner = invite.inviterId === userId
    let isChainOwner = false

    if (!isOwner) {
        const branch = await prisma.chainBranch.findFirst({
            where: {
                branchId: invite.inviterId,
                chain: { ownerId: userId }
            }
        })
        if (branch) isChainOwner = true
    }

    if (!isOwner && !isChainOwner) {
        throw new Error('No tienes permiso para reenviar esta invitación')
    }

    const userSettings = await prisma.userSettings.findUnique({
        where: { userId: invite.inviterId }
    })

    // Update token to refresh it
    const isOperator = invite.role === 'OPERATOR'
    let newToken: string
    if (isOperator) {
        newToken = Math.floor(100000 + Math.random() * 900000).toString()
        const existing = await prisma.teamInvitation.findUnique({ where: { token: newToken } })
        if (existing) {
            newToken = Math.floor(100000 + Math.random() * 900000).toString()
        }
    } else {
        newToken = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
    }

    await prisma.teamInvitation.update({
        where: { id: inviteId },
        data: { token: newToken, updatedAt: new Date() }
    })

    const inviteLink = isOperator
        ? `${process.env.NEXT_PUBLIC_APP_URL}/ops/join?token=${newToken}`
        : `${process.env.NEXT_PUBLIC_APP_URL}/join-team?token=${newToken}`

    const inviterName = userSettings?.businessName || 'El Administrador'
    const teamName = userSettings?.businessName || 'HappyMeter Team'

    await sendInvitationEmail(
        invite.email,
        inviterName,
        teamName,
        invite.role,
        inviteLink,
        isOperator,
        newToken,
        invite.name || undefined,
        invite.jobTitle || undefined
    )

    return { success: true }
}

export async function acceptInvitation(token: string) {
    const { userId } = await auth()
    if (!userId) return { success: false, error: "Unauthorized" }

    // 1. Find Invite
    const invite = await prisma.teamInvitation.findUnique({
        where: { token }
    })
    if (!invite) return { success: false, error: "Invitación inválida o expirada" }

    // Check if the current user email matches the invite email
    // We need to fetch the user's email from Clerk or UserSettings to verify
    try {
        const client = await clerkClient()
        const user = await client.users.getUser(userId)
        const primaryEmail = user.emailAddresses.find(e => e.id === user.primaryEmailAddressId)?.emailAddress

        console.log(`[acceptInvitation] User: ${userId}, Email: ${primaryEmail}, Invite Email: ${invite.email}`)

        if (primaryEmail && invite.email && primaryEmail.toLowerCase() !== invite.email.toLowerCase()) {
            console.log(`[acceptInvitation] Email mismatch`)
            return {
                success: false,
                error: "Cuenta incorrecta",
                errorCode: "EMAIL_MISMATCH",
                expectedEmail: invite.email,
                currentEmail: primaryEmail
            }
        }
    } catch (e) {
        console.error(`[acceptInvitation] Error fetching Clerk user:`, e)
        // If we can't fetch user (e.g. offline user trying to accept? but auth() passed), proceed or fail?
        // Offline users shouldn't use this flow usually? 
    }

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
    // Ensure UserSettings exists for the user
    let userSettings = await prisma.userSettings.findUnique({ where: { userId } })
    if (!userSettings) {
        // Fetch user details from Clerk again if needed (we might have done it above)
        try {
            const client = await clerkClient()
            const user = await client.users.getUser(userId)
            const email = user.emailAddresses.find(e => e.id === user.primaryEmailAddressId)?.emailAddress

            userSettings = await prisma.userSettings.create({
                data: {
                    userId,
                    // email field does not exist in UserSettings schema
                    fullName: `${user.firstName || ''} ${user.lastName || ''}`.trim() || invite.name || "Usuario",
                    photoUrl: user.imageUrl,
                    isActive: true
                }
            })
        } catch (e) {
            console.error("[acceptInvitation] Error creating UserSettings:", e)
            return { success: false, error: "Error interno creando perfil de usuario." }
        }
    }

    try {
        await prisma.teamMember.create({
            data: {
                userId,
                ownerId: invite.inviterId,
                role: invite.role,
                name: invite.name,
                jobTitle: invite.jobTitle,
                phone: invite.phone
            }
        })
    } catch (error: any) {
        console.error("[acceptInvitation] Error creating team member:", error)
        if (error.code === 'P2002') {
            return { success: false, error: "Ya eres miembro de este equipo (Unique Constraint)." }
        }
        return { success: false, error: `Error al crear miembro: ${error.message}` }
    }

    // 4. Delete Invite
    await prisma.teamInvitation.delete({ where: { token } })

    // 5. Handle Post-Acceptance Actions (e.g. Task Assignment)
    if (invite.meta && typeof invite.meta === 'object' && !Array.isArray(invite.meta)) {
        const meta = invite.meta as any;
        if (meta.assignedTaskId) {
            try {
                // Find the new member ID
                const newMember = await prisma.teamMember.findUnique({
                    where: {
                        userId_ownerId: {
                            userId,
                            ownerId: invite.inviterId
                        }
                    }
                })

                if (newMember) {
                    await prisma.processTask.update({
                        where: { id: meta.assignedTaskId },
                        data: { assignedStaffId: newMember.id }
                    })
                    console.log(`[acceptInvitation] Automatically assigned task ${meta.assignedTaskId} to member ${newMember.id}`)
                }
            } catch (error) {
                console.error("[acceptInvitation] Error assigning task from meta:", error)
                // Don't fail the whole acceptance if this optional step fails
            }
        }
    }

    return { success: true, role: invite.role }
}

// --- OPERATOR MANAGEMENT ---

export async function getOperators(branchId?: string) {
    try {
        const { userId } = await auth()
        if (!userId) throw new Error("Unauthorized")

        console.log(`[getOperators] Called with branchId: ${branchId}, userId: ${userId}`)

        // Determine the target owner ID
        // If branchId is provided, use it. Otherwise use current userId.
        let targetOwnerId = branchId || userId

        // If no branchId provided, check if current user is a team member
        // (acting as admin/manager) and use their owner's ID
        if (!branchId) {
            const membership = await prisma.teamMember.findFirst({
                where: { userId: userId },
                select: { ownerId: true }
            })

            console.log(`[getOperators] Membership check:`, membership)

            if (membership) {
                targetOwnerId = membership.ownerId
            }
        }

        console.log(`[getOperators] Final targetOwnerId: ${targetOwnerId}`)

        // Fetch all active team members for this owner/branch
        const operators = await prisma.teamMember.findMany({
            where: {
                ownerId: targetOwnerId,
                isActive: true
            },
            include: {
                user: {
                    select: {
                        userId: true,
                        photoUrl: true,
                        phone: true,
                        businessName: true,
                        fullName: true,
                    }
                }
            },
            orderBy: {
                joinedAt: 'desc'
            }
        })

        console.log(`[getOperators] Found ${operators.length} operators for ownerId ${targetOwnerId}`)

        // Map to ensure a display name exists
        const mappedOperators = operators.map(op => ({
            ...op,
            user: op.user ? {
                ...op.user,
                businessName: op.user.businessName || op.user.fullName || 'Sin Nombre'
            } : null
        }))

        return mappedOperators

    } catch (error) {
        console.error("Error getting operators:", error)
        // Return empty array instead of throwing to prevent UI crash
        return []
    }
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

// --- OFFLINE OPERATORS ---

export async function createOfflineOperator(name: string, branchId?: string) {
    try {
        const { userId } = await auth()
        if (!userId) throw new Error("Unauthorized")

        // Resolve owner - use branchId if provided, otherwise use userId
        let targetOwnerId = branchId || userId

        // If branchId is provided and different from userId, verify access
        if (branchId && branchId !== userId) {
            // Verify Chain Ownership
            const branch = await prisma.chainBranch.findFirst({
                where: {
                    branchId: branchId,
                    chain: { ownerId: userId }
                }
            })
            if (!branch) {
                // Check if I am a member behaving as admin
                const membership = await prisma.teamMember.findFirst({
                    where: { userId: userId },
                    select: { ownerId: true }
                })
                if (membership && membership.ownerId === branchId) {
                    targetOwnerId = branchId
                } else {
                    throw new Error("Unauthorized access to branch")
                }
            }
        } else if (!branchId) {
            // Check if I am a member behaving as admin (original logic)
            const membership = await prisma.teamMember.findFirst({
                where: { userId: userId },
                select: { ownerId: true }
            })
            if (membership) {
                targetOwnerId = membership.ownerId
            }
        }

        // Check Plan Limits
        const isChainOwner = await prisma.chain.findFirst({ where: { ownerId: targetOwnerId } })
        const isChainBranch = await prisma.chainBranch.findFirst({ where: { branchId: targetOwnerId } })

        const isChainContext = !!(isChainOwner || isChainBranch)

        if (!isChainContext) {
            const userSettings = await prisma.userSettings.findUnique({
                where: { userId: targetOwnerId }
            })
            const planCode = (userSettings?.plan || 'FREE').toUpperCase() as keyof typeof PLAN_LIMITS
            const currentPlan = PLAN_LIMITS[planCode] || PLAN_LIMITS.FREE
            const maxMembers = currentPlan.limits.teamMembers

            const currentMembers = await prisma.teamMember.count({ where: { ownerId: targetOwnerId } })
            const pendingInvites = await prisma.teamInvitation.count({ where: { inviterId: targetOwnerId } })

            if ((currentMembers + pendingInvites) >= maxMembers) {
                throw new Error(`Has alcanzado el límite de ${maxMembers} empleados.`)
            }
        }

        // Generate 6 digit pin
        let accessCode = Math.floor(100000 + Math.random() * 900000).toString()

        // Ensure uniqueness
        let isUnique = false
        let attempts = 0
        while (!isUnique && attempts < 5) {
            const existing = await prisma.teamMember.findUnique({ where: { accessCode } })
            if (!existing) {
                isUnique = true
            } else {
                accessCode = Math.floor(100000 + Math.random() * 900000).toString()
                attempts++
            }
        }

        if (!isUnique) throw new Error("Error generando código único, intenta de nuevo.")

        const newMember = await prisma.teamMember.create({
            data: {
                ownerId: targetOwnerId,
                role: 'OPERATOR',
                name: name,
                accessCode: accessCode,
                isOffline: true
            }
        })

        revalidatePath('/dashboard/team')

        // Return success with accessCode
        return { success: true, accessCode: accessCode }
    } catch (error: any) {
        console.error("Error creating offline operator:", error)
        return { success: false, error: error.message || "Error al crear cuenta local" }
    }
}

export async function loginOfflineOperator(accessCode: string) {
    const member = await prisma.teamMember.findUnique({
        where: { accessCode },
        include: {
            owner: {
                select: { businessName: true }
            }
        }
    })

    if (!member) {
        return { success: false, error: "Código inválido" }
    }

    if (!member.isActive) {
        return { success: false, error: "Cuenta desactivada" }
    }

    // Set Cookie
    const cookieStore = await cookies()
    cookieStore.set('operator_session', accessCode, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 30 // 30 days
    })

    return { success: true, member }
}

export async function toggleTeamMemberStatus(memberId: string, isActive: boolean) {
    try {
        const { userId } = await auth()
        if (!userId) throw new Error('Unauthorized')

        // Verify that the current user has access to the member they are trying to toggle
        // Access is allowed if the user is the owner of the team member
        const member = await prisma.teamMember.findUnique({
            where: { id: memberId },
            include: {
                owner: true
            }
        })

        if (!member) throw new Error('Member not found')

        // Check ownership or chain ownership (similar to getTeamData)
        const isOwner = member.ownerId === userId

        // Also check if member.ownerId is a branch of a chain owned by current user
        let isChainOwner = false
        if (!isOwner) {
            const branch = await prisma.chainBranch.findFirst({
                where: {
                    branchId: member.ownerId,
                    chain: { ownerId: userId }
                }
            })
            if (branch) isChainOwner = true
        }

        if (!isOwner && !isChainOwner) {
            throw new Error('Unauthorized to modify team member status')
        }

        const updatedMember = await prisma.teamMember.update({
            where: { id: memberId },
            data: { isActive }
        })

        revalidatePath('/dashboard/[branchSlug]/processes/team', 'page')

        return { success: true, member: updatedMember }
    } catch (error: any) {
        console.error('Error toggling member status:', error)
        return { success: false, error: error.message }
    }
}
