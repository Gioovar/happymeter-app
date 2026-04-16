import { Suspense } from 'react'
import { auth, currentUser } from '@clerk/nextjs/server'
import { redirect } from "next/navigation"
import { prisma } from '@/lib/prisma'
import DashboardSidebar from '@/components/DashboardSidebar'
import GiftCelebration from '@/components/dashboard/GiftCelebration' // Correct import location
import BusinessSelector from '@/components/dashboard/BusinessSelector'
import { cookies } from 'next/headers'

import ModeSelector from '@/components/ModeSelector'
import { UserButton } from '@clerk/nextjs'
import { DashboardProvider } from '@/context/DashboardContext'
import { NotificationProvider } from '@/context/NotificationContext'
import SuspendedOverlay from '@/components/common/SuspendedOverlay'

import { processReferralCookie } from '@/lib/referral-service'

import SubscriptionGuard from '@/components/subscription/SubscriptionGuard'

// ... existing imports

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const authData = await auth()
    const { userId } = authData
    const clerkUser = await currentUser()

    // Sanitize User Data for Client Component (Avoid Serialization Error)
    const userData = clerkUser ? {
        id: clerkUser.id,
        firstName: clerkUser.firstName,
        lastName: clerkUser.lastName,
        imageUrl: clerkUser.imageUrl,
        emailAddresses: (clerkUser.emailAddresses || []).map(e => ({ emailAddress: e.emailAddress })),
        primaryEmailAddressId: clerkUser.primaryEmailAddressId
    } : null

    if (!userId) {
        redirect('/sign-in')
    }

    // Process Attribution
    await processReferralCookie(userId)

    let realRole = 'USER'
    let affiliateProfile = null
    let hasSeenTour = false // Default to FALSE to ensure new users see the tour if settings fetch fails or is pending

    let settings = null
    let profile = null

    try {
        if (userId) {
            const [fetchedProfile, fetchedSettings] = await Promise.all([
                prisma.affiliateProfile.findUnique({ where: { userId } }),
                prisma.userSettings.findUnique({
                    where: { userId },
                    select: {
                        hasSeenTour: true,
                        role: true,
                        plan: true,
                        isActive: true,
                        isOnboarded: true,
                        createdAt: true,
                        subscriptionStatus: true,
                        // @ts-ignore
                        fullName: true, // Fetch Data
                    }
                })
            ])
            profile = fetchedProfile
            settings = fetchedSettings
        }
    } catch (error) {
        console.error('Failed to fetch data in layout:', error)
    }

    // 1. Mandatory Onboarding Check & New User Handling

    // TEAM MEMBER BYPASS & INVITATION CHECK
    // Fetch ALL memberships for this user to support Multi-Tenant
    let memberships: any[] = []
    let personalSettings: any = null

    try {
        const [fetchedMemberships, fetchedPersonalSettings] = await Promise.all([
            prisma.teamMember.findMany({
                where: { userId, isActive: true },
                include: { owner: { select: { businessName: true, isActive: true, bannerUrl: true } } }
            }),
            prisma.userSettings.findUnique({
                where: { userId },
                select: { hasSeenTour: true, role: true, plan: true, isActive: true, isOnboarded: true, createdAt: true, subscriptionStatus: true, businessName: true, fullName: true, bannerUrl: true }
            })
        ])
        memberships = fetchedMemberships
        personalSettings = fetchedPersonalSettings
    } catch (error) {
        console.error('Failed to fetch memberships or settings in layout:', error)
    }

    // Determine all active business contexts
    const businessContexts = []

    if (personalSettings?.isOnboarded) {
        businessContexts.push({
            id: userId,
            name: personalSettings.businessName || 'Mi Negocio',
            role: 'ADMIN',
            isActive: personalSettings.isActive,
            bannerUrl: personalSettings.bannerUrl || null
        })
    }

    memberships.forEach(m => {
        businessContexts.push({
            id: m.ownerId,
            name: m.owner?.businessName || 'Negocio Afiliado',
            role: m.role,
            isActive: m.owner?.isActive || false,
            bannerUrl: m.owner?.bannerUrl || null
        })
    })

    // Resolve Active Context
    const cookieStore = await cookies()
    const activeContextCookie = cookieStore.get('happy_active_business')
    let activeContextId = activeContextCookie?.value

    // Validate if the cookie context is actually one of the user's available contexts
    const isValidContext = businessContexts.some(c => c.id === activeContextId)

    if (!activeContextId || !isValidContext) {
        // Fallback to the first available context
        activeContextId = businessContexts.length > 0 ? businessContexts[0].id : userId
    }

    const activeContext = businessContexts.find(c => c.id === activeContextId)
    const membership = memberships.find(m => m.ownerId === activeContextId)

    // If NOT a member, check if they have a PENDING invitation to redirect them
    if (!membership && clerkUser) {
        try {
            const userEmail = clerkUser.emailAddresses.find(e => e.id === clerkUser.primaryEmailAddressId)?.emailAddress || clerkUser.emailAddresses[0]?.emailAddress
            if (userEmail) {
                const pendingInvite = await prisma.teamInvitation.findFirst({
                    where: { email: userEmail }
                })
                if (pendingInvite) {
                    redirect(`/join-team?token=${pendingInvite.token}`)
                }
            }
        } catch (error) {
            console.error('Error checking pending invitations:', error)
        }
    }

    // Only redirect to onboarding if:
    // 1. No settings (new user) OR explicitly not onboarded
    // 2. AND they are NOT a team member (members don't need business onboarding)
    if ((!settings || !settings.isOnboarded) && !membership) {
        redirect('/onboarding')
    }

    // Check for Account Suspension
    // ... logic continues ...
    let isSuspended = false
    if (settings && (settings as any).isActive === false) {
        isSuspended = true
    } else {
        // Checking owner suspension if applicable
        const membership = await prisma.teamMember.findFirst({
            where: { userId },
            select: { owner: { select: { isActive: true } } }
        })

        if (membership && membership.owner && membership.owner.isActive === false) {
            isSuspended = true
        }
    }

    if (isSuspended) {
        return <SuspendedOverlay />
    }

    affiliateProfile = profile
    if (settings) {
        hasSeenTour = settings.hasSeenTour
        realRole = settings.role || 'USER'
    }

    // Check if user has any chain association
    let hasChain = false
    try {
        const ownedChain = await prisma.chain.findFirst({
            where: { ownerId: userId }
        })
        hasChain = !!ownedChain
    } catch (error) {
        console.error('Error checking chains:', error)
    }

    // WAITER/OPERATOR PROTECTION: 
    // If user has no settings (not an owner) but IS a team member with OPERATOR role,
    // they should ONLY be allowing in /ops. Redirect them.
    if (!realRole || realRole === 'USER') { // Basic Check
        try {
            const member = await prisma.teamMember.findFirst({
                where: { userId }
            })
            if (member && (member.role as string) === 'OPERATOR') {
                const userSettings = await prisma.userSettings.findUnique({ where: { userId } })
                if (!userSettings) {
                    redirect('/ops')
                }
            }
        } catch (error) {
            console.error('Error checking operator membership:', error)
        }
    }

    // RESOLVE USER PLAN (INHERITANCE)
    let userPlan = 'FREE'
    let effectiveUserId = userId

    if (membership && membership.ownerId) {
        effectiveUserId = membership.ownerId
        realRole = membership.role as string // Override local role with TeamRole
    }

    try {
        if (effectiveUserId) {
            const effectiveSettings = await prisma.userSettings.findUnique({
                where: { userId: effectiveUserId },
                select: { plan: true, subscriptionStatus: true, createdAt: true }
            })
            if (effectiveSettings) {
                userPlan = effectiveSettings.plan || 'FREE'

                // Inherit settings to bypass the paywall
                if (settings) {
                    (settings as any).plan = userPlan;
                    (settings as any).subscriptionStatus = effectiveSettings.subscriptionStatus;
                    (settings as any).createdAt = effectiveSettings.createdAt;
                }
            }
        }
    } catch (e) {
        console.error("Error fetching inherited plan", e)
    }

    const checkedSettings = settings || null

    return (
        // ... existing code ...

        <DashboardProvider
            branchId={activeContextId}
            userRole={realRole}
            initialPlan={checkedSettings?.plan || 'FREE'}
            userCreatedAt={checkedSettings?.createdAt?.toISOString() || null}
            dbSubscriptionStatus={checkedSettings?.subscriptionStatus || null}
            activeContextName={activeContext?.name || null}
            activeContextRole={activeContext?.role || null}
            activeContextBannerUrl={(activeContext as any)?.bannerUrl || null}
        >
            <NotificationProvider>
                <GiftCelebration userId={userId} />
                <div className="flex min-h-screen bg-[#0a0a0a]">

                    <Suspense fallback={<div className="w-64 bg-[#111] h-screen border-r border-white/10 hidden md:flex" />}>
                        <DashboardSidebar
                            isCreator={!!affiliateProfile}
                            userRole={realRole}
                            hasChain={hasChain}
                            userPlan={userPlan}
                            user={userData ? { ...userData, fullName: (settings as any)?.fullName, businessName: (settings as any)?.businessName, createdAt: (settings as any)?.createdAt?.toISOString() || null } : null}
                            isOwnContext={activeContextId === userId}
                        // We will let Sidebar handle resolutions or passing slug
                        />
                    </Suspense>
                    <main className="flex-1 overflow-y-auto h-screen relative">
                        {/* Top Header for Desktop */}
                        <div className="hidden md:flex justify-between items-center p-4 absolute top-0 right-0 z-30 w-full pointer-events-none">
                            <div className="pointer-events-auto pl-4">
                                <ModeSelector />
                            </div>
                            <div className="pointer-events-auto flex items-center gap-3">
                                {businessContexts.length > 1 && (
                                    <BusinessSelector contexts={businessContexts} activeContextId={activeContextId} />
                                )}
                                <div className="bg-[#111] border border-white/10 rounded-full px-4 py-2 flex items-center gap-4 shadow-xl">
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
                        </div>

                        <div className="pt-16 md:pt-20 px-4 md:px-8 pb-32">
                            <SubscriptionGuard>
                                {children}
                            </SubscriptionGuard>
                        </div>
                    </main>
                </div>
            </NotificationProvider>
        </DashboardProvider>
    )
}
