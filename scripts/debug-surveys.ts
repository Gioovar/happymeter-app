
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    const surveys = await prisma.survey.findMany({
        include: {
            responses: {
                include: {
                    answers: true
                }
            },
            questions: true
        }
    })

    console.log(`Found ${surveys.length} surveys.`)

    for (const survey of surveys) {
        console.log(`\nSurvey: "${survey.title}" (ID: ${survey.id})`)
        console.log(`- Created At: ${survey.createdAt}`)
        console.log(`- Total Responses: ${survey.responses.length}`)

        if (survey.responses.length > 0) {
            console.log(`- Last Response: ${survey.responses[survey.responses.length - 1].createdAt}`)
            const responsesToday = survey.responses.filter(r => {
                const d = new Date(r.createdAt)
                const now = new Date()
                return d.getDate() === now.getDate() && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
            })
            console.log(`- Responses TODAY: ${responsesToday.length}`)

            // Check for rating answers
            const ratingQuestions = survey.questions.filter(q => q.type === 'RATING' || q.type === 'EMOJI' || q.type === 'NPS')
            console.log(`- Rating Questions: ${ratingQuestions.length} (${ratingQuestions.map(q => q.type).join(', ')})`)

            const responsesWithRatings = survey.responses.filter(r =>
                r.answers.some(a => ratingQuestions.some(q => q.id === a.questionId))
            )
            console.log(`- Responses with Rating Answers: ${responsesWithRatings.length}`)
        }
    }
}

main()
    .catch(e => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
