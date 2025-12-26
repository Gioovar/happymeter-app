import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'

export async function processReferralCookie(userId: string) {
    try {
        // 1. Check if user already has a referrer
        const existingReferral = await prisma.referral.findUnique({
            where: { referredUserId: userId }
        })

        if (existingReferral) return // Already attributed

        // 2. Read cookie
        const cookieStore = await cookies()
        const refCode = cookieStore.get('referral_code')?.value

        if (!refCode) return // No referral code

        // 3. Find owner of the code (Affiliate or Representative)
        // Check Affiliate first
        const affiliate = await prisma.affiliateProfile.findUnique({
            where: { code: refCode }
        })

        if (affiliate) {
            await prisma.referral.create({
                data: {
                    affiliateId: affiliate.id,
                    referredUserId: userId,
                    status: 'LEAD'
                }
            })
            return
        }

        // Check Representative
        const representative = await prisma.representativeProfile.findUnique({
            where: { referralCode: refCode }
        })

        if (representative) {
            await prisma.referral.create({
                data: {
                    representativeId: representative.id,
                    referredUserId: userId,
                    status: 'LEAD'
                }
            })
            return
        }

    } catch (error) {
        console.error('Error processing referral cookie:', error)
    }
}
