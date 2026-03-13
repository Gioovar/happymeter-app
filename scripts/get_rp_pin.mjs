import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const promoter = await prisma.user.findFirst({
    where: { role: 'PROMOTER' },
    select: { name: true, pin: true, email: true }
  })
  
  if (promoter) {
    console.log(`Found Promoter: ${promoter.name}`)
    console.log(`Email: ${promoter.email}`)
    console.log(`PIN for Apple: ${promoter.pin}`)
  } else {
    console.log('No PROMOTER found in the database. Creating a test one...')
    // We can handle creating one if needed
  }
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect())
