const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const rubik = await prisma.userSettings.findFirst({
    where: {
      businessName: {
        contains: 'Rubik',
        mode: 'insensitive'
      }
    }
  });

  if (!rubik) { console.log("Rubik not found"); return; }

  const profiles = await prisma.promoterProfile.findMany({
    where: {
      businessId: rubik.userId,
      phone: '5574131657'
    }
  });

  console.log("Profiles for 55 7413 1657 in Rubik:", JSON.stringify(profiles, null, 2));
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
