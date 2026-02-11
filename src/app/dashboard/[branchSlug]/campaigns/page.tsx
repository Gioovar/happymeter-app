import { getDashboardContext } from '@/lib/auth-context'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import CampaignsClient from '@/components/campaigns/CampaignsClient'

export default async function BranchCampaignsPage({ params }: { params: { branchSlug: string } }) {
    const context = await getDashboardContext(params.branchSlug)
    if (!context || !context.userId) {
        redirect('/dashboard')
    }

    // Fetch surveys for this specific branch
    const surveys = await prisma.survey.findMany({
        where: { userId: context.userId },
        select: { id: true, title: true },
        orderBy: { createdAt: 'desc' }
    })

    return (
        <CampaignsClient
            initialSurveys={surveys}
            branchId={context.userId}
            branchName={context.name}
        />
    )
}
