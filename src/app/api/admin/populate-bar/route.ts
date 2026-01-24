
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
    try {
        const targetUserId = 'user_36GKvPBupsEHF8i5HpMkX3d6cvI'

        // 1. Find or Create "Bar Satisfaction Survey"
        let survey = await prisma.survey.findFirst({
            where: { userId: targetUserId, title: { contains: 'Bar' } }
        })

        if (!survey) {
            survey = await prisma.survey.create({
                data: {
                    userId: targetUserId,
                    title: 'Encuesta de Satisfacción Bar El Refugio',
                    description: 'Danos tu opinión para mejorar.',
                    questions: {
                        create: [
                            { text: '¿Qué te pareció el servicio?', type: 'RATING', order: 1 },
                            { text: 'Comentarios o Sugerencias', type: 'TEXT', order: 2, required: false }
                        ]
                    }
                }
            })
        }

        const textQuestion = await prisma.question.findFirst({
            where: { surveyId: survey.id, type: 'TEXT' }
        })

        const ratingQuestion = await prisma.question.findFirst({
            where: { surveyId: survey.id, type: 'RATING' }
        })

        if (!textQuestion || !ratingQuestion) {
            return NextResponse.json({ error: 'Questions not found' }, { status: 500 })
        }

        // 2. Consistent Feedback Data
        const feedbackData = [
            // ⭐️ 1 STAR (Angry)
            { r: "1", t: "El mesero fue muy grosero y tardó 40 minutos. Pésimo." },
            { r: "1", t: "Me cobraron bebidas que no pedí. Son unos ladrones." },
            { r: "1", t: "La comida estaba fría y sabía vieja. No vuelvo." },
            { r: "1", t: "El baño estaba asqueroso. Cero higiene." },
            { r: "1", t: "Muy caro para lo que ofrecen. Una estafa." },

            // ⭐️⭐️ 2 STARS (Bad)
            { r: "2", t: "El lugar es bonito pero el servicio es lentísimo." },
            { r: "2", t: "Mucho ruido, no se puede platicar. La comida regular." },
            { r: "2", t: "Pedí mi carne término medio y me la trajeron quemada." },

            // ⭐️⭐️⭐️ 3 STARS (Average)
            { r: "3", t: "No está mal, pero he ido a mejores bares por este precio." },
            { r: "3", t: "Bien, pero tardan mucho en traer la cuenta." },
            { r: "3", t: "La música es buena, pero las bebidas tienen mucho hielo." },

            // ⭐️⭐️⭐️⭐️ 4 STARS (Good)
            { r: "4", t: "Buen ambiente, las hamburguesas están ricas." },
            { r: "4", t: "Me gustó, aunque el valet parking tardó un poco." },
            { r: "4", t: "Buena atención de la mesera, muy amable." },

            // ⭐️⭐️⭐️⭐️⭐️ 5 STARS (Excellent)
            { r: "5", t: "¡Me encantó! Definitivamente volveré." },
            { r: "5", t: "El mejor mojito de la ciudad. 10/10." },
            { r: "5", t: "Excelente servicio, nos trataron como reyes." },
            { r: "5", t: "Todo perfecto, la música, la comida y el ambiente." }
        ]

        for (const item of feedbackData) {
            // Create Response
            await prisma.response.create({
                data: {
                    surveyId: survey.id,
                    customerName: 'Cliente Simulado',
                    createdAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000), // Last 7 days
                    answers: {
                        create: [
                            {
                                questionId: ratingQuestion.id,
                                value: item.r
                            },
                            {
                                questionId: textQuestion.id,
                                value: item.t
                            }
                        ]
                    }
                }
            })
        }

        return NextResponse.json({ success: true, count: feedbackData.length })
    } catch (error) {
        console.error(error)
        return NextResponse.json({ error: 'Internal Error' }, { status: 500 })
    }
}

