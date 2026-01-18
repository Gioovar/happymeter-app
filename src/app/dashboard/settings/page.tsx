import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import SettingsView from '@/components/dashboard/SettingsView'

export default async function SettingsPage() {
    const { userId } = await auth()
    if (!userId) redirect('/')

    const userSettings = await prisma.userSettings.findUnique({
        where: { userId }
    })

    return <SettingsView userSettings={userSettings} />
}
