import { Suspense } from 'react'
import { auth, currentUser } from '@clerk/nextjs/server'
import { redirect } from "next/navigation"
import { prisma } from '@/lib/prisma'
import DashboardSidebar from '@/components/DashboardSidebar'
import FeatureTour from '@/components/FeatureTour'
import ModeSelector from '@/components/ModeSelector'
import { UserButton } from '@clerk/nextjs'
import { DashboardProvider } from '@/context/DashboardContext'

import { processReferralCookie } from '@/lib/referral-service'

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const { userId, redirectToSignIn } = await auth()

    if (!userId) return redirectToSignIn()

    // Process Attribution
    await processReferralCookie(userId)

    let realRole = 'USER'
    let affiliateProfile = null
    let hasSeenTour = false // Default to FALSE to ensure new users see the tour if settings fetch fails or is pending

    try {
        if (userId) {
            const [profile, settings] = await Promise.all([
                prisma.affiliateProfile.findUnique({ where: { userId } }),
                prisma.userSettings.findUnique({ where: { userId }, select: { hasSeenTour: true, role: true, plan: true } })
            ])
            affiliateProfile = profile
            if (settings) {
                hasSeenTour = settings.hasSeenTour
                realRole = settings.role || 'USER'
            } else {
                // If no settings found, it's likely a brand new user. 
                // We should show the tour (hasSeenTour = false).
                // (Already set to false by default above)
            }
        }
    } catch (error) {
        console.error('Failed to fetch data in layout:', error)
    }

    // Check if user has any chain association
    const ownedChain = await prisma.chain.findFirst({
        where: { ownerId: userId }
    })
    const hasChain = !!ownedChain

    // WAITER/OPERATOR PROTECTION: 
    // If user has no settings (not an owner) but IS a team member with OPERATOR role,
    // they should ONLY be allowing in /ops. Redirect them.
    if (!realRole || realRole === 'USER') { // Basic Check
        const member = await prisma.teamMember.findFirst({
            where: { userId }
        })
        if (member && (member.role as string) === 'OPERATOR') {
            // ...
            // We need to ensure we don't redirect if we are already in /ops (but this is /dashboard layout so it's safe)
            const userSettings = await prisma.userSettings.findUnique({ where: { userId } })
            if (!userSettings) {
                redirect('/ops')
            }
        }
    }

    // Default to FREE if no settings or plan found
    // We need to re-fetch settings if we accessed them inside the Try block but scoping is tricky.
    // Actually, I declared realRole outside. I should declare `userPlan` outside too.

    // Simpler: Just access fetching result again or restructure. 
    // But `settings` is inside the try block.
    // Let's refactor slightly to expose settings outside or use a default variable.

    let userPlan = 'FREE'
    try {
        if (userId) {
            const settings = await prisma.userSettings.findUnique({ where: { userId }, select: { hasSeenTour: true, role: true, plan: true } })
            if (settings) {
                userPlan = settings.plan || 'FREE'
            }
        }
    } catch (e) {
        // ...
    }

    // Wait, I am replacing lines 33-77. 
    // The previous code had `[profile, settings] = await Promise.all(...)`.
    // I should maintain that structure but add `plan: true`.

    // Fetch User Data for Profile
    const fullUser = await currentUser()
    const userData = fullUser ? {
        firstName: fullUser.firstName,
        lastName: fullUser.lastName,
        email: fullUser.emailAddresses[0]?.emailAddress,
        imageUrl: fullUser.imageUrl,
    } : null

    return (
        <DashboardProvider>
            <div className="flex min-h-screen bg-[#0a0a0a]">
                {!hasSeenTour && <Suspense fallback={null}><FeatureTour /></Suspense>}
                <Suspense fallback={<div className="w-64 bg-[#111] h-screen border-r border-white/10 hidden md:flex" />}>
                    <DashboardSidebar
                        isCreator={!!affiliateProfile}
                        userRole={realRole}
                        hasChain={hasChain}
                        userPlan={userPlan}
                        user={userData}
                    />
                </Suspense>
                <main className="flex-1 overflow-y-auto h-screen relative">
                    {/* Top Header for Desktop */}
                    <div className="hidden md:flex justify-between items-center p-4 absolute top-0 right-0 z-30 w-full pointer-events-none">
                        <div className="pointer-events-auto pl-4">
                            <ModeSelector />
                        </div>
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
