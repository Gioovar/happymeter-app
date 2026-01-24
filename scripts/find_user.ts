
import { prisma } from '../src/lib/prisma'

async function findUser() {
    console.log("Searching for armelzuniga87@gmail.com...")

    // 1. Check Team Invitations
    const invite = await prisma.teamInvitation.findFirst({
        where: { email: 'armelzuniga87@gmail.com' }
    })
    if (invite) {
        console.log("Found in TeamInvitation:", invite)
    }

    // 2. Check Referrals
    const referral = await prisma.referral.findFirst({
        where: { leadEmail: 'armelzuniga87@gmail.com' }
    })
    if (referral) {
        console.log("Found in Referral:", referral)
        if (referral.referredUserId) {
            console.log("Referred User ID:", referral.referredUserId)
            return referral.referredUserId
        }
    }

    // 3. We cannot search UserSettings by email directly.
    // However, we can check all users and see if any metadata helps, but that is heavy.
    // Let's assume the user is asking this because the user might have just signed up on their own.
    // If they signed up via Clerk, we don't have their email in our DB unless we stored it in UserSettings (which we checked and we don't seem to).

    // WAIT! In `src/app/api/auth-callback/route.ts` or `src/lib/auth.ts`, do we store email?
    // Let's check `UserSettings` definition in schema again.
    // It has `notificationPreferences` which might have it? No.

    console.log("Could not find user by email in local DB tables (Invitations, Referrals).")
    return null
}

findUser()
    .catch(console.error)
    .finally(() => prisma.$disconnect())
