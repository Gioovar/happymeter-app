
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
    const survey = await prisma.survey.findFirst({
        where: {
            questions: {
                some: {}
            }
        },
        include: {
            questions: true
        }
    })

    if (!survey) {
        console.log('No survey with questions found')
        return
    }

    const validQuestionId = survey.questions[0].id

    const sources = ['Instagram', 'Google', 'Facebook', 'Recomendación', ' TikTok', 'Otro']

    for (let i = 0; i < 20; i++) {
        const randomSource = sources[Math.floor(Math.random() * sources.length)]
        const rating = Math.floor(Math.random() * 2) + 4 // 4 or 5

        await prisma.response.create({
            data: {
                surveyId: survey.id,
                customerSource: randomSource,
                answers: {
                    create: [
                        {
                            questionId: validQuestionId,
                            value: rating.toString(),
                            // Note: In real app questionId usually links to a real question, 
                            // but for analytics aggregation of source, it might skip question lookup if logic permits.
                            // However, the analytics route maps answers. 
                            // To contain safe side, let's just make sure we are not crashing. 
                            // Actually, the analytics route relies on `customerSource` field on Response model directly now.
                            // So we don't need perfect answers for the source chart to work.
                        }
                    ]
                }
            }
        })
    }

    console.log('Added 20 sample responses with sources.')
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
