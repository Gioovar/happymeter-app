const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    where: { role: 'PROMOTER' },
    select: { name: true, pin: true, email: true },
    take: 1
  });
  if (users.length > 0) {
    console.log(users[0]);
  } else {
    console.log('No promoters found');
  }
}
main().finally(() => prisma.$disconnect());
