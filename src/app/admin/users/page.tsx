import { Suspense } from 'react'
import { Shield, Loader2 } from 'lucide-react'
import { getUserMasterList } from '@/actions/admin-dashboard'
import UsersTableClient from '@/components/admin/UsersTableClient'

export const dynamic = 'force-dynamic'

export default async function AdminUsersPage() {
    const users = await getUserMasterList()

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-white p-8 font-sans">
            <div className="max-w-7xl mx-auto">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold flex items-center gap-3">
                            <Shield className="w-8 h-8 text-violet-500" />
                            Gestión de Usuarios (God Mode)
                        </h1>
                        <p className="text-gray-400 mt-2">Control total sobre los usuarios registrados en la plataforma.</p>
                    </div>
                    {/* Add Invite Button here later */}
                </div>

                <Suspense fallback={<div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-violet-500" /></div>}>
                    <UsersTableClient initialUsers={users as any} />
                </Suspense>
            </div>
        </div>
    )
}
