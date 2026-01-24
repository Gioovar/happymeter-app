import { prisma } from '../src/lib/prisma'

async function main() {
    console.log(`Clearing qualification data...`)

    // Find the most recent profile
    const profile = await prisma.affiliateProfile.findFirst({
        orderBy: { createdAt: 'desc' }
    })

    if (!profile) {
        console.log('No profile found.')
        return
    }

    console.log(`Found profile: ${profile.id} (User: ${profile.userId})`)

    // Clear data
    await prisma.affiliateProfile.update({
        where: { id: profile.id },
        data: {
            niche: null,
            audienceSize: null,
            contentStrategy: null,
            instagram: null,
            tiktok: null,
            youtube: null
        }
    })

    console.log('Cleared qualification data. Onboarding should now trigger.')
}

main()
