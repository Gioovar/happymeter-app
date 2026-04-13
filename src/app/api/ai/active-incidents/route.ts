export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: Request) {
    try {
        const { userId } = await auth()
        if (!userId) return new NextResponse("Unauthorized", { status: 401 })

        // Fetch active tickets generated specifically by the AI Secret Inspector
        const activeIncidents = await prisma.issueTicket.findMany({
            where: {
                businessId: userId,
                status: "OPEN",
                aiSummary: { not: null } // Indicates it was auto-flagged by AI
            },
            take: 5,
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                title: true,
                aiSummary: true,
                aiContext: true,
                createdAt: true,
            }
        })

        return NextResponse.json(activeIncidents)

    } catch (error: any) {
        console.error('[ACTIVE_INCIDENTS_GET_ERROR]', error)
        return new NextResponse("Internal Server Error", { status: 500 })
    }
}
