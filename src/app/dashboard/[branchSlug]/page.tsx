import { getDashboardContext } from '@/lib/auth-context'
import DashboardView from '@/components/dashboard/DashboardView'
import { redirect } from 'next/navigation'

export default async function BranchDashboardPage({
    params
}: {
    params: { branchSlug: string }
}) {
    // We resolve context again to get the friendly name (or pass it from layout if we could, but server components are separate tree)
    // Actually getDashboardContext is cached by React/Next.js request memoization usually, or is cheap enough.
    const context = await getDashboardContext(params.branchSlug)

    if (!context) redirect('/dashboard')

    return (
        <DashboardView
            branchName={context.name}
            isBranchMode={true}
            branchSlug={params.branchSlug}
        />
    )
}
