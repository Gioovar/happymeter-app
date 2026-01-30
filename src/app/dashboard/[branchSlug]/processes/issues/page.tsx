import { getProcessAnalytics } from '@/actions/processes'
import IssuesView from '@/components/processes/IssuesView'
import { getDashboardContext } from '@/lib/auth-context'
import { redirect } from 'next/navigation'

export default async function BranchIssuesPage({ params }: { params: { branchSlug: string } }) {
    const context = await getDashboardContext(params.branchSlug)
    if (!context) redirect('/dashboard')

    const data = await getProcessAnalytics()
    const issues = data?.issues || []

    return <IssuesView issues={issues} />
}
