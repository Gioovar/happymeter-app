import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const users = await prisma.user.findMany({
    where: { role: 'PROMOTER' },
    select: { name: true, pin: true, email: true },
    take: 1
  })
  if (users.length > 0) {
    console.log(JSON.stringify(users[0]));
  } else {
    console.log('No promoters found');
  }
}
main().finally(() => process.exit(0));
