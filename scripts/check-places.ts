
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    const places = await prisma.place.findMany()
    console.log(`Found ${places.length} places:`)
    places.forEach(p => {
        console.log(`- ${p.name} (Active: ${p.isActive}, ID: ${p.id})`)
    })
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect())
