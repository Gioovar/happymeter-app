
import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: Request, { params }: { params: Promise<{ surveyId: string }> }) {
    try {
        const { userId } = await auth()
        if (!userId) return new NextResponse("Unauthorized", { status: 401 })

        const { surveyId } = await params

        const survey = await prisma.survey.findUnique({
            where: { id: surveyId, userId },
            select: { alertConfig: true }
        })

        if (!survey) return new NextResponse("Survey not found", { status: 404 })

        return NextResponse.json(survey.alertConfig || { enabled: false, emails: [], phones: [], threshold: 3 })
    } catch (error) {
        return new NextResponse("Internal Error", { status: 500 })
    }
}

export async function POST(req: Request, { params }: { params: Promise<{ surveyId: string }> }) {
    try {
        const { userId } = await auth()
        if (!userId) return new NextResponse("Unauthorized", { status: 401 })

        const { surveyId } = await params

        const body = await req.json()
        const { enabled, emails, phones, threshold } = body

        // Validate
        const validEmails = Array.isArray(emails) ? emails.filter(e => e.includes('@')) : []
        const validPhones = Array.isArray(phones) ? phones.filter(p => p.length > 5) : []

        const updatedSurvey = await prisma.survey.update({
            where: { id: surveyId, userId },
            data: {
                alertConfig: {
                    enabled: enabled || false,
                    emails: validEmails,
                    phones: validPhones,
                    threshold: threshold || 3
                }
            }
        })

        return NextResponse.json(updatedSurvey.alertConfig)

    } catch (error) {
        console.error('[ALERTS_POST]', error)
        return new NextResponse("Internal Error", { status: 500 })
    }
}
