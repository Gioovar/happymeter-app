import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { currentUser } from '@clerk/nextjs/server'

export async function GET(req: Request) {
    try {
        const user = await currentUser()
        if (!user) {
            return new NextResponse('Unauthorized', { status: 401 })
        }

        const { searchParams } = new URL(req.url)
        const unreadOnly = searchParams.get('unreadOnly') === 'true'

        // Fetch all branches owned by the user (Chain Context)
        const userChains = await prisma.chain.findMany({
            where: { ownerId: user.id },
            select: {
                branches: {
                    select: { branchId: true }
                }
            }
        })

        const branchIds = userChains.flatMap(chain => chain.branches.map(b => b.branchId))
        const allTargetIds = [user.id, ...branchIds]

        const [notifications, unreadCount] = await Promise.all([
            prisma.notification.findMany({
                where: {
                    userId: { in: allTargetIds },
                    ...(unreadOnly ? { isRead: false } : {})
                },
                take: 20,
                orderBy: { createdAt: 'desc' }
            }),
            prisma.notification.count({
                where: {
                    userId: { in: allTargetIds },
                    isRead: false
                }
            })
        ])

        return NextResponse.json({ notifications, unreadCount })
    } catch (error) {
        console.error('Error fetching notifications:', error)
        return new NextResponse('Internal Error', { status: 500 })
    }
}
