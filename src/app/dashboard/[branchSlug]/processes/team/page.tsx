import { getTeamData } from '@/actions/team'
import ProcessTeamView from '@/components/team/ProcessTeamView'
import { getProcessTeamStats } from '@/actions/processes'
import { getDashboardContext } from '@/lib/auth-context'
import { redirect } from 'next/navigation'

export default async function ProcessesBranchTeamPage({ params }: { params: { branchSlug: string } }) {
    const context = await getDashboardContext(params.branchSlug)
    if (!context) redirect('/dashboard')

    const data = await getTeamData(context.userId)
    const performanceStats = await getProcessTeamStats(context.userId)

    return (
        <ProcessTeamView
            teamData={data}
            performanceStats={performanceStats}
            branchId={context.userId}
        />
    )
}
