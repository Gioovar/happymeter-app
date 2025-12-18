
import { NextResponse } from 'next/server'
import { currentUser } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
    try {
        const user = await currentUser()
        if (!user) return new NextResponse("Unauthorized", { status: 401 })

        // Find Affiliate Profile
        let profile = await prisma.affiliateProfile.findUnique({
            where: { userId: user.id },
            include: {
                referrals: true,
                commissions: true
            }
        })

        // Auto-create profile if not exists (for now, open to everyone)
        if (!profile) {
            // Generate code from name or random
            const baseCode = (user.firstName || 'user').toLowerCase().replace(/[^a-z0-9]/g, '')
            const code = `${baseCode}${Math.floor(Math.random() * 1000)}`

            profile = await prisma.affiliateProfile.create({
                data: {
                    userId: user.id,
                    code: code,
                    status: 'PENDING', // Default to PENDING for review
                    commissionRate: 20.0 // Default entry rate
                },
                include: { referrals: true, commissions: true }
            })

            // Send Alert to Admin
            // We import dynamically to avoid circular deps if any, or just use normal import. 
            // Ideally import at top, but let's keep it simple here.
            const { sendCreatorSignupAlert } = require('@/lib/alerts')
            const creatorName = `${user.firstName} ${user.lastName || ''}`.trim()
            const creatorEmail = user.emailAddresses[0]?.emailAddress || 'Unknown'

            // Fire and forget (don't await to not block response)
            sendCreatorSignupAlert(creatorName, creatorEmail, user.id).catch(console.error)
        }

        // Calculate Stats
        const visitors = profile.referrals.length // Simplified: total clicks/leads
        const leads = profile.referrals.filter(r => r.status === 'LEAD').length
        const conversions = profile.referrals.filter(r => r.status === 'CONVERTED').length

        const totalCommission = profile.commissions.reduce((acc, curr) => acc + curr.amount, 0)
        const pendingCommission = profile.commissions
            .filter(c => c.status === 'PENDING')
            .reduce((acc, curr) => acc + curr.amount, 0)

        return NextResponse.json({
            profile,
            stats: {
                visitors,
                leads,
                conversions,
                totalCommission,
                pendingCommission
            }
        })

    } catch (error) {
        console.error('[CREATOR_STATS_GET]', error)
        return new NextResponse("Internal Error", { status: 500 })
    }
}
