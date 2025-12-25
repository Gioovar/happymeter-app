'use server'

import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { UserRole } from '@prisma/client'
import { revalidatePath } from 'next/cache'

export async function inviteTeamMember(email: string, role: UserRole, state?: string) {
    const { userId } = await auth()
    if (!userId) throw new Error('Unauthorized')

    // Verify Super Admin
    const currentUser = await prisma.userSettings.findUnique({
        where: { userId }
    })

    if (currentUser?.role !== 'SUPER_ADMIN') {
        throw new Error('Solo los Super Admins pueden invitar miembros.')
    }

    // Check if invitation exists
    const existing = await prisma.teamInvitation.findUnique({
        where: { email }
    })

    if (existing) {
        throw new Error('Ya existe una invitación para este correo.')
    }

    // Create Token
    const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)

    try {
        await prisma.teamInvitation.create({
            data: {
                email,
                role,
                token,
                status: 'PENDING',
                state
            }
        })
    } catch (dbError) {
        console.error('DB Error creating invitation:', dbError)
        throw new Error('Error de base de datos al crear la invitación.')
    }

    revalidatePath('/admin/team')

    // In a real app, we would send an email here.
    // For now, we return the link to the frontend so the admin can copy it.
    const inviteLink = `${process.env.NEXT_PUBLIC_APP_URL || 'https://www.happymeters.com'}/sign-up?email=${email}`

    return { success: true, link: inviteLink }
}

export async function getTeamMembers() {
    const { userId } = await auth()
    if (!userId) throw new Error('Unauthorized')

    // Get Active Members (excluding USER role)
    const members = await prisma.userSettings.findMany({
        where: {
            role: { in: ['ADMIN', 'STAFF', 'SUPER_ADMIN'] }
        },
        orderBy: { createdAt: 'desc' }
    })

    // Get Pending Invitations
    const invitations = await prisma.teamInvitation.findMany({
        orderBy: { createdAt: 'desc' },
        where: { status: 'PENDING' }
    })

    return { members, invitations }
}

export async function deleteInvitation(id: string) {
    const { userId } = await auth()
    if (!userId) throw new Error('Unauthorized')

    const currentUser = await prisma.userSettings.findUnique({ where: { userId } })
    if (currentUser?.role !== 'SUPER_ADMIN') throw new Error('Unauthorized')

    await prisma.teamInvitation.delete({ where: { id } })
    revalidatePath('/admin/team')
    return { success: true }
}
