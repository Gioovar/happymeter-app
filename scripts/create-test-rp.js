const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  const TEST_PHONE = '5574131657'; // Pruebas phone from screenshot
  const TEST_PIN = '1234';
  const TEST_EMAIL = 'gio+clerk_test@example.com';

  // Make sure the global promoter exists with a valid PIN
  const globalP = await prisma.globalPromoter.upsert({
    where: { phone: TEST_PHONE },
    update: { pin: TEST_PIN, name: "Apple Review Test", email: TEST_EMAIL },
    create: {
      phone: TEST_PHONE,
      pin: TEST_PIN,
      name: "Apple Review Test",
      email: TEST_EMAIL
    }
  });

  console.log("Global Promoter created/updated:", globalP);
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
