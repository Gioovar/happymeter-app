/**
 * Migration Script: Assign existing ProcessZones to first branch
 * 
 * This script assigns all ProcessZones without a branchId to the user's first branch (themselves).
 * This is needed because we added branchId field to ProcessZone model.
 */

import { prisma } from './src/lib/prisma'

async function migrateProcessZones() {
    console.log('Starting ProcessZone migration...')

    // Find all zones without branchId
    const zonesWithoutBranch = await prisma.processZone.findMany({
        where: { branchId: null },
        select: { id: true, userId: true, name: true }
    })

    console.log(`Found ${zonesWithoutBranch.length} zones without branchId`)

    if (zonesWithoutBranch.length === 0) {
        console.log('No zones to migrate. All done!')
        return
    }

    // Group by userId
    const zonesByUser = zonesWithoutBranch.reduce((acc, zone) => {
        if (!acc[zone.userId]) {
            acc[zone.userId] = []
        }
        acc[zone.userId].push(zone)
        return acc
    }, {} as Record<string, typeof zonesWithoutBranch>)

    console.log(`Migrating zones for ${Object.keys(zonesByUser).length} users`)

    // For each user, assign their zones to their own userId (default branch)
    for (const [userId, zones] of Object.entries(zonesByUser)) {
        console.log(`  User ${userId}: Assigning ${zones.length} zones to branch ${userId}`)

        await prisma.processZone.updateMany({
            where: {
                id: { in: zones.map(z => z.id) }
            },
            data: {
                branchId: userId
            }
        })

        console.log(`    ✓ Updated ${zones.length} zones`)
    }

    console.log('Migration complete!')
}

migrateProcessZones()
    .then(() => {
        console.log('✅ All done!')
        process.exit(0)
    })
    .catch((error) => {
        console.error('❌ Migration failed:', error)
        process.exit(1)
    })
