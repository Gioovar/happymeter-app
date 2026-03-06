import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'

// Allow passing specific timeframes. Default: 30 days
export async function GET(req: Request) {
    try {
        const { userId } = await auth()
        if (!userId) return new NextResponse("Unauthorized", { status: 401 })

        const { searchParams } = new URL(req.url)
        const days = parseInt(searchParams.get('days') || '30', 10)

        const startDate = new Date()
        startDate.setDate(startDate.getDate() - days)

        const history = await prisma.restaurantHealthScore.findMany({
            where: {
                businessId: userId,
                createdAt: {
                    gte: startDate
                }
            },
            orderBy: {
                createdAt: 'asc' // Oldest to newest for graphing
            }
        })

        return NextResponse.json(history)

    } catch (error) {
        console.error('[HEALTH_HISTORY_GET]', error)
        return new NextResponse("Internal API Error", { status: 500 })
    }
}
