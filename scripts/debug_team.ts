import { prisma } from '../src/lib/prisma';

async function main() {
    console.log("=== CHAIN BRANCHES ===");
    const branches = await prisma.chainBranch.findMany({ select: { id: true, name: true, slug: true, branchId: true } });
    console.log(branches);

    console.log("\n=== TEAM MEMBERS ===");
    const members = await prisma.teamMember.findMany({ select: { id: true, name: true, ownerId: true } });
    console.log(members);

    console.log("\n=== USER SETTINGS ===");
    const userSettings = await prisma.userSettings.findMany({ select: { userId: true, businessName: true } });
    console.log(userSettings.map(u => ({ ...u, id: u.userId.slice(0, 15) })));
}

main().catch(console.error).finally(() => prisma.$disconnect());
