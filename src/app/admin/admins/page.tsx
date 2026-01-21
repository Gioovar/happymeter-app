import { Suspense } from 'react'
import { ShieldCheck, Loader2 } from 'lucide-react'
import { getSuperAdmins } from '@/actions/admin-dashboard'
import SuperAdminManagement from '@/components/admin/SuperAdminManagement'
import { currentUser } from '@clerk/nextjs/server'

export const dynamic = 'force-dynamic'

export default async function AdminAdminsPage() {
    const [admins, user] = await Promise.all([
        getSuperAdmins(),
        currentUser()
    ])

    const currentUserEmail = user?.emailAddresses[0]?.emailAddress || ''

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-white p-8 font-sans">
            <div className="max-w-7xl mx-auto">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold flex items-center gap-3">
                            <ShieldCheck className="w-8 h-8 text-orange-500" />
                            Gestión de Super Admins
                        </h1>
                        <p className="text-gray-400 mt-2">Administra quién tiene acceso "God Mode" a la plataforma.</p>
                    </div>
                </div>

                <Suspense fallback={<div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-orange-500" /></div>}>
                    <SuperAdminManagement admins={admins} currentUserEmail={currentUserEmail} />
                </Suspense>
            </div>
        </div>
    )
}
