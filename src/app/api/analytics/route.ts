export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getCachedAnalyticsData } from '@/lib/analytics-service'

export async function GET(request: Request) {
    try {
        const { userId } = await auth()
        if (!userId) {
            return new NextResponse("Unauthorized", { status: 401 })
        }

        const { searchParams } = new URL(request.url)
        const surveyId = searchParams.get('surveyId')
        const startDateParam = searchParams.get('startDate')
        const endDateParam = searchParams.get('endDate')

        // Call the cached service
        const data = await getCachedAnalyticsData(userId, surveyId, startDateParam, endDateParam)

        return NextResponse.json(data)

    } catch (error) {
        console.error('[ANALYTICS_GET]', error)
        return new NextResponse("Internal Error", { status: 500 })
    }
}
