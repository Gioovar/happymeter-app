
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('Deleting confirmed duplicates...')

    // IDs identified in the previous step
    const duplicateIds = [
        '86240a2d-7eea-4349-b7c1-08623506d515',
        '69b0b354-6daa-435a-b7d9-5412bb293830'
    ]

    const result = await prisma.response.deleteMany({
        where: {
            id: {
                in: duplicateIds
            }
        }
    })

    console.log(`Deleted ${result.count} duplicate responses.`)
}

main()
    .catch(e => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
