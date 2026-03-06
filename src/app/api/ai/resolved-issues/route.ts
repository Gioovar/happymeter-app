import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: Request) {
    try {
        const { userId } = await auth()
        if (!userId) return new NextResponse("Unauthorized", { status: 401 })

        const body = await req.json()
        const { issueSummary, originalContext, status } = body

        if (!issueSummary) {
            return new NextResponse("Issue summary is required", { status: 400 })
        }

        const resolvedIssueObj = await prisma.resolvedIssue.create({
            data: {
                businessId: userId,
                issueSummary,
                originalContext,
                status: status || "RESOLVED"
            }
        })

        return NextResponse.json(resolvedIssueObj)

    } catch (error: any) {
        console.error('[RESOLVED_ISSUE_API_ERROR]', error)
        return new NextResponse("Internal Server Error", { status: 500 })
    }
}

export async function GET(req: Request) {
    try {
        const { userId } = await auth()
        if (!userId) return new NextResponse("Unauthorized", { status: 401 })

        const { searchParams } = new URL(req.url)
        const status = searchParams.get('status')

        const issues = await prisma.resolvedIssue.findMany({
            where: {
                businessId: userId,
                ...(status ? { status } : {})
            },
            orderBy: { createdAt: 'desc' }
        })

        return NextResponse.json(issues)

    } catch (error: any) {
        console.error('[RESOLVED_ISSUE_GET_ERROR]', error)
        return new NextResponse("Internal Server Error", { status: 500 })
    }
}
