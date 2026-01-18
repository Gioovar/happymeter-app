import { getDashboardContext } from '@/lib/auth-context'
import { redirect } from 'next/navigation'
import ResponsesWrapper from '@/components/responses/ResponsesWrapper'

export default async function BranchResponsesPage({
    params
}: {
    params: { branchSlug: string }
}) {
    const context = await getDashboardContext(params.branchSlug)
    if (!context) redirect('/dashboard')

    return <ResponsesWrapper effectiveUserId={context.userId} />
}
