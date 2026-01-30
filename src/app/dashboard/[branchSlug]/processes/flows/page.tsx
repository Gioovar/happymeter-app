import { getOpsTasks } from '@/actions/processes'
import ActiveFlowsView from '@/components/processes/ActiveFlowsView'
import { getDashboardContext } from '@/lib/auth-context'
import { redirect } from 'next/navigation'

export default async function BranchFlowsPage({ params }: { params: { branchSlug: string } }) {
    const context = await getDashboardContext(params.branchSlug)
    if (!context) redirect('/dashboard')

    // getOpsTasks currently uses auth() internally
    // TODO: Ideally we pass context.userId if we want to impersonate or scope 
    // but getOpsTasks is built for the logged in user. 
    // For now we assume the logged in user has access to these tasks.
    const data = await getOpsTasks()

    const zones = data?.zones || []

    return <ActiveFlowsView zones={zones} />
}
