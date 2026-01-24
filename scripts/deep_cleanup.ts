
import { prisma } from '../src/lib/prisma';

async function cleanupUser(userId: string) {
    console.log(`Cleaning up User: ${userId}`);

    try {
        // 1. User Owned Data (Standard)
        await prisma.survey.deleteMany({ where: { userId } });
        await prisma.sale.deleteMany({ where: { userId } });
        // Response deletion relies on survey cascade? No, schema says Response -> Survey onDelete: Cascade.
        // So deleting Survey should delete responses. 
        // If not, we have orphaned data. But typically fine.

        await prisma.auditLog.deleteMany({ where: { adminId: userId } });
        await prisma.notification.deleteMany({ where: { userId } });
        await prisma.chatThread.deleteMany({ where: { userId } }); // AI Chat threads
        await prisma.teamMember.deleteMany({ where: { userId } }); // Team membership
        await prisma.pushSubscription.deleteMany({ where: { userId } });

        // 2. Affiliate / Creator Data
        const profile = await prisma.affiliateProfile.findUnique({ where: { userId } });
        if (profile) {
            console.log(`  - Cleaning AffiliateProfile ${profile.id}`);

            // 2.1 Nested Relations of Affiliate

            // Visits & Reviews
            const visits = await prisma.placeVisit.findMany({ where: { creatorId: profile.id }, select: { id: true } });
            const visitIds = visits.map(v => v.id);
            if (visitIds.length > 0) {
                await prisma.creatorReview.deleteMany({ where: { visitId: { in: visitIds } } });
                await prisma.placeVisit.deleteMany({ where: { id: { in: visitIds } } });
            }

            // Achievements
            await prisma.creatorAchievement.deleteMany({ where: { creatorId: profile.id } });

            // Financials
            await prisma.commission.deleteMany({ where: { affiliateId: profile.id } });
            await prisma.payout.deleteMany({ where: { affiliateId: profile.id } });

            // Traffic & Referrals
            await prisma.linkClick.deleteMany({ where: { affiliateId: profile.id } });
            await prisma.referral.deleteMany({ where: { affiliateId: profile.id } });

            // Support
            await prisma.adminChat.deleteMany({ where: { creatorId: profile.id } });

            // Finally Profile
            await prisma.affiliateProfile.delete({ where: { id: profile.id } });
        }

        // 3. Representative Profile?
        const rep = await prisma.representativeProfile.findUnique({ where: { userId } });
        if (rep) {
            await prisma.representativeCommission.deleteMany({ where: { representativeId: rep.id } });
            await prisma.representativePayout.deleteMany({ where: { representativeId: rep.id } });
            await prisma.sellerLead.deleteMany({ where: { representativeId: rep.id } });
            await prisma.referral.deleteMany({ where: { representativeId: rep.id } });
            await prisma.representativeProfile.delete({ where: { id: rep.id } });
        }

        // 4. Delete Settings (The User)
        // Check for Team Ownership relation 'OwnerOf' (TeamMember.ownerId)
        await prisma.teamMember.deleteMany({ where: { ownerId: userId } });

        const deleted = await prisma.userSettings.deleteMany({ where: { userId } });
        if (deleted.count > 0) console.log(`  - Deleted UserSettings`);

    } catch (e: any) {
        console.error(`  ERROR cleaning ${userId}: ${e.message} (Code: ${e.code})`);
    }
}

async function main() {
    console.log('--- DEEP CLEANUP V4 ---');

    // 1. Explicit Targets
    const targetIds = [
        'user_37XJ8NZWuXL5ueSJ6Psk0NZ5BEE',
        'user_37SFLGasdoohPrkDVUI05nFppHx',
        'user_37SQBz71SdimiMBS1JNkSquPX43',
        'user_36GKvPBupsEHF8i5HpMkX3d6cvI',
        'user-hist-luislive',
        'user-hist-ana2024',
        'user-hist-carlosvlogs',
        'user-hist-sofiam',
        'user-hist-martag',
        'user-hist-pedrob',
        'aff_1766100446024',
        'mock_user_SOFIA_STYLE',
        'mock_user_DIEGO_EATS',
        'mock_user_CARLA_FIT'
    ];

    for (const uid of targetIds) {
        await cleanupUser(uid);
    }

    console.log('--- DEEP CLEANUP FINISHED ---');
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
