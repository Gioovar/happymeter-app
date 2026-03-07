import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log("Searching Team Members where accessCode is '205985'");
    const members = await prisma.teamMember.findMany({
        where: { accessCode: "205985" }
    });
    console.log("Team Members:", members);

    console.log("\nSearching Users where id contains '205985'");
    const users = await prisma.userSettings.findMany({
        where: { id: { contains: "205985" } }
    });
    console.log("Users:", users);
}

main().catch(console.error).finally(() => prisma.$disconnect());
