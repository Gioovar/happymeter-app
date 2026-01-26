import { NextResponse } from 'next/server'
import { revalidateTag } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { sendCrisisAlert, sendStaffAlert, sendCustomerReward } from '@/lib/alerts'
import { sendPushNotification } from '@/lib/push-service'

export async function POST(
    req: Request,
    { params }: { params: Promise<{ surveyId: string }> }
) {
    try {
        const { surveyId } = await params
        const body = await req.json()
        const { answers, customer } = body

        if (!surveyId) {
            return new NextResponse("Survey ID required", { status: 400 })
        }

        // Fetch Survey Owner and Plan
        const survey = await prisma.survey.findUnique({
            where: { id: surveyId },
            include: {
                // We need to fetch the owner's plan
                // But Survey model has userId string, not relation to UserSettings directly?
                // Schema check: Survey matches UserSettings via userId? 
                // Actually Survey has userId. UserSettings has userId.
            }
        })

        if (!survey) return new NextResponse("Survey not found", { status: 404 })

        const ownerSettings = await prisma.userSettings.findUnique({
            where: { userId: survey.userId }
        })

        if (!ownerSettings) {
            // Should not happen, but proceed
        } else {
            const { isLimitReached, FREE_PLAN_LIMITS } = await import('@/lib/limits')
            // Check Response Count
            const currentCount = await prisma.response.count({
                where: { surveyId: surveyId }
            })

            if (isLimitReached(currentCount, FREE_PLAN_LIMITS.MAX_SURVEY_RESPONSES, ownerSettings.plan)) {
                return new NextResponse("Has alcanzado el límite de respuestas para el Plan Gratuito (50). Actualiza tu plan para recibir más.", { status: 403 })
            }
        }

        // Create the response
        const response = await prisma.response.create({
            data: {
                surveyId: surveyId,
                customerName: customer?.name || null,
                customerEmail: customer?.email || null,
                customerPhone: customer?.phone || null, // Capture phone
                customerBirthday: customer?.birthday || null, // Capture birthday
                customerSource: customer?.source || null, // Capture source
                photo: body.photo || null, // Save uploaded photo
                answers: {
                    create: answers.map((ans: any) => ({
                        questionId: ans.questionId,
                        value: ans.value
                    }))
                }
            },
            include: { survey: true, answers: { include: { question: true } } }
        })

        // Async Alert Trigger (Don't await to keep response fast)
        // Check if it's a Staff Report (Anonymous Box)
        if (response.survey.title.includes('Buzón')) {
            await sendStaffAlert(response, response.survey, response.answers)
        } else {
            // Standard Customer Alert
            await sendCrisisAlert(response, response.survey, response.answers)
            // Send Reward to Customer
            await sendCustomerReward(response, response.survey, response.answers)
        }

        // Force cache invalidation for real-time dashboard updates
        revalidateTag('analytics-full')

        checkMilestones(response.survey.userId)

        return NextResponse.json(response)

    } catch (error) {
        console.error('[SURVEY_SUBMIT]', error)
        return new NextResponse("Internal Error", { status: 500 })
    }
}

async function checkMilestones(userId: string) {
    try {
        // Count total responses for this user across all their surveys
        const count = await prisma.response.count({
            where: {
                survey: {
                    userId: userId
                }
            }
        })

        const milestones = [1, 10, 50, 100, 500, 1000, 5000, 10000]

        if (milestones.includes(count)) {
            let message = ''
            let title = '¡Nuevo Logro Desbloqueado! 🏆'

            switch (count) {
                case 1:
                    title = '¡Tu Primera Encuesta! 🚀'
                    message = 'Has recibido tu primera respuesta. ¡Este es el comienzo de algo grande!'
                    break
                case 10:
                    message = '¡10 respuestas! Ya estás recolectando feedback valioso.'
                    break
                case 50:
                    message = '¡50 opiniones! Tu base de datos está creciendo.'
                    break
                case 100:
                    title = '¡Centenario de Feedback! 💯'
                    message = '¡Felicidades! Has alcanzado 100 respuestas. Tu compromiso con la calidad es evidente.'
                    break
                default:
                    message = `¡Increíble! Has alcanzado ${count} respuestas totales.`
            }

            await prisma.notification.create({
                data: {
                    userId,
                    type: 'ACHIEVEMENT',
                    title,
                    message,
                    meta: { count }
                }
            })

            await sendPushNotification(userId, {
                title: title,
                body: message,
                url: '/dashboard/achievements', // Assuming there's a page for this
                icon: '/happymeter_logo.png'
            })
        }
    } catch (error) {
        console.error('Failed to check milestones', error)
    }
}
