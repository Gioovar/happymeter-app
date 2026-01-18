import AnalyticsView from '@/components/dashboard/AnalyticsView'
import { getDashboardContext } from '@/lib/auth-context'
import { redirect } from 'next/navigation'

export default async function BranchAnalyticsPage({
    params
}: {
    params: { branchSlug: string }
}) {
    // Validate context
    const context = await getDashboardContext(params.branchSlug)
    if (!context) redirect('/dashboard')

    return <AnalyticsView />
}
