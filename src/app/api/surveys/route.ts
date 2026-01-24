import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { PLAN_LIMITS } from '@/lib/plans'

export async function GET(req: Request) {
    console.time('Surveys API Total')
    try {
        const { userId } = await auth()
        if (!userId) return new NextResponse("Unauthorized", { status: 401 })

        // --- Context Switching Logic ---
        let targetUserIds = [userId];

        // Check for 'branchId' query param to support delegated access
        const { searchParams } = new URL(req.url);
        const branchId = searchParams.get('branchId');

        if (branchId) {
            // Security Check: Verify I own this branch
            const isOwner = await prisma.chainBranch.findFirst({
                where: {
                    branchId: branchId,
                    chain: { ownerId: userId }
                }
            });

            if (!isOwner) {
                return new NextResponse("Unauthorized: You do not own this branch", { status: 403 })
            }

            // Valid context switch
            targetUserIds = [branchId];
        } else {
            // If no branchId is specified (Root Dashboard), fetch ALL surveys owned by this user (Personal + Branches)
            // 1. Get all chains owned by user
            const userChains = await prisma.chain.findMany({
                where: { ownerId: userId },
                include: { branches: true }
            })

            // 2. Extract branch IDs
            const branchIds = userChains.flatMap(chain => chain.branches.map(b => b.branchId))

            // 3. Add to targets
            if (branchIds.length > 0) {
                targetUserIds = [...targetUserIds, ...branchIds]
            }
        }
        // -------------------------------

        console.time('DB Fetch Surveys')
        const surveys = await prisma.survey.findMany({
            where: {
                userId: { in: targetUserIds }
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
        }

        // --- Context Switching Logic for POST ---
        let targetUserId = userId;
        const { searchParams } = new URL(req.url);
        const branchId = searchParams.get('branchId');

        if (branchId) {
            const isOwner = await prisma.chainBranch.findFirst({
                where: { branchId: branchId, chain: { ownerId: userId } }
            });
            if (!isOwner) return new NextResponse("Unauthorized Branch Access", { status: 403 })
            targetUserId = branchId;
        }
        // ----------------------------------------


        const body = await req.json()
        const { title, description, questions, bannerUrl, googleMapsUrl, hexColor, socialConfig, recoveryConfig, alertConfig, type = 'SATISFACTION' } = body

        if (!title) {
            return new NextResponse("Title is required", { status: 400 })
        }

        if (!Array.isArray(questions)) {
            return new NextResponse("Questions must be an array", { status: 400 })
        }

        // Get User Plan
        let userSettings = await prisma.userSettings.findUnique({
            where: { userId: targetUserId }
        })

        if (!userSettings) {
            userSettings = await prisma.userSettings.create({
                data: {
                    userId: targetUserId,
                    plan: 'FREE'
                }
            })
        }

        // Check Limits
        const planCode = (userSettings.plan || 'FREE').toUpperCase() as keyof typeof PLAN_LIMITS
        const currentPlan = PLAN_LIMITS[planCode] || PLAN_LIMITS.FREE

        const baseLimit = type === 'STAFF'
            ? currentPlan.limits.staffSurveys
            : currentPlan.limits.satisfactionSurveys

        const limit = baseLimit + (userSettings.extraSurveys || 0)

        const currentCount = await prisma.survey.count({
            where: {
                userId: targetUserId,
                type: type // Check count for specific type
            }
        })

        if (currentCount >= limit) {
            return new NextResponse(
                JSON.stringify({ error: `Has alcanzado el límite de encuestas ${type === 'STAFF' ? 'de personal' : 'de satisfacción'} para tu plan (${currentPlan.name}).` }),
                { status: 403 }
            )
        }

        console.log('[SURVEYS_POST] Creating survey in DB...')
        const survey = await prisma.survey.create({
            data: {
                userId: targetUserId,
                title,
                description,
                type,
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
