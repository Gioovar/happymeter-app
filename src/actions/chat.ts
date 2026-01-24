'use server'

import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function getChatAttributes(creatorId: string) {
    const { userId } = await auth()
    if (!userId) throw new Error('Unauthorized')

    // Find or create chat logic is simplified here.
    // We assume 1 chat thread per creator for now (AdminChat model)

    let chat = await prisma.adminChat.findFirst({
        where: { creatorId },
        include: { messages: { orderBy: { createdAt: 'asc' } } }
    })

    if (!chat) {
        // If no chat exists, we create one only if we are the creator or an admin starting it.
        // Auto-create for simplicity
        chat = await prisma.adminChat.create({
            data: { creatorId },
            include: { messages: true }
        })
    }

    return chat
}

export async function sendMessage(userId: string, content: string, senderId: string, attachment?: { url: string, type: string }) {
    if (!content.trim() && !attachment) return

    // 1. Resolve Profile ID
    const profile = await prisma.affiliateProfile.findUnique({
        where: { userId: userId },
        select: { id: true, code: true }
    })

    if (!profile) throw new Error('Creator profile not found')

    const creatorProfileId = profile.id

    // Ensure chat exists
    let chat = await prisma.adminChat.findFirst({
        where: { creatorId: creatorProfileId }
    })

    if (!chat) {
        chat = await prisma.adminChat.create({
            data: { creatorId: creatorProfileId }
        })
    }

    await prisma.adminChatMessage.create({
        data: {
            chatId: chat.id,
            content: content || (attachment ? (attachment.type === 'image' ? '📷 Imagen' : '📎 Archivo') : ''),
            senderId,
            attachmentUrl: attachment?.url,
            attachmentType: attachment?.type
        }
    })

    // Update Chat timestamp
    await prisma.adminChat.update({
        where: { id: chat.id },
        data: { updatedAt: new Date() }
    })

    // Notify Staff if sender is the creator
    if (senderId === userId) {
        const { sendCreatorMessageAlert } = await import('@/lib/alerts')
        await sendCreatorMessageAlert(profile.code || userId, content || (attachment ? 'Adjunto' : '...'))
    }

    revalidatePath(`/admin/creators/${creatorProfileId}`)
    revalidatePath(`/creators/dashboard`)
    return { success: true }
}

export async function getMyChat() {
    const { userId } = await auth()
    if (!userId) throw new Error('Unauthorized')

    // Resolve Profile ID
    const profile = await prisma.affiliateProfile.findUnique({
        where: { userId },
        select: { id: true }
    })

    if (!profile) return null // Or create? But profile should exist for dashboard access.

    let chat = await prisma.adminChat.findFirst({
        where: { creatorId: profile.id },
        include: { messages: { orderBy: { createdAt: 'asc' } } }
    })

    if (!chat) {
        chat = await prisma.adminChat.create({
            data: { creatorId: profile.id },
            include: { messages: true }
        })
    }

    return chat
}
