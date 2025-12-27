'use server'

import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { headers } from 'next/headers'

// In a real app, use an email service like Resend/SendGrid
// For this MVP, we will assume the link is generated and maybe returned or logged.
async function sendInvitationEmail(email: string, token: string, inviterName: string) {
    const inviteLink = `${process.env.NEXT_PUBLIC_APP_URL}/join-team?token=${token}`
    console.log(`[MOCK EMAIL] To: ${email}, Link: ${inviteLink}, From: ${inviterName}`)
    // TODO: Integrate Resend here
}

export async function getTeamData() {
    const { userId } = await auth()
    if (!userId) throw new Error('Unauthorized')

    // Get members of MY team
    const members = await prisma.teamMember.findMany({
        where: { ownerId: userId },
        include: { user: true }
    })

    // Get pending invitations I sent
    const invitations = await prisma.teamInvitation.findMany({
        where: { inviterId: userId }
    })

    return { members, invitations }
}

export async function inviteMember(formData: FormData) {
    const { userId } = await auth()
    if (!userId) throw new Error('Unauthorized')

    const email = formData.get('email') as string
    const role = formData.get('role') as 'ADMIN' | 'EDITOR' | 'OBSERVER'

    if (!email) throw new Error('Email requerido')

    // Check if user exists (Optional: can invite non-users?)
    // Detailed check: Is he already a member?
    // We need to resolve userId from email if they exist, but for invitation we just need email.

    // Check existing invite
    const existingInvite = await prisma.teamInvitation.findFirst({
        where: { email, inviterId: userId }
    })

    if (existingInvite) {
        throw new Error('Ya existe una invitación pendiente para este correo.')
    }

    // Generate token
    const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)

    await prisma.teamInvitation.create({
        data: {
            email,
            role,
            inviterId: userId,
            token
        }
    })

    await sendInvitationEmail(email, token, 'Manager') // You'd pass the actual name

    revalidatePath('/dashboard/team')
    return { success: true }
}

export async function removeMember(memberId: string) {
    const { userId } = await auth()
    if (!userId) throw new Error('Unauthorized')

    // Ensure I own this membership record
    await prisma.teamMember.deleteMany({
        where: { id: memberId, ownerId: userId }
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
