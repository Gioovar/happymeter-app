import NotificationCenter from '@/components/admin/NotificationCenter'

import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import AdminSidebar from '@/components/admin/AdminSidebar'
import { ShieldCheck } from 'lucide-react'
import { UserButton } from '@clerk/nextjs'

export default async function AdminLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const { userId } = await auth()

    if (!userId) {
        redirect('/')
    }

    // Security: Only SUPER_ADMIN allowed in God Mode
    const userSettings = await prisma.userSettings.findUnique({
        where: { userId },
        select: { role: true }
    })

    if (userSettings?.role !== 'SUPER_ADMIN') {
        if (userSettings?.role === 'STAFF' || userSettings?.role === 'ADMIN') {
            redirect('/staff')
        }
        redirect('/dashboard')
    }

    return (
        <div className="flex min-h-screen bg-[#0E0918] relative overflow-hidden">
            {/* n8n-style Background Glows */}
            <div className="fixed top-[-20%] left-[-10%] w-[50%] h-[50%] bg-purple-900/20 blur-[120px] rounded-full pointer-events-none" />
            <div className="fixed bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-indigo-900/20 blur-[120px] rounded-full pointer-events-none" />
            <div className="fixed top-[20%] right-[20%] w-[30%] h-[30%] bg-blue-900/10 blur-[100px] rounded-full pointer-events-none" />

            {/* Header for All Screens - Fixed z-[60] to be above Sidebar content */}
            <div className="flex justify-end items-center p-4 fixed top-0 right-0 z-[60] w-full pointer-events-none">
                <div className="pointer-events-auto bg-[#191526]/80 backdrop-blur-md border border-white/5 rounded-full px-3 py-2 flex items-center gap-3 shadow-xl max-w-[95vw]">
                    <ShieldCheck className="w-4 h-4 text-orange-500 shrink-0" />
                    <div className="text-right hidden sm:block">
                        <p className="text-xs text-orange-400 font-bold uppercase tracking-wider">God Mode</p>
                    </div>

                    {/* Notification Center */}
                    <div className="h-6 w-px bg-white/10 mx-1" />
                    <NotificationCenter />

                    <UserButton
                        afterSignOutUrl="/"
                        appearance={{
                            elements: {
                                userButtonBox: "flex flex-row-reverse",
                                userButtonOuterIdentifier: "text-white font-bold text-sm hidden sm:block",
                            }
                        }}
                        showName={false} // Hide name on mobile to save space, rely on avatar
                    />
                </div>
            </div>

            <AdminSidebar />
            <main className="flex-1 overflow-y-auto h-screen relative z-10 w-full">
                <div className="pt-20 px-8 pb-32">
                    {children}
                </div>
            </main>
        </div>
    )
}
