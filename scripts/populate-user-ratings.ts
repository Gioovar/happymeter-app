
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('--- Populating User Ratings ---')

    const user = await prisma.userSettings.findFirst()
    if (!user) { console.log('No user found'); return }

    const survey = await prisma.survey.findFirst({
        where: { userId: user.userId },
        include: { questions: true }
    })

    if (!survey) { console.log('No survey found for user'); return }

    const ratingQuestion = survey.questions.find(q => q.type === 'RATING' || q.type === 'EMOJI')
    if (!ratingQuestion) { console.log('No rating question found in survey'); return }

    console.log(`Adding ratings to survey: ${survey.title} (Question: ${ratingQuestion.text})`)

    const ratingsToAdd = ['5', '5', '5', '5', '4', '1', '2'] // Mostly promoters

    for (const val of ratingsToAdd) {
        const response = await prisma.response.create({
            data: {
                surveyId: survey.id,
                customerName: 'Test User',
                answers: {
                    create: {
                        questionId: ratingQuestion.id,
                        value: val
                    }
                }
            }
        })
        console.log(`Created response with rating ${val}`)
    }
}

// Note: The nested create syntax above for answers might need adjustment if response ID isn't auto-generated in the nested context correctly for atomic operations, but usually it works. 
// Actually, `answers: { create: ... }` is correct for one-to-many.

main()
    .catch(e => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
