import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { currentUser } from '@clerk/nextjs/server'

async function verifySuperAdmin() {
    const user = await currentUser()
    if (!user) return false

    const dbUser = await prisma.userSettings.findUnique({
        where: { userId: user.id }
    })

    const isGod = dbUser?.role === 'SUPER_ADMIN' ||
        user.emailAddresses.some(e => ['armelzuniga87@gmail.com', 'gioovar@gmail.com', 'gtrendy2017@gmail.com'].includes(e.emailAddress));

    return isGod
}

export async function POST(req: Request) {
    try {
        if (!await verifySuperAdmin()) {
            return new NextResponse(JSON.stringify({ error: "Unauthorized: God Mode Required" }), { status: 403 })
        }

        const body = await req.json()
        const { email, plan, maxBranches } = body

        if (!email) {
            return new NextResponse(JSON.stringify({ error: "Email required" }), { status: 400 })
        }

        // Find user by email (Need to query UserSettings joined with Clerk or assume we have email? 
        // UserSettings doesn't always have email depending on schema sync. 
        // But our modal passes 'email' from the list which came from database or clerk.
        // Wait, UserSettings schema has NO email field usually (it's in Clerk). 
        // But our table displayed it. 
        // Let's check schema again? No, I recall seeing some email usage. 
        // If UserSettings has no email, finding by email is hard without Clerk SDK.
        // However, the Modal passes the userId usually? 
        // Let's check UserDetailModal. It sends `email`.
        // Ideally we should send `userId`.
        // I will update the Modal to send `userId` as well for robustness.
        // For now, let's try to find by email via Clerk if needed, BUT better to use userId.

        // I'll update this API to accept userId if available.
        // I'll update this API to accept userId if available. 

        let targetUserId = body.userId

        if (!targetUserId && email) {
            // Try to find user in our DB by some other means or using Clerk?
            // simpler: Just require userId. 
            // I'll update the component to send userId.
            return new NextResponse(JSON.stringify({ error: "UserId required for stability" }), { status: 400 })
        }

        // Update Plan
        const updates: any = { plan }
        if (maxBranches) updates.maxBranches = maxBranches // If passed

        const updatedUser = await prisma.userSettings.update({
            where: { userId: targetUserId },
            data: updates
        })

        // Log it
        const admin = await currentUser()
        await prisma.auditLog.create({
            data: {
                adminId: admin?.id || 'unknown',
                action: 'MANUAL_PLAN_UPGRADE',
                details: { targetUserId, newPlan: plan, adminEmail: admin?.emailAddresses[0].emailAddress }
            }
        })

        return NextResponse.json({ success: true, user: updatedUser })

    } catch (error: any) {
        console.error('Manual upgrade error:', error)
        return new NextResponse(JSON.stringify({ error: error.message }), { status: 500 })
    }
}
