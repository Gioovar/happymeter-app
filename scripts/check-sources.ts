
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
    const count = await prisma.response.count({
        where: {
            customerSource: {
                not: null
            }
        }
    })

    const sources = await prisma.response.findMany({
        where: {
            customerSource: { not: null }
        },
        select: {
            customerSource: true
        }
    })

    console.log(`Total responses with source: ${count}`)
    console.log('Sources found:', sources)
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
