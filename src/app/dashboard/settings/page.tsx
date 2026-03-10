import { auth, currentUser } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import SettingsView from '@/components/dashboard/SettingsView'

export default async function SettingsPage() {
    const { userId } = await auth()
    if (!userId) redirect('/')

    const { getActiveBusinessId } = await import('@/lib/tenant')
    const activeContextId = await getActiveBusinessId()
    const effectiveUserId = activeContextId || userId

    const userSettings = await prisma.userSettings.findUnique({
        where: { userId: effectiveUserId }
    })

    const clerkUser = await currentUser()
    const serializedUser = clerkUser ? {
        firstName: clerkUser.firstName,
        lastName: clerkUser.lastName,
        emailAddresses: clerkUser.emailAddresses.map(e => ({ emailAddress: e.emailAddress }))
    } : null

    return <SettingsView userSettings={userSettings} user={serializedUser} branchId={effectiveUserId} />
}
