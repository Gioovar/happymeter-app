import { prisma } from '@/lib/prisma'
import { getDashboardContext } from '@/lib/auth-context'
import { auth, currentUser } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import SettingsView from '@/components/dashboard/SettingsView'

export default async function BranchSettingsPage({ params }: { params: { branchSlug: string } }) {
    const context = await getDashboardContext(params.branchSlug)
    if (!context) redirect('/dashboard')

    const { userId: ownerId } = await auth()
    if (!ownerId) redirect('/')

    const userSettings = await prisma.userSettings.findUnique({
        where: { userId: context.userId }
    })

    // Fallback/prefill logic for branches
    let displaySettings = userSettings
    let isPrefilled = false
    if (context.userId !== ownerId) {
        const parentSettings = await prisma.userSettings.findUnique({
            where: { userId: ownerId }
        })
        if (parentSettings) {
            displaySettings = {
                ...parentSettings,
                ...userSettings,
                socialLinks: {
                    instagram: (userSettings?.socialLinks as any)?.instagram || (parentSettings?.socialLinks as any)?.instagram || '',
                    facebook: (userSettings?.socialLinks as any)?.facebook || (parentSettings?.socialLinks as any)?.facebook || ''
                },
                userId: context.userId,
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

    return <SettingsView userSettings={displaySettings} user={serializedUser} branchId={context.userId} isPrefilled={isPrefilled} />
}
