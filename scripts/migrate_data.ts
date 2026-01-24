
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// CONFIGURATION
const OLD_USER_ID = 'user_36zT5iakWJbn4MQNg76Dvdz4FKa' // mango mango
const NEW_USER_ID = 'user_37SFLGasdoohPrkDVUI05nFppHx' // The one who created "MIGRA"

async function main() {
    console.log(`Starting migration from ${OLD_USER_ID} to ${NEW_USER_ID}...`)

    // 1. Verify existence
    const oldUser = await prisma.userSettings.findUnique({ where: { userId: OLD_USER_ID } })
    const newUser = await prisma.userSettings.findUnique({ where: { userId: NEW_USER_ID } })

    if (!oldUser) throw new Error('Old user not found!')
    if (!newUser) console.log('New user settings found (will be replaced).')

    // 2. Transactional Update
    await prisma.$transaction(async (tx) => {
        // A. Delete the FRESH/EMPTY UserSettings for the new ID (to avoid unique constraint error during rename)
        if (newUser) {
            console.log('Deleting fresh UserSettings for new ID...')
            // We might need to delete related data for the new user if any exists (like the "MIGRA" survey)
            // Rename "MIGRA" survey ownership to temp or delete it? 
            // Better to delete "MIGRA" survey as it was just a marker.
            await tx.survey.deleteMany({ where: { userId: NEW_USER_ID } })

            // Delete the settings
            await tx.userSettings.delete({ where: { userId: NEW_USER_ID } })
        }

        // B. Update the OLD UserSettings to have the NEW User ID
        // This effectively moves the whole account profile to the new credentials
        console.log('Migrating UserSettings profile...')
        await tx.userSettings.update({
            where: { userId: OLD_USER_ID },
            data: { userId: NEW_USER_ID }
        })

        // C. Update Ownership of foreign keys
        // Note: Prisma cascade might verify foreign keys, but since we updated the parent (UserSettings), 
        // if relations rely on `userId`, we might need to update them if they aren't using foreign keys correctly or if we just want to be sure.
        // Actually, in the schema:
        // Survey has `userId`. Relation is not strictly enforced by foreign key always in Prisma unless mapped.
        // Looking at schema: Survey -> `userId` string.

        console.log('Migrating Surveys...')
        await tx.survey.updateMany({
            where: { userId: OLD_USER_ID }, // Wait, updates above might have broken this if they are not linked?
            // Actually, if we update UserSettings.userId, and Survey.userId is a standard column, it is NOT automatically updated unless it's a foreign key with ON UPDATE CASCADE.
            // Prisma usually handles this if we use `connect`, but raw updateMany is manual.
            // However, we ALREADY updated UserSettings.userId.
            // The `OLD_USER_ID` no longer exists in UserSettings table.
            // But the *Referencing Tables* still have `OLD_USER_ID` in their columns.
            data: { userId: NEW_USER_ID }
        })

        console.log('Migrating Notifications...')
        await tx.notification.updateMany({
            where: { userId: OLD_USER_ID },
            data: { userId: NEW_USER_ID }
        })

        console.log('Migrating ChatThreads...')
        await tx.chatThread.updateMany({
            where: { userId: OLD_USER_ID },
            data: { userId: NEW_USER_ID }
        })

        console.log('Migrating AIInsights...')
        await tx.aIInsight.updateMany({
            where: { userId: OLD_USER_ID },
            data: { userId: NEW_USER_ID }
        })

        console.log('Migrating Affiliate Profiles...')
        await tx.affiliateProfile.updateMany({
            where: { userId: OLD_USER_ID },
            data: { userId: NEW_USER_ID }
        })

        // Push Subscriptions
        await tx.pushSubscription.updateMany({
            where: { userId: OLD_USER_ID },
            data: { userId: NEW_USER_ID }
        })

        // Representative Profiles
        await tx.representativeProfile.updateMany({
            where: { userId: OLD_USER_ID },
            data: { userId: NEW_USER_ID }
        })

        // Sales (if any)
        await tx.sale.updateMany({
            where: { userId: OLD_USER_ID },
            data: { userId: NEW_USER_ID }
        })

        // Team Memberships (where this user is a member)
        await tx.teamMember.updateMany({
            where: { userId: OLD_USER_ID },
            data: { userId: NEW_USER_ID }
        })

        // Team Ownerships (where this user is owner)
        await tx.teamMember.updateMany({
            where: { ownerId: OLD_USER_ID },
            data: { ownerId: NEW_USER_ID }
        })

    })

    console.log('Migration completed successfully!')
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
