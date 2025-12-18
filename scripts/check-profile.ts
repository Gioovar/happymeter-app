import { prisma } from '../src/lib/prisma'

async function main() {
    const email = 'gtrendy2009@hotmail.com'

    console.log(`Checking profile for email: ${email}`)

    const profile = await prisma.affiliateProfile.findFirst({
        where: { paypalEmail: email } // Or just check by finding user linked to this email if paypal email not set
        // Actually, user likely has a UserSettings or Clerk ID. 
        // Let's search by userId if we have it, or try to find by some other means.
        // We deleted the profile earlier, so they must have re-registered.
        // The AffiliateProfile might use the email as paypalEmail if they entered it.
    })

    if (!profile) {
        console.log('Profile not found by paypalEmail. Searching all profiles...')
        const all = await prisma.affiliateProfile.findMany({ take: 5, orderBy: { createdAt: 'desc' } })
        console.log('Recent profiles:', all)
        return
    }

    console.log('Found profile:', profile)
    console.log('Niche:', profile.niche)
    console.log('Is Niche Missing?', !profile.niche)
}

main()
