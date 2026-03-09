'use server';

import { prisma } from '@/lib/prisma';
import { getOpsSession } from '@/lib/ops-auth';
import { revalidatePath } from 'next/cache';

export async function getTaskChat(taskId: string) {
    const session = await getOpsSession();
    if (!session.isAuthenticated) return null;

    let chat = await prisma.processTaskChat.findUnique({
        where: { taskId },
        include: {
            messages: {
                orderBy: { createdAt: 'asc' }
            }
        }
    });

    if (!chat) {
        // Create the chat if it doesn't exist
        chat = await prisma.processTaskChat.create({
            data: { taskId },
            include: { messages: true }
        });
    }

    return chat;
}

export async function sendTaskMessage(taskId: string, content: string, role: 'SUPERVISOR' | 'STAFF' | 'SYSTEM') {
    const session = await getOpsSession();
    if (!session.isAuthenticated) throw new Error("Unauthorized");

    if (!content.trim()) return;

    // Use member ID if offline, otherwise user ID
    const senderId = session.member?.id || session.userId;

    if (!senderId) throw new Error("Unauthorized");

    let chat = await prisma.processTaskChat.findUnique({
        where: { taskId }
    });

    if (!chat) {
        chat = await prisma.processTaskChat.create({
            data: { taskId }
        });
    }

    await prisma.processTaskChatMessage.create({
        data: {
            chatId: chat.id,
            content,
            senderId,
            role
        }
    });

    await prisma.processTaskChat.update({
        where: { id: chat.id },
        data: { updatedAt: new Date() }
    });

    revalidatePath(`/ops/supervision/task/${taskId}`);
    revalidatePath(`/ops/tasks/${taskId}`);

    return { success: true };
}
