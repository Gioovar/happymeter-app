
import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'

// Next.js 15/16: Params are a Promise
// Helper to verify thread access
async function verifyThreadAccess(threadId: string, requestUserId: string) {
    const thread = await prisma.chatThread.findUnique({
        where: { id: threadId }
    })

    if (!thread) return null

    // 1. Direct Ownership
    if (thread.userId === requestUserId) return thread

    // 2. Branch Ownership Check
    // Check if the thread owner (branch) belongs to a chain owned by requestUser
    const branchRelation = await prisma.chainBranch.findFirst({
        where: {
            branchId: thread.userId,
            chain: {
                ownerId: requestUserId
            }
        }
    })

    if (branchRelation) return thread

    return null
}

export async function GET(req: Request, { params }: { params: Promise<{ threadId: string }> }) {
    try {
        const { threadId } = await params
        const { userId } = await auth()
        if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

        const thread = await verifyThreadAccess(threadId, userId)

        if (!thread) {
            return NextResponse.json({ error: "Not Found or Forbidden" }, { status: 404 })
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

        // Check Access First
        const thread = await verifyThreadAccess(threadId, userId)
        if (!thread) return new NextResponse("Not Found", { status: 404 })

        // 1. Manually delete messages
        await prisma.chatMessage.deleteMany({
            where: { threadId: threadId }
        })

        // 2. Delete thread
        await prisma.chatThread.delete({
            where: { id: threadId }
        })

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

        // Check Access First
        const thread = await verifyThreadAccess(threadId, userId)
        if (!thread) return new NextResponse("Not Found", { status: 404 })

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
