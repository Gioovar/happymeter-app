
import { NextResponse } from 'next/server'
import { auth, currentUser, clerkClient } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'

// TODO: Move to a config or env var
const ADMIN_EMAILS = ['admin@happymeter.com', 'gioovar@gmail.com']

async function isAdmin() {
    const user = await currentUser()
    if (!user) return false

    // Check Database Role
    const dbUser = await prisma.userSettings.findUnique({
        where: { userId: user.id },
        select: { role: true }
    })

    if (dbUser?.role === 'SUPER_ADMIN') return true

    // Fallback
    return user.emailAddresses.some(email => ADMIN_EMAILS.includes(email.emailAddress))
}

export async function GET() {
    try {
        if (!await isAdmin()) {
            return new NextResponse("Unauthorized", { status: 403 })
        }

        // 1. Fetch users from Clerk
        const client = await clerkClient()
        const clerkUsers = await client.users.getUserList({
            limit: 100,
            orderBy: '-created_at'
        })

        // 2. Fetch local data (Plans, Survey Counts)
        const userIds = clerkUsers.data.map(u => u.id)

        const userSettings = await prisma.userSettings.findMany({
            where: { userId: { in: userIds } }
        })

        const surveyCounts = await prisma.survey.groupBy({
            by: ['userId'],
            _count: { id: true },
            where: { userId: { in: userIds } }
        })

        // 3. Merge Data
        const users = clerkUsers.data.map(u => {
            const settings = userSettings.find(s => s.userId === u.id)
            const count = surveyCounts.find(c => c.userId === u.id)

            return {
                id: u.id,
                name: `${u.firstName || ''} ${u.lastName || ''}`.trim() || 'Sin Nombre',
                email: u.emailAddresses[0]?.emailAddress || 'No Email',
                image: u.imageUrl,
                lastLogin: u.lastSignInAt,
                createdAt: u.createdAt,
                banned: u.banned,
                plan: settings?.plan || 'FREE',
                surveyCount: count?._count.id || 0
            }
        })

        return NextResponse.json(users)
    } catch (error) {
        console.error('[ADMIN_USERS_GET]', error)
        return new NextResponse("Internal Error", { status: 500 })
    }
}

// Ban/Unban User
export async function PATCH(req: Request) {
    try {
        if (!await isAdmin()) {
            return new NextResponse("Unauthorized", { status: 403 })
        }

        const body = await req.json()
        const { userId, banned } = body

        if (!userId) return new NextResponse("User ID required", { status: 400 })

        const client = await clerkClient()
        if (banned) {
            await client.users.banUser(userId)
        } else {
            await client.users.unbanUser(userId)
        }

        // Audit Log
        const admin = await currentUser()
        await prisma.auditLog.create({
            data: {
                adminId: admin?.id || 'unknown',
                action: banned ? 'BAN_USER' : 'UNBAN_USER',
                entityId: userId,
                details: {}
            }
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('[ADMIN_USERS_PATCH]', error)
        return new NextResponse("Internal Error", { status: 500 })
    }
}

// Delete User
export async function DELETE(req: Request) {
    try {
        if (!await isAdmin()) {
            return new NextResponse("Unauthorized", { status: 403 })
        }

        const { searchParams } = new URL(req.url)
        const userId = searchParams.get('id')

        if (!userId) return new NextResponse("ID required", { status: 400 })

        // 1. Delete from Clerk
        const client = await clerkClient()
        await client.users.deleteUser(userId)

        // 2. Delete local data (Cascading deletes handles surveys/responses if set up, but good to be explicit or rely on webhooks in prod)
        // For now, we rely on manual cleanup or cascade if we had a User model. 
        // Since we link by ID string, we might have orphaned data if we don't clean up.
        // Let's clean up UserSettings and Surveys.

        await prisma.userSettings.deleteMany({ where: { userId } })
        await prisma.survey.deleteMany({ where: { userId } })

        // Audit Log
        const admin = await currentUser()
        await prisma.auditLog.create({
            data: {
                adminId: admin?.id || 'unknown',
                action: 'DELETE_USER',
                entityId: userId,
                details: {}
            }
        })

        return new NextResponse(null, { status: 200 })
    } catch (error) {
        console.error('[ADMIN_USERS_DELETE]', error)
        return new NextResponse("Internal Error", { status: 500 })
    }
}
