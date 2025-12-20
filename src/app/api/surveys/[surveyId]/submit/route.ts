import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendCrisisAlert, sendStaffAlert } from '@/lib/alerts'

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

        // ...

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
        }

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
        }
    } catch (error) {
        console.error('Failed to check milestones', error)
    }
}
