import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import ResponsesWrapper from '@/components/responses/ResponsesWrapper'

export default async function ResponsesPage() {
    const { userId } = await auth()
    if (!userId) redirect('/')

    const { getActiveBusinessId } = await import('@/lib/tenant')
    const activeContextId = await getActiveBusinessId()
    const effectiveUserId = activeContextId || userId

    return <ResponsesWrapper effectiveUserId={effectiveUserId} />
}
