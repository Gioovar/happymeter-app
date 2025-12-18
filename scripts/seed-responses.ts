
import { PrismaClient } from '@prisma/client'
import { subDays, addHours } from 'date-fns'

const prisma = new PrismaClient()

async function main() {
    console.log('🌱 Starting Data Seeding...')

    // 1. Get User and Survey
    // We try to find the first user and their first survey.
    // If not found, we can't seed effectively without creating those, 
    // but assuming the user has an account and at least one survey created.
    const user = await prisma.userSettings.findFirst()
    if (!user) {
        console.error("❌ No user found. Please sign up first.")
        return
    }

    let survey = await prisma.survey.findFirst({
        where: { userId: user.userId },
        include: { questions: true }
    })

    if (!survey) {
        console.log("⚠️ No survey found. Creating a generic one...")
        survey = await prisma.survey.create({
            data: {
                userId: user.userId,
                title: "Encuesta General de Satisfacción",
                questions: {
                    create: [
                        { text: "¿Cómo calificarías nuesro servicio?", type: "RATING", order: 1 },
                        { text: "¿Qué tal la velocidad de atención?", type: "RATING", order: 2 },
                        { text: "¿Cómo estuvo la comida?", type: "RATING", order: 3 },
                        { text: "Comentarios adicionales", type: "TEXT", order: 4 }
                    ]
                }
            },
            include: { questions: true }
        })
    }

    console.log(`🎯 Targeting Survey: ${survey.title} (${survey.id})`)

    const questions = survey.questions
    const ratingQuestions = questions.filter(q => q.type === 'RATING' || q.type === 'EMOJI')
    const textQuestion = questions.find(q => q.type === 'TEXT' || q.type === 'LONG_TEXT')

    // 2. Generate 30 Responses
    const responsesToCreate = []

    const commentsPositive = [
        "Excelente servicio, muy amables.",
        "La comida estuvo deliciosa.",
        "Me encantó el ambiente.",
        "Todo perfecto, volveré.",
        "Rápido y bueno."
    ]

    const commentsNegative = [
        "Muy lento el servicio hoy.",
        "La comida estaba fría.",
        "El mesero fue grosero.",
        "Esperé 20 minutos por la cuenta.",
        "Muy ruidoso y sucio."
    ]

    for (let i = 0; i < 35; i++) {
        // Random date in last 30 days
        const daysAgo = Math.floor(Math.random() * 30)
        const date = subDays(new Date(), daysAgo)

        // Randomize satisfaction (70% good, 30% bad)
        const isGood = Math.random() > 0.3

        // Answers
        const answersData = []

        // Fill Ratings
        ratingQuestions.forEach(q => {
            let val = 5
            if (isGood) {
                val = Math.random() > 0.8 ? 4 : 5
            } else {
                val = Math.floor(Math.random() * 3) + 1 // 1, 2, or 3
            }
            answersData.push({
                questionId: q.id,
                value: val.toString()
            })
        })

        // Fill Text (Optional)
        if (textQuestion && Math.random() > 0.5) {
            const comment = isGood
                ? commentsPositive[Math.floor(Math.random() * commentsPositive.length)]
                : commentsNegative[Math.floor(Math.random() * commentsNegative.length)]

            answersData.push({
                questionId: textQuestion.id,
                value: comment
            })
        }

        responsesToCreate.push(
            prisma.response.create({
                data: {
                    surveyId: survey.id,
                    createdAt: date,
                    customerName: `Cliente ${i + 1}`,
                    customerEmail: `cliente${i}@test.com`,
                    answers: {
                        create: answersData
                    }
                }
            })
        )
    }

    await prisma.$transaction(responsesToCreate)

    console.log(`✅ Successfully seeded ${responsesToCreate.length} responses.`)
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
