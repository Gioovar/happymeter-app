import { prisma } from '@/lib/prisma'
import { getDashboardContext } from '@/lib/auth-context'
import { redirect } from 'next/navigation'
import SettingsView from '@/components/dashboard/SettingsView'

export default async function BranchSettingsPage({ params }: { params: { branchSlug: string } }) {
    const context = await getDashboardContext(params.branchSlug)
    if (!context) redirect('/dashboard')

    const userSettings = await prisma.userSettings.findUnique({
        where: { userId: context.userId }
    })

    return <SettingsView userSettings={userSettings} branchId={context.userId} />
}
