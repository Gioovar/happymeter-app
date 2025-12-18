import StaffChatUI from '@/components/staff/StaffChatUI'
import { auth } from '@clerk/nextjs/server'

export default async function StaffChatPage() {
    const { userId } = await auth()

    if (!userId) return <div>Access Denied</div>

    return (
        <div className="p-6">
            <h1 className="text-3xl font-bold text-white mb-6">Soporte Chat</h1>
            <StaffChatUI staffId={userId} />
        </div>
    )
}
