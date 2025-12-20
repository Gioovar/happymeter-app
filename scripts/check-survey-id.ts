
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
    const id = '8fcc0b22-982a-413d-a315-549780937bcb'
    console.log(`Checking for survey ID: ${id}`)
    const survey = await prisma.survey.findUnique({
        where: { id }
    })

    if (survey) {
        console.log('✅ Survey FOUND:', survey.title)
        console.log('Valid ID confirmed in current DB.')
    } else {
        console.log('❌ Survey NOT FOUND in this database.')
        console.log('Use "npx vercel env pull .env.local" to ensure you are checking the same DB as production if running locally.')
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect())
