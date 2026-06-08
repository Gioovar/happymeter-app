import { prisma } from '../src/lib/prisma';

// List of all models in the correct bottom-up dependency order to prevent foreign key errors
const MODELS_TO_DELETE = [
    // 1. Survey responses and details
    'answer',
    'productReview',
    
    // 2. Loyalty events, visits, campaigns
    'loyaltyRedemption',
    'loyaltyVisit',
    'loyaltyEvent',
    'notificationLog',
    'loyaltyCustomer',
    'loyaltyRule',
    'loyaltyReward',
    'loyaltyTier',
    'loyaltyPromotion',
    'loyaltyNotification',
    'loyaltyCampaign',
    'loyaltyProgram',

    // 3. Checklist processes and evidence
    'processEvidence',
    'processTaskChatMessage',
    'processTaskChat',
    'processTask',
    'processZone',
    'processTemplateTask',
    'processTemplate',

    // 4. Reservations and floorplans
    'reservation',
    'table',
    'floorPlan',

    // 5. Chains and branches
    'chainBranch',
    'chain',

    // 6. Promoters
    'promoterSettlement',
    'promoterProfile',
    'promoterEvent',

    // 7. Products and categories
    'product',
    'productSubCategory',
    'productCategory',
    'menuPromotion',

    // 8. Surveys and questions
    'issueTicket',
    'response',
    'question',
    'survey',

    // 9. AI Insights and growth scores
    'restaurantHealthScore',
    'restaurantReputationScore',
    'aIGrowthOpportunity',
    'aIMarketingCampaign',
    'resolvedIssue',

    // 10. Academy lessons
    'userLessonProgress',
    'lesson',
    'module',
    'course',

    // 11. Representatives
    'representativeCommission',
    'representativePayout',
    'representativeProfile',

    // 12. Affiliate commissions
    'commission',
    'payout',
    'referral',
    'affiliateProfile',

    // 13. System and brand logs
    'linkClick',
    'brandAsset',
    'sale',
    'notification',
    'chatMessage',
    'chatThread',
    'aIInsight',
    
    // 14. Team management and accounts
    'teamMember',
    'teamInvitation',
    'pushSubscription',
    'deviceToken',
    'userSettings',
    'globalPromoter',

    // 15. Independent tables
    'systemSettings',
    'auditLog',
    'coupon',
    'placeVisit',
    'place',
    'creatorAchievement',
    'achievement',
    'creatorReview',
    'adminChatMessage',
    'adminChat',
    'sellerLead'
];

async function main() {
    console.log('--- PRODUCTION RESET SCRIPT STARTED ---');
    console.log(`Timestamp: ${new Date().toISOString()}`);

    // Safety Gate
    if (process.env.CONFIRM_RESET_PRODUCTION !== 'true') {
        console.error('❌ ERROR: CONFIRM_RESET_PRODUCTION environment variable is not set to "true".');
        console.error('Aborting production reset operation for data safety.');
        process.exit(1);
    }

    console.log('⚠️ SAFETY VERIFIED: CONFIRM_RESET_PRODUCTION=true is set.');
    console.log('Calculating current database record counts...');

    // 1. Gather initial counts
    const initialCounts: Record<string, number> = {};
    for (const model of MODELS_TO_DELETE) {
        try {
            const count = await (prisma as any)[model].count();
            initialCounts[model] = count;
        } catch (e: any) {
            console.warn(`Could not count model "${model}":`, e.message);
        }
    }

    console.log('\n--- CURRENT RECORD COUNTS ---');
    let totalInitialRecords = 0;
    for (const [model, count] of Object.entries(initialCounts)) {
        if (count > 0) {
            console.log(`  ${model}: ${count} records`);
            totalInitialRecords += count;
        }
    }
    console.log(`Total active records to delete: ${totalInitialRecords}\n`);

    if (totalInitialRecords === 0) {
        console.log('Database is already empty. Nothing to clean.');
        return;
    }

    console.log('Executing sequential deletion in correct dependency order...');

    // 2. Perform deletions
    for (const model of MODELS_TO_DELETE) {
        if (initialCounts[model] > 0) {
            console.log(`Deleting records from model "${model}"...`);
            try {
                const result = await (prisma as any)[model].deleteMany({});
                console.log(`  ✓ Deleted ${result.count} records from ${model}.`);
            } catch (e: any) {
                console.error(`❌ Failed to delete from ${model}:`, e.message);
                throw e;
            }
        }
    }

    console.log('\nVerifying post-reset counts (expecting all zeros)...');

    // 3. Verify final counts
    let totalRemainingRecords = 0;
    const finalCounts: Record<string, number> = {};
    for (const model of MODELS_TO_DELETE) {
        try {
            const count = await (prisma as any)[model].count();
            finalCounts[model] = count;
            if (count > 0) {
                console.error(`⚠️ WARNING: ${model} still has ${count} records remaining.`);
                totalRemainingRecords += count;
            }
        } catch (e: any) {
            console.warn(`Could not verify final count for model "${model}":`, e.message);
        }
    }

    if (totalRemainingRecords === 0) {
        console.log('\n✅ SUCCESS: Database has been successfully reset! All target tables are at 0 records.');
        console.log(`Completion Timestamp: ${new Date().toISOString()}`);
    } else {
        console.error(`\n❌ FAILURE: Reset incomplete. ${totalRemainingRecords} records remain in the database.`);
        process.exit(1);
    }
}

main()
    .catch((error) => {
        console.error('❌ Critical reset error:', error);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
