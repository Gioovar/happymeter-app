import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
    console.time('Surveys API Total')
    try {
        const { userId } = await auth()

        if (!userId) {
            return new NextResponse("Unauthorized", { status: 401 })
        }

        console.time('DB Fetch Surveys')
        const surveys = await prisma.survey.findMany({
            where: {
                userId: userId
            },
            orderBy: {
                createdAt: 'desc'
            },
            select: {
                id: true,
                title: true,
                bannerUrl: true,
                createdAt: true,
                _count: {
                    select: { responses: true }
                },
                responses: {
                    take: 3,
                    orderBy: {
                        createdAt: 'desc'
                    },
                    select: {
                        id: true,
                        createdAt: true,
                        customerName: true,
                        customerPhone: true,
                        customerEmail: true,
                        photo: true,
                        answers: {
                            select: {
                                value: true,
                                question: {
                                    select: {
                                        id: true,
                                        text: true,
                                        type: true
                                    }
                                }
                            }
                        }
                    }
                }
            }
        })
        console.timeEnd('DB Fetch Surveys')

        console.time('JS Processing')
        const processedSurveys = surveys.map((survey: any) => ({
            ...survey,
            responses: survey.responses.map((r: any) => {
                // Logic to extract details similar to analytics
                const nameAnswer = r.answers.find((a: any) =>
                    a.question?.text && a.question.text.toLowerCase().match(/nombre|quién|quien|soy|cliente/)
                )
                const phoneAnswer = r.answers.find((a: any) => {
                    if (!a.question || !a.question.text) return false
                    const text = a.question.text.toLowerCase()
                    return a.question.type === 'PHONE' || text.match(/tel[eé]fono|celular|whatsapp|m[oó]vil/)
                })
                const emailAnswer = r.answers.find((a: any) => {
                    if (!a.question || !a.question.text) return false
                    const text = a.question.text.toLowerCase()
                    return a.question.type === 'EMAIL' || text.match(/email|correo/)
                })
                const photoAnswer = r.answers.find((a: any) => {
                    if (!a.question) return false
                    // Check for IMAGE type or keywords. Also check value looks like URL.
                    const isImageQ = a.question.type === 'IMAGE' || (a.question.text && a.question.text.toLowerCase().match(/foto|imagen|evidencia/))
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
                    photo: r.photo || photoAnswer?.value || null,
                    date: new Date(r.createdAt).toLocaleDateString(),
                    createdAt: r.createdAt.toISOString(),
                    answers: r.answers.map((a: any) => ({
                        ...a,
                        question: {
                            text: a.question?.text || '',
                            type: a.question?.type || ''
                        }
                    }))
                }
            })
        }))
        console.timeEnd('JS Processing')
        console.timeEnd('Surveys API Total')

        return NextResponse.json(processedSurveys)
    } catch (error) {
        console.error('[SURVEYS_GET]', error)
        return new NextResponse("Internal Error", { status: 500 })
    }
}

export async function POST(req: Request) {
    try {
        console.log('[SURVEYS_POST] Starting request')
        const { userId } = await auth()
        console.log('[SURVEYS_POST] UserId:', userId)

        if (!userId) {
            return new NextResponse("Unauthorized", { status: 401 })
            return new NextResponse("Unauthorized", { status: 401 })
        }

        const body = await req.json()
        // console.log('[SURVEYS_POST] Body:', JSON.stringify(body, null, 2)) // Commented out to avoid huge logs
        const { title, description, questions, bannerUrl, googleMapsUrl, hexColor, socialConfig, recoveryConfig, alertConfig } = body

        if (!title) {
            return new NextResponse("Title is required", { status: 400 })
        }

        if (!Array.isArray(questions)) {
            return new NextResponse("Questions must be an array", { status: 400 })
        }

        // Check subscription limits
        let userSettings = await prisma.userSettings.findUnique({
            where: { userId }
        })
        console.log('[SURVEYS_POST] UserSettings found:', userSettings)

        if (!userSettings) {

            userSettings = await prisma.userSettings.create({
                data: {
                    userId,
                    plan: 'PRO',
                    maxSurveys: 1000
                }
            })
        }

        const surveyCount = await prisma.survey.count({
            where: { userId }
        })


        const limit = userSettings?.maxSurveys || 3 // Default to 3 if no settings found

        if (surveyCount >= limit) {
            console.log('[SURVEYS_POST] Limit reached')
            return new NextResponse("Survey limit reached", { status: 403 })
        }

        console.log('[SURVEYS_POST] Creating survey in DB...')
        const survey = await prisma.survey.create({
            data: {
                userId,
                title,
                description,
                bannerUrl,
                googleMapsUrl,
                hexColor,
                socialConfig,
                recoveryConfig,
                alertConfig,
                questions: {
                    create: questions.map((q: any, index: number) => ({
                        text: q.text,
                        type: q.type,
                        options: q.options || [],
                        required: q.required,
                        order: index
                    }))
                }
            }
        })


        return NextResponse.json(survey)
    } catch (error: any) {
        console.error('[SURVEYS_POST] Error:', error)
        return new NextResponse(JSON.stringify({ error: error.message || "Internal Server Error" }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        })
    }
}
