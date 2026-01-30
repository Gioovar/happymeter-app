import { getTeamData } from '@/actions/team'
import TeamView from '@/components/team/TeamView'
import { getDashboardContext } from '@/lib/auth-context'
import { redirect } from 'next/navigation'

export default async function ProcessesBranchTeamPage({ params }: { params: { branchSlug: string } }) {
    const context = await getDashboardContext(params.branchSlug)
    if (!context) redirect('/dashboard')

    const data = await getTeamData(context.userId)

    return <TeamView initialData={data} branchId={context.userId} />
}
