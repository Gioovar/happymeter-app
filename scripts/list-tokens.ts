import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    const tokens = await prisma.deviceToken.findMany();
    console.log(JSON.stringify(tokens, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
