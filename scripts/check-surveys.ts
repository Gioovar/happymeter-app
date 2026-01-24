import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    try {
        console.log('🔍 Checking database connection...')

        const surveys = await prisma.survey.findMany({
            include: {
                questions: true,
                _count: {
                    select: { responses: true }
                }
            }
        })

        console.log(`✅ Found ${surveys.length} surveys in database`)

        if (surveys.length > 0) {
            console.log('\n📋 Surveys:')
            surveys.forEach((survey, index) => {
                console.log(`\n${index + 1}. ${survey.title}`)
                console.log(`   ID: ${survey.id}`)
                console.log(`   Questions: ${survey.questions.length}`)
                console.log(`   Responses: ${survey._count.responses}`)
                console.log(`   Created: ${survey.createdAt}`)
            })
        } else {
            console.log('\n⚠️  No surveys found in database')
        }

    } catch (error) {
        console.error('❌ Error:', error)
    } finally {
        await prisma.$disconnect()
    }
}

main()
