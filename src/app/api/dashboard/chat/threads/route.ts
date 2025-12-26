
import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: Request) {
    try {
        const { userId } = await auth()
        if (!userId) return new NextResponse("Unauthorized", { status: 401 })

        // Auto-Cleanup: Delete threads older than 7 days
        const sevenDaysAgo = new Date()
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

        await prisma.chatThread.deleteMany({
            where: {
                userId,
                updatedAt: {
                    lt: sevenDaysAgo
                }
            }
        })

        const threads = await prisma.chatThread.findMany({
            where: { userId },
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

        const thread = await prisma.chatThread.create({
            data: {
                userId,
                title: "Nuevo Chat"
            }
        })

        return NextResponse.json(thread)
    } catch (error) {
        console.error('[THREADS_POST]', error)
        return new NextResponse("Internal Error", { status: 500 })
    }
}
