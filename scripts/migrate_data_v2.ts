
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// CONFIGURATION
const OLD_USER_ID = 'user_36zT5iakWJbn4MQNg76Dvdz4FKa' // mango mango
const NEW_USER_ID = 'user_37SFLGasdoohPrkDVUI05nFppHx' // The one who created "MIGRA"

async function main() {
    console.log(`Starting ROBUST migration (V2) from ${OLD_USER_ID} to ${NEW_USER_ID}...`)

    // 1. Fetch Source Data
    const oldUser = await prisma.userSettings.findUnique({ where: { userId: OLD_USER_ID } })
    if (!oldUser) throw new Error('Old user not found!')

    console.log('0. Releasing Unique Constraints on Old User...')
    // We must clear unique fields that we intend to move
    await prisma.userSettings.update({
        where: { userId: OLD_USER_ID },
        data: {
            stripeCustomerId: null,
            stripeSubscriptionId: null,
        }
    })

    console.log('1. Copying Profile Data to New User...')
    // Update the NEW user with the OLD user's settings (Plan, Business Name, etc.)
    await prisma.userSettings.update({
        where: { userId: NEW_USER_ID },
        data: {
            plan: oldUser.plan,
            maxSurveys: oldUser.maxSurveys,
            businessName: oldUser.businessName,
            isOnboarded: oldUser.isOnboarded,
            phone: oldUser.phone,
            socialLinks: oldUser.socialLinks ?? undefined,
            isPhoneVerified: oldUser.isPhoneVerified,
            phoneVerifiedAt: oldUser.phoneVerifiedAt,
            notificationPreferences: oldUser.notificationPreferences ?? undefined,
            hasSeenTour: oldUser.hasSeenTour,
            industry: oldUser.industry,
            gameConfig: oldUser.gameConfig ?? undefined,
            // Now we can safely move these
            stripeCustomerId: oldUser.stripeCustomerId,
            stripeSubscriptionId: oldUser.stripeSubscriptionId,
            subscriptionStatus: oldUser.subscriptionStatus,
            subscriptionPeriodEnd: oldUser.subscriptionPeriodEnd,
            role: oldUser.role,
            state: oldUser.state,
            city: oldUser.city
        }
    })

    console.log('2. Reassigning Child Data...')

    // Helper to migrate tables
    const migrateTable = async (model: any, name: string, field = 'userId') => {
        const result = await model.updateMany({
            where: { [field]: OLD_USER_ID },
            data: { [field]: NEW_USER_ID }
        })
        console.log(`   - Migrated ${result.count} ${name}`)
    }

    await migrateTable(prisma.survey, 'Surveys')
    await migrateTable(prisma.notification, 'Notifications')
    await migrateTable(prisma.chatThread, 'ChatThreads')
    await migrateTable(prisma.aIInsight, 'AIInsights')
    await migrateTable(prisma.affiliateProfile, 'AffiliateProfiles')
    await migrateTable(prisma.pushSubscription, 'PushSubscriptions')
    await migrateTable(prisma.representativeProfile, 'RepresentativeProfiles')
    await migrateTable(prisma.sale, 'Sales')
    await migrateTable(prisma.teamMember, 'TeamMemberships', 'userId')
    await migrateTable(prisma.teamMember, 'TeamOwnerships', 'ownerId')

    // Responses? They don't have userId, they belong to Survey. So migrating Survey is enough.

    console.log('3. Deleting Old User Profile...')
    // Delete the old user to avoid confusion and clean up
    // We must first delete any dependent data that wasn't migrated (if any).
    // Since we migrated everything attached to userId, it should be safe.

    // Check if anything remains
    const remainingSurveys = await prisma.survey.count({ where: { userId: OLD_USER_ID } })
    if (remainingSurveys === 0) {
        await prisma.userSettings.delete({ where: { userId: OLD_USER_ID } })
        console.log('   - Old User Deleted.')
    } else {
        console.warn('   - WARNING: Some data remains linked to old user. Skipping deletion.')
    }

    console.log('Migration V2 Completed Successfully!')
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
