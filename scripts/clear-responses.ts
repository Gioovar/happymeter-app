
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('🧹 Clearing all survey responses...')

    // Delete all answers first (cascade should handle this, but let's be explicit if needed)
    // Actually schema has onDelete: Cascade for Answers -> Response.
    // So deleting Response is enough.

    const deleted = await prisma.response.deleteMany({}) // Deletes ALL responses

    console.log(`✅ Deleted ${deleted.count} responses.`)
    console.log('✨ Database clean and ready for new tests.')
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
