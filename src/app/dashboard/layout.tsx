import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import DashboardSidebar from '@/components/DashboardSidebar'
import FeatureTour from '@/components/FeatureTour'
import { UserButton } from '@clerk/nextjs'
import { DashboardProvider } from '@/context/DashboardContext'

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const { userId, redirectToSignIn } = await auth()

    if (!userId) return redirectToSignIn()

    let realRole = 'USER'
    let affiliateProfile = null
    let hasSeenTour = true

    try {
        if (userId) {
            const [profile, settings] = await Promise.all([
                prisma.affiliateProfile.findUnique({ where: { userId } }),
                prisma.userSettings.findUnique({ where: { userId }, select: { hasSeenTour: true, role: true } })
            ])
            affiliateProfile = profile
            if (settings) {
                hasSeenTour = settings.hasSeenTour
                realRole = settings.role
            }
        }
    } catch (error) {
        console.error('Failed to fetch data in layout:', error)
    }

    return (
        <DashboardProvider>
            <div className="flex min-h-screen bg-[#0a0a0a]">
                {!hasSeenTour && <FeatureTour />}
                <DashboardSidebar isCreator={!!affiliateProfile} userRole="USER" />
                <main className="flex-1 overflow-y-auto h-screen relative">
                    {/* Top Header for Desktop */}
                    <div className="hidden md:flex justify-end items-center p-4 absolute top-0 right-0 z-30 w-full pointer-events-none">
                        <div className="pointer-events-auto bg-[#111] border border-white/10 rounded-full px-4 py-2 flex items-center gap-4 shadow-xl">
                            <div className="text-right hidden lg:block">
                                <p className="text-xs text-gray-400 font-medium">Conectado como</p>
                            </div>
                            <UserButton
                                afterSignOutUrl="/"
                                appearance={{
                                    elements: {
                                        userButtonBox: "flex flex-row-reverse",
                                        userButtonOuterIdentifier: "text-white font-bold text-sm",
                                    }
                                }}
                                showName
                            />
                        </div>
                    </div>

                    <div className="pt-16 md:pt-20 px-4 md:px-8 pb-32">
                        {children}
                    </div>
                </main>
            </div>
        </DashboardProvider>
    )
}
