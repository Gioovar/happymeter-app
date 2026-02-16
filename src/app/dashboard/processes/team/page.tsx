import { getTeamData } from '@/actions/team'
import ProcessTeamView from '@/components/team/ProcessTeamView'
import { getProcessTeamStats } from '@/actions/processes'
import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'

export default async function ProcessesTeamPage() {
    const { userId } = await auth()
    if (!userId) redirect('/dashboard')

    const data = await getTeamData(userId)
    const performanceStats = await getProcessTeamStats(userId)

    return (
        <ProcessTeamView
            teamData={data}
            performanceStats={performanceStats}
            branchId={userId}
        />
    )
}
