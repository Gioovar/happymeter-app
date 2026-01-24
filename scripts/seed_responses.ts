
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    // 1. Get the first survey
    const survey = await prisma.survey.findFirst({
        include: {
            questions: true
        }
    })

    if (!survey) {
        console.log('No matching survey found. Please create a survey first.')
        return
    }

    console.log(`Seeding responses for survey: ${survey.title} (${survey.id})`)

    const responsesToCreate = 100
    const now = new Date()
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

    for (let i = 0; i < responsesToCreate; i++) {
        // Random date within last 30 days
        const randomTime = thirtyDaysAgo.getTime() + Math.random() * (now.getTime() - thirtyDaysAgo.getTime())
        const createdAt = new Date(randomTime)

        // Create Response
        const response = await prisma.response.create({
            data: {
                surveyId: survey.id,
                createdAt: createdAt,
                customerName: `Cliente ${i + 1}`,
                customerEmail: `cliente${i + 1}@example.com`
            }
        })

        // Create Answers for each question
        for (const question of survey.questions) {
            let value = ''

            switch (question.type) {
                case 'EMOJI':
                case 'RATING':
                    // Random 1-5
                    value = Math.floor(Math.random() * 5 + 1).toString()
                    break
                case 'YES_NO':
                    value = Math.random() > 0.5 ? 'Sí' : 'No'
                    break
                case 'SELECT':
                    if (question.options && Array.isArray(question.options) && question.options.length > 0) {
                        const opts = question.options as string[]
                        value = opts[Math.floor(Math.random() * opts.length)]
                    } else {
                        value = 'Opción Genérica'
                    }
                    break
                case 'TEXT':
                    value = 'Respuesta de prueba generada automáticamente.'
                    break
                default:
                    value = 'N/A'
            }

            await prisma.answer.create({
                data: {
                    responseId: response.id,
                    questionId: question.id,
                    value: value
                }
            })
        }
    }

    console.log(`Successfully created ${responsesToCreate} responses for survey ${survey.id}`)
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
