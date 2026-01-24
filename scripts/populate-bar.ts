
import { PrismaClient } from '@prisma/client'
import * as dotenv from 'dotenv'

dotenv.config()

const prisma = new PrismaClient()

async function main() {
    const targetUserId = 'user_36GKvPBupsEHF8i5HpMkX3d6cvI'

    // 1. Find or Create "Bar Satisfaction Survey"
    console.log('🍺 Buscando/Creando encuesta de Bar...')

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
        throw new Error('No se encontraron las preguntas adecuadas en la encuesta')
    }

    // 2. Realistic Negative Responses
    const complaints = [
        "El mesero tardó mucho, sugiero que contraten más personal.",
        "El mesero tardó más de 20 minutos en traernos la carta.",
        "Pésimo servicio, esperamos 40 minutos por unas bebidas.",
        "El mesero me cobró propina del 30% a la fuerza, no me siento contento.",
        "Es un abuso que incluyan la propina en la cuenta sin avisar.",
        "Las bebidas tienen mucho hielo y están muy caras para lo que son.",
        "Pedí un mojito y era puro hielo, casi nada de alcohol.",
        "La comida llegó fría a la mesa.",
        "Las papas estaban quemadas y con demasiada sal.",
        "El baño estaba sucio y no había papel.",
        "La música estaba demasiado fuerte, no se podía platicar.",
        "El guardia de la entrada fue muy grosero con nosotros.",
        "Me cobraron un platillo que nunca llegó.",
        "Muy caro para la calidad de la comida.",
        "El ambiente es bueno pero el servicio arruina todo.",
        "No vuelvo a venir, me trataron mal en la recepción."
    ]

    console.log('📉 Insertando quejas realistas...')

    for (const comment of complaints) {
        // Create Response
        await prisma.response.create({
            data: {
                surveyId: survey.id,
                customerName: 'Cliente Anónimo',
                createdAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000), // Last 7 days
                answers: {
                    create: [
                        {
                            questionId: ratingQuestion.id,
                            value: (Math.floor(Math.random() * 3) + 1).toString() // Rating 1-3 (Low)
                        },
                        {
                            questionId: textQuestion.id,
                            value: comment
                        }
                    ]
                }
            }
        })
    }

    console.log(`✅ Se agregaron ${complaints.length} respuestas con quejas al sistema.`)
}

main()
    .then(async () => {
        await prisma.$disconnect()
    })
    .catch(async (e) => {
        console.error(e)
        await prisma.$disconnect()
        process.exit(1)
    })
