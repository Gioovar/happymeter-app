
import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: Request) {
    try {
        const { userId } = await auth()
        if (!userId) return new NextResponse("Unauthorized", { status: 401 })

        // Extract branchId from query params
        const url = new URL(req.url)
        const branchId = url.searchParams.get('branchId')

        // Target User: If branchId provided, fetch threads for that branch (sub-account)
        const targetUserId = branchId || userId

        // Auto-Cleanup: Delete threads older than 7 days
        const sevenDaysAgo = new Date()
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

        await prisma.chatThread.deleteMany({
            where: {
                userId: targetUserId,
                updatedAt: {
                    lt: sevenDaysAgo
                }
            }
        })

        const threads = await prisma.chatThread.findMany({
            where: { userId: targetUserId },
            orderBy: { updatedAt: 'desc' },
            take: 20
        })

        return NextResponse.json(threads)
    } catch (error) {
        console.error('[THREADS_GET]', error)
        return new NextResponse("Internal Error", { status: 500 })
    }
}

export async function POST(req: Request) {
    try {
        const { userId } = await auth()
        if (!userId) return new NextResponse("Unauthorized", { status: 401 })

        const body = await req.json().catch(() => ({}))
        const { branchId } = body

        // Create thread for the specific branch context if provided
        const targetUserId = branchId || userId

        const thread = await prisma.chatThread.create({
            data: {
                userId: targetUserId,
                title: "Nuevo Chat"
            }
        })

        return NextResponse.json(thread)
    } catch (error) {
        console.error('[THREADS_POST]', error)
        return new NextResponse("Internal Error", { status: 500 })
    }
}
