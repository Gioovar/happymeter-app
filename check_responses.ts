import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    // Check responses for La Santi Condesa
    const branchSlug = 'lasanticondesa'

    // Find the branch ID
    const branch = await prisma.userSettings.findFirst({
        where: { businessName: { contains: 'Condesa' } }
    });

    console.log('Branch Found:', branch?.businessName, '| ID:', branch?.userId);

    if (branch) {
        // Find responses with this branchId
        const responsesByBranchId = await prisma.response.count({
            where: { branchId: branch.userId }
        });

        console.log(`Responses explicitly linked to branchId ${branch.userId}:`, responsesByBranchId);

        // Find responses where the survey belongs to the branch owner OR are somehow linked to branch
        // Let's check a few recent responses to see their structure
        const recentResponses = await prisma.response.findMany({
            take: 5,
            orderBy: { createdAt: 'desc' },
            include: {
                survey: { select: { title: true, userId: true } }
            }
        });

        console.log('\n--- Sample of Recent Responses ---');
        recentResponses.forEach(r => {
            console.log(`Response ID: ${r.id} | Survey: ${r.survey.title} | SurveyOwner: ${r.survey.userId} | BranchId on Response: ${r.branchId}`);
        });
    }

}

main().catch(console.error).finally(() => prisma.$disconnect())
