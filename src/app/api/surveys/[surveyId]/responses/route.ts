import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { startOfDay, endOfDay } from 'date-fns'

export async function GET(
    req: Request,
    { params }: { params: Promise<{ surveyId: string }> }
) {
    try {
        const { userId } = await auth()
        if (!userId) return new NextResponse("Unauthorized", { status: 401 })

        // Unwrap params (it's a Promise in Next.js 15+ usually, but checking type safety)
        const { surveyId } = await params

        const { searchParams } = new URL(req.url)
        const from = searchParams.get('from')
        const to = searchParams.get('to')
        const limitParam = searchParams.get('limit')
        const sentiment = searchParams.get('sentiment') // HIGH, MEDIUM, LOW

        // Build filtering criteria
        let whereClause: any = {
            surveyId: surveyId,
            survey: { userId: userId } // Ensure ownership
        }

        // Date Filter
        if (from && to) {
            whereClause.createdAt = {
                gte: startOfDay(new Date(from)),
                lte: endOfDay(new Date(to))
            }
        }

        // Sentiment Filter
        // We verify against answers of type RATING or EMOJI
        if (sentiment && sentiment !== 'ALL') {
            let values: string[] = []
            if (sentiment === 'HIGH') values = ['4', '5']
            if (sentiment === 'MEDIUM') values = ['3']
            if (sentiment === 'LOW') values = ['1', '2']

            if (values.length > 0) {
                whereClause.answers = {
                    some: {
                        OR: [
                            { question: { type: 'RATING' }, value: { in: values } },
                            { question: { type: 'EMOJI' }, value: { in: values } }
                        ]
                    }
                }
            }
        }

        const responses = await prisma.response.findMany({
            where: whereClause,
            orderBy: {
                createdAt: 'desc'
            },
            take: limitParam ? parseInt(limitParam) : undefined,
            include: {
                answers: {
                    include: {
                        question: true
                    }
                }
            }
        })

        const processedResponses = responses.map(r => {
            const nameAnswer = r.answers.find(a =>
                a.question?.text.toLowerCase().match(/nombre|quién|quien|soy|cliente/)
            )
            const phoneAnswer = r.answers.find(a => {
                if (!a.question) return false
                const text = a.question.text.toLowerCase()
                return a.question.type === 'PHONE' || text.match(/tel[eé]fono|celular|whatsapp|m[oó]vil/)
            })
            const emailAnswer = r.answers.find(a => {
                if (!a.question) return false
                const text = a.question.text.toLowerCase()
                return a.question.type === 'EMAIL' || text.match(/email|correo/)
            })
            const photoAnswer = r.answers.find(a => {
                if (!a.question) return false
                // Check for IMAGE type or keywords. Also check value looks like URL.
                const isImageQ = a.question.type === 'IMAGE' || a.question.text.toLowerCase().match(/foto|imagen|evidencia/)
                return isImageQ && a.value && (a.value.startsWith('http') || a.value.startsWith('/'))
            })

            const resolvedName = r.customerName || nameAnswer?.value || 'Anónimo'
            const resolvedPhone = r.customerPhone || phoneAnswer?.value || null
            const resolvedEmail = r.customerEmail || emailAnswer?.value || null

            return {
                ...r,
                user: resolvedName,
                customerName: resolvedName,
                phone: resolvedPhone,
                email: resolvedEmail,
                photo: photoAnswer?.value || null,
                date: new Date(r.createdAt).toLocaleDateString(),
                createdAt: r.createdAt.toISOString(),
                answers: r.answers.map(a => ({
                    ...a,
                    question: {
                        text: a.question?.text || '',
                        type: a.question?.type || ''
                    }
                }))
            }
        })

        return NextResponse.json(processedResponses)

    } catch (error) {
        console.error('[SURVEY_RESPONSES_GET]', error)
        return new NextResponse("Internal Error", { status: 500 })
    }
}
