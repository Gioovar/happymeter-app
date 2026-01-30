import { getProcessAnalytics } from '@/actions/processes'
import AttentionTimesView from '@/components/processes/AttentionTimesView'
import { getDashboardContext } from '@/lib/auth-context'
import { redirect } from 'next/navigation'

export default async function BranchTimesPage({ params }: { params: { branchSlug: string } }) {
    const context = await getDashboardContext(params.branchSlug)
    if (!context) redirect('/dashboard')

    const data = await getProcessAnalytics()
    const evidences = data?.allEvidences || []

    return <AttentionTimesView evidences={evidences} />
}
