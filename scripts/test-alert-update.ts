
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    const survey = await prisma.survey.findFirst()
    if (!survey) {
        console.log('No survey found')
        return
    }

    console.log('Found survey:', survey.id)

    try {
        const updated = await prisma.survey.update({
            where: { id: survey.id },
            data: {
                alertConfig: {
                    enabled: true,
                    emails: ['test@example.com'],
                    phones: [],
                    threshold: 2
                }
            }
        })
        console.log('Update successful:', updated.alertConfig)
    } catch (e) {
        console.error('Update failed:', e)
    }
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect())
