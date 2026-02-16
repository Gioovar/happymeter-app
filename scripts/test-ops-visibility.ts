import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function testOpsVisibility(ownerId: string) {
    console.log(`Testing Ops visibility for owner: ${ownerId}`);

    // 1. Find all branches owned by this user
    const ownedBranches = await prisma.chainBranch.findMany({
        where: {
            chain: {
                ownerId: ownerId
            }
        },
        select: {
            branchId: true
        }
    });

    const branchIds = ownedBranches.map(b => b.branchId);
    const ownerIds = [ownerId, ...branchIds];
    console.log(`Owner IDs to query: ${ownerIds.join(', ')}`);

    const zones = await prisma.processZone.findMany({
        where: {
            userId: { in: ownerIds }
        },
        select: {
            id: true,
            name: true,
            userId: true
        }
    });

    console.log(`Found ${zones.length} zones:`);
    zones.forEach(z => {
        console.log(`- [${z.userId === ownerId ? 'OWNER' : 'BRANCH'}] ${z.name} (ID: ${z.id}, UserID: ${z.userId})`);
    });

    const hasBranchZone = zones.some(z => z.userId !== ownerId);
    if (hasBranchZone) {
        console.log("✅ SUCCESS: Found zones from branches.");
    } else {
        console.log("❌ FAILURE: No zones found from branches.");
    }
}

// Gabriel Arheaz ID
const OWNER_ID = "user_37SspAObOBtCtERjB21CReDLSdb";

testOpsVisibility(OWNER_ID)
    .catch(console.error)
    .finally(() => prisma.$disconnect());
