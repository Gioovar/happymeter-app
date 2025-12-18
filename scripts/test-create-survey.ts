import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('Testing survey creation...')
    try {
        // Use a dummy user ID for testing
        const userId = 'test_user_123'

        const survey = await prisma.survey.create({
            data: {
                userId,
                title: 'Test Survey from Script',
                description: 'This is a test',
                questions: {
                    create: [
                        { text: 'Is this working?', type: 'YES_NO', order: 0, required: true }
                    ]
                }
            }
        })
        console.log('Successfully created survey:', survey.id)
    } catch (e) {
        console.error('Failed to create survey:', e)
    } finally {
        await prisma.$disconnect()
    }
}

main()
