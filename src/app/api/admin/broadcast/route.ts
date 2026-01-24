
import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: Request) {
    try {
        const { userId } = await auth()
        if (!userId) {
            return new NextResponse("Unauthorized", { status: 401 })
        }

        // Verify Super Admin (Hardcoded or DB role)
        // For now, assuming only specific user IDs (or you can add a role check)
        // Replace this with your actual Admin ID or Role Logic
        const admins = ['user_2p...'] // Add your ID later or use DB role
        // For development, assuming the caller is allowed if authorized (or check metadata)

        // Better: Check if user has 'admin' in metadata (Clerk) or specific email
        // const user = await clerkClient.users.getUser(userId)
        // if (user.privateMetadata.role !== 'admin') ...

        const body = await req.json()
        const { title, message, type = 'SYSTEM' } = body

        if (!title || !message) {
            return new NextResponse("Missing fields", { status: 400 })
        }

        // 1. Get all active users
        const users = await prisma.userSettings.findMany({
            select: { userId: true }
        })

        console.log(`Broadcasting to ${users.length} users...`)

        // 2. Create notifications in bulk
        // Prisma createMany is efficient
        const notifications = users.map(u => ({
            userId: u.userId,
            type: type,
            title: title,
            message: message,
            isRead: false,
            createdAt: new Date()
        }))

        // createMany is supported in Postgres
        await prisma.notification.createMany({
            data: notifications
        })

        return NextResponse.json({ success: true, count: users.length })

    } catch (error) {
        console.error('[ADMIN_BROADCAST]', error)
        return new NextResponse("Internal Error", { status: 500 })
    }
}
