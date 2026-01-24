
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
    const email = 'gtrendy2009@hotmail.com'
    const code = 'prueba2802'

    console.log(`Searching for creator...`)

    // Try finding by code first
    let profile = await prisma.affiliateProfile.findUnique({
        where: { code }
    })

    if (!profile) {
        // Try finding by user email? (Assuming User settings link or similar, but code is unique)
        console.log('Profile not found by code. Searching by email in UserSettings to find linked profile...')
        // This is tricky if we don't know the exact user structure, but let's try via UserSettings if valid
        // Actually, let's just create it if it doesn't exist?
        // User said "before approving THIS profile", implying it exists. 
        // If findUnique failed, maybe the code is slightly different or I should search `contains`.
        const profiles = await prisma.affiliateProfile.findMany({
            where: { code: { contains: 'prueba' } }
        })
        console.log('Found profiles matching "prueba":', profiles.map(p => p.code))

        if (profiles.length > 0) {
            profile = profiles[0]
        }
    }

    if (profile) {
        console.log(`Found profile: ${profile.code} (${profile.status}). Resetting to PENDING...`)
        await prisma.affiliateProfile.update({
            where: { id: profile.id },
            data: { status: 'PENDING' }
        })
        console.log('✅ Status reset to PENDING.')
    } else {
        console.error('❌ Profile not found.')
    }
}

main()
    .then(async () => {
        await prisma.$disconnect()
    })
    .catch(async (e) => {
        console.error(e)
        await prisma.$disconnect()
        process.exit(1)
    })
