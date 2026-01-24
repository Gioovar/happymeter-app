
import { prisma } from '../src/lib/prisma';

async function main() {
    console.log('--- CLEANING STAFF DATA ---');

    // 1. Delete Demo Places
    const deletedPlaces = await prisma.place.deleteMany({
        where: {
            name: { contains: 'Demo' }
        }
    });
    console.log(`Deleted ${deletedPlaces.count} Demo Places.`);

    // 2. Delete Empty/Orphaned Affiliate Profiles (Creators with no IG/Data)
    // Check specifically for the one found in audit if it looks empty
    const deletedCreators = await prisma.affiliateProfile.deleteMany({
        where: {
            instagram: null,
            tiktok: null,
            youtube: null
        }
    });
    console.log(`Deleted ${deletedCreators.count} Empty Creator Profiles.`);

    // 3. Delete any orphaned Visits (should be cascaded but just in case)
    // (Optional, handled by previous deep cleanup usually)
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
