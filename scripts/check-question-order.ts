import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    try {
        const survey = await prisma.survey.findFirst({
            where: {
                title: {
                    contains: 'PRUEBA 2'
                }
            },
            include: {
                questions: {
                    orderBy: {
                        order: 'asc'
                    }
                }
            }
        })

        if (survey) {
            console.log(`📋 Survey: ${survey.title}`)
            console.log(`🆔 Survey ID: ${survey.id}`)
            console.log(`👤 User ID: ${survey.userId}`)
            console.log('Questions:')
            survey.questions.forEach((q, i) => {
                console.log(`${i + 1}. [${q.type}] ${q.text} (order: ${q.order})`)
            })
        }

    } catch (error) {
        console.error('Error:', error)
    } finally {
        await prisma.$disconnect()
    }
}

main()
