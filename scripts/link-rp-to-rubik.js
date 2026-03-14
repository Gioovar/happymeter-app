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

  console.log("Rubik branch found:", rubik ? rubik.businessName : 'not found', "ID:", rubik ? rubik.userId : 'none');

  if (rubik) {
    const phone = '5574131657';
    // Create promoter profile for Rubik
    const newProfile = await prisma.promoterProfile.create({
      data: {
        businessId: rubik.userId,
        name: "Apple Review Test",
        phone: phone,
        slug: "apple-test-" + Date.now().toString().slice(-4),
        branchId: rubik.userId,
        isActive: true,
        commissionType: "PER_PERSON",
        commissionValue: 0
      }
    });
    console.log("Created missing profile for Rubik:", newProfile.id);
  }
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
