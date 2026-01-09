const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
    console.log('Activating enableFirstVisitGift for all loyalty programs...')

    const result = await prisma.loyaltyProgram.updateMany({
        data: {
            enableFirstVisitGift: true,
            firstVisitGiftText: "¡Un regalo de bienvenida especial para ti!"
        }
    })

    console.log(`Updated ${result.count} loyalty programs.`)
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
