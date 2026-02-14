import { prisma } from '@/lib/prisma'

export async function checkCrisis(surveyId: string, branchId: string) {
    try {
        // CRITERIA: >3 negative ratings (1 or 2 stars) in the last 1 hour
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)

        const negativeResponses = await prisma.response.count({
            where: {
                surveyId: surveyId,
                createdAt: { gte: oneHourAgo },
                answers: {
                    some: {
                        question: { type: 'RATING' },
                        value: { in: ['1', '2'] }
                    }
                }
            }
        })

        if (negativeResponses >= 3) {
            // Check if we already sent a crisis alert recently to avoid spamming
            const recentAlert = await prisma.notification.findFirst({
                where: {
                    userId: branchId,
                    type: 'CRISIS',
                    title: { contains: '🚨 ALERTA DE CRISIS OPERATIVA' },
                    createdAt: { gte: oneHourAgo }
                }
            })

            if (!recentAlert) {
                await prisma.notification.create({
                    data: {
                        userId: branchId,
                        type: 'CRISIS',
                        title: '🚨 ALERTA DE CRISIS OPERATIVA',
                        message: `Se han detectado ${negativeResponses} calificaciones negativas en la última hora. Verifica el estado del servicio inmediatamente.`,
                        meta: { branchId, surveyId }
                    }
                })
            }
        }
    } catch (error) {
        console.error('Error in checkCrisis:', error)
    }
}

export async function checkFraud(surveyId: string, ip: string, branchId: string) {
    if (!ip) return

    try {
        // CRITERIA: >5 submissions from same IP in 10 minutes with 5 stars
        const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000)

        const suspiciousResponses = await prisma.response.count({
            where: {
                surveyId: surveyId,
                createdAt: { gte: tenMinutesAgo },
                // We'd ideally need an IP field on Response, assuming it's passed or we just check rapid submissions
                // For now, let's assume rapid submissions regardless of IP if IP isn't stored, OR check if we can store IP
                // Since schema doesn't have IP, we'll use a proxy check: >5 responses in 10 mins for this survey
                // BETTER: Store IP in meta or just rely on pure volume for now.
                // Let's implement High Volume + High Rating check
                answers: {
                    some: {
                        question: { type: 'RATING' },
                        value: '5'
                    }
                }
            }
        })

        // If we have IP in metadata (we should add it), we can filter better.
        // For now, purely based on volume of 5-star reviews in short time.
        // User requested: > 2 surveys (so 3 or more) in 10 minutes
        if (suspiciousResponses > 2) {
            const recentAlert = await prisma.notification.findFirst({
                where: {
                    userId: branchId,
                    type: 'SYSTEM',
                    title: { contains: '🤖 Posible Anomalía Detectada' },
                    createdAt: { gte: tenMinutesAgo }
                }
            })

            if (!recentAlert) {
                await prisma.notification.create({
                    data: {
                        userId: branchId,
                        type: 'SYSTEM',
                        title: '🤖 Posible Anomalía Detectada',
                        message: `Se han recibido ${suspiciousResponses} calificaciones perfectas en menos de 10 minutos. Verifica que no sea el staff autocalificándose.`,
                        meta: { branchId, surveyId, ip } // storing IP in meta for reference
                    }
                })
            }
        }
    } catch (error) {
        console.error('Error in checkFraud:', error)
    }
}
