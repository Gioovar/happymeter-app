
import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'

// Next.js 15/16: Params are a Promise
export async function GET(req: Request, { params }: { params: Promise<{ threadId: string }> }) {
    try {
        const { threadId } = await params
        const { userId } = await auth()
        if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

        // 1. Fetch thread to ensure ownership
        const thread = await prisma.chatThread.findUnique({
            where: { id: threadId }
        })

        if (!thread) {
            return NextResponse.json({ error: "Thread not found in DB" }, { status: 404 })
        }

        if (thread.userId !== userId) {
            return NextResponse.json({ error: "Forbidden: Not your thread" }, { status: 403 })
        }

        // 2. Fetch messages
        const messages = await prisma.chatMessage.findMany({
            where: { threadId: threadId },
            orderBy: { createdAt: 'asc' }
        })

        return NextResponse.json({ ...thread, messages })

    } catch (error: any) {
        console.error('[THREAD_GET]', error)
        return NextResponse.json({ error: error.message || String(error) }, { status: 500 })
    }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ threadId: string }> }) {
    try {
        const { threadId } = await params
        const { userId } = await auth()
        if (!userId) return new NextResponse("Unauthorized", { status: 401 })

        // 1. Manually delete messages (safest approach)
        await prisma.chatMessage.deleteMany({
            where: { threadId: threadId }
        })

        // 2. Delete thread using deleteMany to combine ownership check + delete
        const result = await prisma.chatThread.deleteMany({
            where: {
                id: threadId,
                userId: userId
            }
        })

        if (result.count === 0) {
            return new NextResponse("Not Found", { status: 404 })
        }

        return new NextResponse(null, { status: 204 })

    } catch (error: any) {
        console.error('[THREAD_DELETE]', error)
        return NextResponse.json({ error: error.message || String(error) }, { status: 500 })
    }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ threadId: string }> }) {
    try {
        const { threadId } = await params
        const { userId } = await auth()
        const { title } = await req.json()
        if (!userId) return new NextResponse("Unauthorized", { status: 401 })

        const thread = await prisma.chatThread.findUnique({ where: { id: threadId } })
        if (!thread || thread.userId !== userId) return new NextResponse("Not Found", { status: 404 })

        const updated = await prisma.chatThread.update({
            where: { id: threadId },
            data: { title }
        })

        return NextResponse.json(updated)

    } catch (error) {
        console.error('[THREAD_PATCH]', error)
        return new NextResponse("Internal Error", { status: 500 })
    }
}
