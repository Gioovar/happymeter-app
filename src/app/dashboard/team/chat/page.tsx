import { Suspense } from 'react'
import { auth } from '@clerk/nextjs/server'
import { getChainStaffList } from '@/actions/internal-communications'
import ManagerMessenger from '@/components/dashboard/ManagerMessenger'
import { redirect } from 'next/navigation'
import { Loader2 } from 'lucide-react'

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

            <Suspense fallback={
                <div className="flex h-[400px] items-center justify-center bg-white/5 rounded-3xl border border-white/5">
                    <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
                </div>
            }>
                <ManagerMessenger
                    initialStaffList={staffList}
                    currentUserId={userId}
                />
            </Suspense>
        </div>
    )
}
