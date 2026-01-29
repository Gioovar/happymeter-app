
import { NextResponse } from 'next/server'
import { auth, currentUser } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: Request) {
    try {
        const { userId } = await auth()
        const user = await currentUser()

        if (!userId || !user) {
            return new NextResponse("Unauthorized", { status: 401 })
        }

        // SECURITY CHECK: STRICTLY ENFORCE EMAIL
        const allowedEmail = "gtrendy2017@gmail.com"
        const hasAccess = user.emailAddresses.some(e => e.emailAddress === allowedEmail)

        if (!hasAccess) {
            console.error(`[DANGER_RESET] Unauthorized attempt by ${user.id} (${user.emailAddresses[0]?.emailAddress})`)
            return new NextResponse("Minatitlán 403: Forbidden - You are not the admin.", { status: 403 })
        }

        console.log(`[DANGER_RESET] Authorized reset initiated by ${allowedEmail} (${userId})`)

        // --- ORPHANED DATA CLEANUP (No Relations) ---
        // These tables don't have FK constraints to UserSettings, so we must delete them manually.

        // 1. Surveys
        const deletedSurveys = await prisma.survey.deleteMany({
            where: { userId: { not: userId } }
        })

        // 2. AI Insights
        const deletedInsights = await prisma.aIInsight.deleteMany({
            where: { userId: { not: userId } }
        })

        // 3. Notifications
        const deletedNotifications = await prisma.notification.deleteMany({
            where: { userId: { not: userId } }
        })

        // 4. Chat Threads
        const deletedChats = await prisma.chatThread.deleteMany({
            where: { userId: { not: userId } }
        })

        // --- CORE USER DELETION (Cascades) ---
        // Deleting UserSettings should cascade to:
        // - LoyaltyProgram
        // - FloorPlan (Tables, Reservations)
        // - AffiliateProfile
        // - TeamMembers
        // - Chains
        const deletedUsers = await prisma.userSettings.deleteMany({
            where: { userId: { not: userId } }
        })

        return NextResponse.json({
            success: true,
            message: "Database reset complete. All other users eliminated.",
            stats: {
                surveys: deletedSurveys.count,
                insights: deletedInsights.count,
                notifications: deletedNotifications.count,
                chats: deletedChats.count,
                users: deletedUsers.count
            }
        })

    } catch (error) {
        console.error('[DANGER_RESET_ERROR]', error)
        return new NextResponse(JSON.stringify({ error: String(error) }), { status: 500 })
    }
}
