import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import ResponsesWrapper from '@/components/responses/ResponsesWrapper'

import { getDashboardContext } from '@/lib/auth-context'

export default async function ResponsesPage() {
    const context = await getDashboardContext()
    if (!context) redirect('/')

    return <ResponsesWrapper effectiveUserId={context.userId} isBranch={context.isBranch} />
}
