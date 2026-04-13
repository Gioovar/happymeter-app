export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: Request) {
    try {
        const { userId } = await auth()
        if (!userId) return new NextResponse("Unauthorized", { status: 401 })

        const body = await req.json()
        const { title, description, severity, status, isRecurring, aiSummary } = body

        if (!title || !description) {
            return new NextResponse("Title and Description are required", { status: 400 })
        }

        const ticket = await prisma.issueTicket.create({
            data: {
                businessId: userId,
                title,
                description,
                severity: severity || "MEDIUM",
                status: status || "OPEN",
                isRecurring: isRecurring || false,
                aiSummary: aiSummary || null,
            }
        })

        return NextResponse.json(ticket)

    } catch (error) {
        console.error('[ISSUES_POST]', error)
        return new NextResponse("Internal Error", { status: 500 })
    }
}
