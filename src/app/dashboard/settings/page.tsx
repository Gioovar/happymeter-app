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

    // Fallback/prefill logic for branches
    let displaySettings = userSettings
    let isPrefilled = false
    if (effectiveUserId !== userId) {
        const parentSettings = await prisma.userSettings.findUnique({
            where: { userId }
        })
        if (parentSettings) {
            displaySettings = {
                ...parentSettings,
                ...userSettings,
                socialLinks: {
                    instagram: (userSettings?.socialLinks as any)?.instagram || (parentSettings?.socialLinks as any)?.instagram || '',
                    facebook: (userSettings?.socialLinks as any)?.facebook || (parentSettings?.socialLinks as any)?.facebook || ''
                },
                userId: effectiveUserId,
                plan: userSettings?.plan || parentSettings.plan
            }

            if (userSettings) {
                if (!userSettings.logoUrl && parentSettings.logoUrl) isPrefilled = true
                if (!userSettings.bannerUrl && parentSettings.bannerUrl) isPrefilled = true
                if (!userSettings.phone && parentSettings.phone) isPrefilled = true
                const userSocial = userSettings.socialLinks as any
                const parentSocial = parentSettings.socialLinks as any
                if ((!userSocial?.instagram && parentSocial?.instagram) || (!userSocial?.facebook && parentSocial?.facebook)) {
                    isPrefilled = true
                }
            } else {
                isPrefilled = true
            }
        }
    }

    const clerkUser = await currentUser()
    const serializedUser = clerkUser ? {
        firstName: clerkUser.firstName,
        lastName: clerkUser.lastName,
        emailAddresses: clerkUser.emailAddresses.map(e => ({ emailAddress: e.emailAddress }))
    } : null

    return <SettingsView userSettings={displaySettings} user={serializedUser} branchId={effectiveUserId} isPrefilled={isPrefilled} />
}
