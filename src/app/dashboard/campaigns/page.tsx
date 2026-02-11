import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import CampaignsClient from '@/components/campaigns/CampaignsClient'

export default async function CampaignsPage() {
    const { userId } = await auth()

    if (!userId) {
        redirect('/')
    }

    // 1. Get all chains owned by user
    const userChains = await prisma.chain.findMany({
        where: { ownerId: userId },
        include: { branches: true }
    })

    // 2. Extract branch IDs
    const branchIds = userChains.flatMap(chain => chain.branches.map(b => b.branchId))

    // 3. Include User's own ID
    const targetUserIds = [userId, ...branchIds]

    // Fetch all surveys available to this user (Personal + All Branches)
    const surveys = await prisma.survey.findMany({
        where: {
            userId: { in: targetUserIds }
        },
        select: { id: true, title: true },
        orderBy: { createdAt: 'desc' }
    })

    return (
        <CampaignsClient initialSurveys={surveys} />
    )
}
