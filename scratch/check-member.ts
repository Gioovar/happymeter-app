import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    const member = await prisma.teamMember.findFirst({
        where: { accessCode: '123456' }
    });
    console.log(member);
}

main().catch(console.error).finally(() => prisma.$disconnect());
