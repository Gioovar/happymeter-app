const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const phone = '5574131657';
  
  // Find all promoter profiles for this phone or userId
  const profiles = await prisma.promoterProfile.findMany({
    where: {
      OR: [
        { phone: phone },
        { userId: phone }
      ]
    },
    include: {
      business: {
        select: {
          businessName: true
        }
      }
    }
  });

  console.log("Profiles found:", JSON.stringify(profiles, null, 2));
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
