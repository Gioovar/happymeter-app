
import { prisma } from '../src/lib/prisma'

async function main() {
    const lastResponse = await prisma.response.findFirst({
        orderBy: { createdAt: 'desc' },
        include: { answers: true }
    })

    console.log('Last Response ID:', lastResponse?.id)
    console.log('Created At:', lastResponse?.createdAt)
    console.log('Customer:', lastResponse?.customerName)
    console.log('Photo Field Length:', lastResponse?.photo ? lastResponse.photo.length : 'NULL')
    console.log('Photo Field Start:', lastResponse?.photo ? lastResponse.photo.substring(0, 50) : 'N/A')
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect())
