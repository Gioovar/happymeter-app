import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'

export async function GET(
    req: Request,
    { params }: { params: Promise<{ surveyId: string }> }
) {
    try {
        // Public endpoint - no authentication required
        // Anyone with the link can view the survey
        const { surveyId } = await params

        const survey = await prisma.survey.findUnique({
            where: {
                id: surveyId
            },
            include: {
                questions: {
                    orderBy: {
                        order: 'asc'
                    }
                }
            }
        })

        if (!survey) {
            return new NextResponse("Survey not found", { status: 404 })
        }

        // Fetch user settings to get social links
        const userSettings = await prisma.userSettings.findUnique({
            where: { userId: survey.userId },
            select: { socialLinks: true }
        })

        return NextResponse.json({
            ...survey,
            socialLinks: userSettings?.socialLinks || null
        })
    } catch (error) {
        console.error('[SURVEY_GET]', error)
        return new NextResponse("Internal Error", { status: 500 })
    }
}

import { verifySurveyAccess } from '@/lib/survey-access'

export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ surveyId: string }> }
) {
    try {
        const { userId } = await auth()
        if (!userId) {
            return new NextResponse("Unauthorized", { status: 401 })
        }

        const { surveyId } = await params

        const survey = await verifySurveyAccess(surveyId, userId)
        if (!survey) {
            return new NextResponse("Unauthorized or Not Found", { status: 403 })
        }

        await prisma.survey.delete({
            where: {
                id: surveyId
            }
        })

        return NextResponse.json(survey)
    } catch (error) {
        console.error('[SURVEY_DELETE]', error)
        return new NextResponse("Internal Error", { status: 500 })
    }
}

export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ surveyId: string }> }
) {
    try {
        const { userId } = await auth()
        if (!userId) {
            return new NextResponse("Unauthorized", { status: 401 })
        }

        const { surveyId } = await params

        const survey = await verifySurveyAccess(surveyId, userId)
        if (!survey) {
            return new NextResponse("Unauthorized or Not Found", { status: 403 })
        }

        const body = await req.json()
        const { title, description, questions, bannerUrl, googleMapsUrl, hexColor, socialConfig, recoveryConfig } = body

        if (title !== undefined && !title) {
            // Title is required
        }

        // Update survey
        await prisma.survey.update({
            where: {
                id: surveyId
            },
            data: {
                title,
                description,
                bannerUrl,
                googleMapsUrl,
                hexColor,
                socialConfig,
                recoveryConfig
            }
        })

        // 2. Intelligent Question Update (to preserve answers)
        if (questions && Array.isArray(questions)) {
            await prisma.$transaction(async (tx) => {
                // Get current questions from DB
                const currentQuestions = await tx.question.findMany({
                    where: { surveyId },
                    select: { id: true }
                })
                const currentIds = currentQuestions.map(q => q.id)
                const incomingIds = questions
                    .map((q: any) => q.id)
                    .filter((id: string) => currentIds.includes(id))
                const toDelete = currentIds.filter(id => !incomingIds.includes(id))

                if (toDelete.length > 0) {
                    await tx.question.deleteMany({
                        where: { id: { in: toDelete }, surveyId }
                    })
                }

                for (const [index, q] of questions.entries()) {
                    if (q.id && currentIds.includes(q.id)) {
                        await tx.question.update({
                            where: { id: q.id },
                            data: {
                                text: q.text,
                                type: q.type,
                                options: q.options,
                                required: q.required,
                                order: index
                            }
                        })
                    } else {
                        await tx.question.create({
                            data: {
                                surveyId,
                                text: q.text,
                                type: q.type,
                                options: q.options,
                                required: q.required,
                                order: index
                            }
                        })
                    }
                }
            })
        }

        const updatedSurvey = await prisma.survey.findUnique({
            where: { id: surveyId },
            include: { questions: { orderBy: { order: 'asc' } } }
        })

        return NextResponse.json(updatedSurvey)
    } catch (error) {
        console.error('[SURVEY_PATCH]', error)
        return new NextResponse("Internal Error", { status: 500 })
    }
}
