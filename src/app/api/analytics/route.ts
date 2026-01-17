export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getCachedAnalyticsData } from '@/lib/analytics-service'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
    try {
        const { userId } = await auth()
        if (!userId) {
            return new NextResponse("Unauthorized", { status: 401 })
        }

        // --- Context Switching Logic ---
        let targetUserId = userId;
        const { searchParams } = new URL(request.url)
        const branchId = searchParams.get('branchId')

        if (branchId) {
            const isOwner = await prisma.chainBranch.findFirst({
                where: { branchId: branchId, chain: { ownerId: userId } }
            });

            if (!isOwner) {
                return new NextResponse("Unauthorized: You do not own this branch", { status: 403 })
            }
            targetUserId = branchId;
        }

        const surveyId = searchParams.get('surveyId')
        const startDateParam = searchParams.get('startDate')
        const endDateParam = searchParams.get('endDate')

        // Call the cached service using the Target User ID (Branch or Self)
        const data = await getCachedAnalyticsData(targetUserId, surveyId, startDateParam, endDateParam)

        return NextResponse.json(data)

    } catch (error) {
        console.error('[ANALYTICS_GET]', error)
        return new NextResponse("Internal Error", { status: 500 })
    }
}
