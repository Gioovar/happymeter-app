import { auth } from '@clerk/nextjs/server'
import { getChainStaffList } from '@/actions/internal-communications'
import ManagerMessenger from '@/components/dashboard/ManagerMessenger'
import { redirect } from 'next/navigation'

export default async function ManagerChatPage() {
    const { userId } = await auth()
    if (!userId) redirect('/sign-in')

    const staffList = await getChainStaffList()

    return (
        <div className="p-6 md:p-8 space-y-6">
            <div className="flex flex-col gap-1">
                <h1 className="text-3xl font-black text-white tracking-tighter">Comunicación Interna</h1>
                <p className="text-gray-500 font-medium">Gestiona conversaciones directas con tu personal operativo de forma centralizada.</p>
            </div>

            <ManagerMessenger
                initialStaffList={staffList}
                currentUserId={userId}
            />
        </div>
    )
}
