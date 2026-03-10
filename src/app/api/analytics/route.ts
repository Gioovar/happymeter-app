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

        // Get the active context (Cookie or Fallback to userId)
        const { getActiveBusinessId } = await import('@/lib/tenant')
        const activeContextId = await getActiveBusinessId()
        const effectiveUserId = activeContextId || userId

        // --- Context Switching Logic ---
        let targetUserIds: string | string[] = [effectiveUserId];
        const { searchParams } = new URL(request.url)
        const branchId = searchParams.get('branchId')

        if (branchId) {
            const isOwner = await prisma.chainBranch.findFirst({
                where: { branchId: branchId, chain: { ownerId: effectiveUserId } }
            });

            if (!isOwner) {
                // Check if they are a team member with access to this branch
                const isMember = await prisma.teamMember.findFirst({
                    where: { ownerId: branchId, userId: userId }
                });
                if (!isMember) {
                    return new NextResponse("Unauthorized: You do not own this branch", { status: 403 })
                }
            }
            targetUserIds = [branchId];
        } else {
            // Root View: Fetch Owner + All Branches
            const userChains = await prisma.chain.findMany({
                where: { ownerId: effectiveUserId },
                include: { branches: true }
            })
            const branchIds = userChains.flatMap(c => c.branches.map(b => b.branchId))
            if (branchIds.length > 0) {
                targetUserIds = [effectiveUserId, ...branchIds];
            }
        }

        const surveyId = searchParams.get('surveyId')
        const startDateParam = searchParams.get('startDate')
        const endDateParam = searchParams.get('endDate')

        // Call the cached service using the Target User ID (Branch or Self)
        const data = await getCachedAnalyticsData(targetUserIds, surveyId, startDateParam, endDateParam)

        return NextResponse.json(data)

    } catch (error) {
        console.error('[ANALYTICS_GET]', error)
        return new NextResponse("Internal Error", { status: 500 })
    }
}
