import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import ResponsesWrapper from '@/components/responses/ResponsesWrapper'

export default async function ResponsesPage() {
    const { userId } = await auth()
    if (!userId) redirect('/')

    return <ResponsesWrapper effectiveUserId={userId} />
}
