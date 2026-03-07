import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log("Fetching all offline operators (access codes):");
    const operators = await prisma.teamMember.findMany({
        where: {
            isOffline: true,
            isActive: true
        },
        select: {
            name: true,
            accessCode: true,
            jobTitle: true,
            owner: {
                select: {
                    businessName: true
                }
            }
        }
    });

    operators.forEach(op => {
        console.log(`- ${op.name} (${op.jobTitle}) @ ${op.owner.businessName}: PIN ${op.accessCode}`);
    });
}

main().catch(console.error).finally(() => prisma.$disconnect());
