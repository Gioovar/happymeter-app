import { currentUser } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import StaffSidebar from '@/components/staff/StaffSidebar'
import { UserButton } from '@clerk/nextjs'
import NotificationsBell from '@/components/notifications/NotificationsBell'
import SuspendedOverlay from '@/components/common/SuspendedOverlay'

import StaffMobileNav from '@/components/staff/StaffMobileNav'

export default async function StaffLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const user = await currentUser()
    const userId = user?.id

    if (!userId) {
        redirect('/')
    }

    // Role Check
    let userSettings = null
    try {
        userSettings = await prisma.userSettings.findUnique({
            where: { userId },
            select: { role: true, isActive: true } as any
        }) as any
    } catch (e) {
        console.error('Staff Layout Error:', e)
        // If error (e.g. unknown field), allow dev to see it on screen or fail safely
    }

    const isGod = user?.emailAddresses.some(e => ['armelzuniga87@gmail.com', 'gioovar@gmail.com', 'gtrendy2017@gmail.com'].includes(e.emailAddress));
    const hasRole = userSettings?.role === 'STAFF' || userSettings?.role === 'SUPER_ADMIN';

    // Allow STAFF, SUPER_ADMIN, or God Mode Emails
    if (!hasRole && !isGod) {
        return (
            <div className="flex h-screen items-center justify-center bg-black text-white p-6">
                <div className="max-w-md w-full border border-red-500/20 bg-red-500/10 p-8 rounded-2xl text-center">
                    <h1 className="text-2xl font-bold text-red-500 mb-2">Acceso Restringido</h1>
                    <p className="text-gray-400 mb-6">No tienes permisos para ver esta página.</p>

                    <div className="bg-black/50 p-4 rounded-lg font-mono text-xs text-left text-gray-500 mb-6 space-y-2">
                        <p>User ID: <span className="text-white">{userId}</span></p>
                        <p>Role: <span className="text-white">{userSettings?.role || 'None'}</span></p>
                    </div>

                    <a href="/dashboard" className="inline-block px-6 py-2 bg-white text-black font-bold rounded-lg hover:bg-gray-200 transition">
                        Volver al Dashboard
                    </a>
                </div>
            </div>
        )
    }

    // Check for Account Suspension (User OR Owner)
    let isSuspended = false
    if (userSettings && (userSettings as any).isActive === false) {
        isSuspended = true
    } else if (hasRole && userSettings?.role === 'STAFF') {
        // If staff, check their owner status
        const teamMember = await prisma.teamMember.findFirst({
            where: { userId },
            select: { owner: { select: { isActive: true } } }
        })
        if (teamMember && teamMember.owner && teamMember.owner.isActive === false) {
            isSuspended = true
        }
    }

    if (isSuspended) {
        return <SuspendedOverlay />
    }

    return (
        <div className="flex min-h-screen bg-[#050505]">
            <StaffSidebar />
            <main className="flex-1 overflow-y-auto h-screen relative">
                {/* Top Header */}
                <div className="sticky top-0 z-40 flex justify-between items-center p-4 border-b border-white/5 bg-[#0a0a0a]/90 backdrop-blur-md transition-all">
                    <div className="flex items-center gap-4">
                        <StaffMobileNav />
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="text-right hidden lg:block">
                            <p className="text-sm text-white font-bold">{userSettings?.role || 'Super Admin'}</p>
                            <p className="text-xs text-gray-500">Panel de Operaciones</p>
                        </div>
                        <NotificationsBell />
                        <UserButton afterSignOutUrl="/" />
                    </div>
                </div>

                <div className="">
                    {children}
                </div>
            </main>
        </div>
    )
}
