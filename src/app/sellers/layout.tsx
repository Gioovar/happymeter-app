import { Suspense } from 'react'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import SellerSidebar from '@/components/SellerSidebar'
import { UserButton } from '@clerk/nextjs'

export default async function SellersLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const { userId, redirectToSignIn } = await auth()
    if (!userId) return redirectToSignIn()

    // Check if user is a representative. 
    // We allow if they have a RepresentativeProfile.
    // Ideally, we should also check UserRole, but Profile existence is cleaner for now.
    const profile = await prisma.representativeProfile.findUnique({
        where: { userId }
    })

    if (!profile || !profile.isActive) {
        // Not a representative or inactive
        redirect('/dashboard')
    }

    return (
        <div className="flex min-h-screen bg-[#0a0a0a]">
            {/* Sidebar */}
            <Suspense fallback={<div className="w-64 bg-[#111] h-screen border-r border-white/10 hidden md:flex" />}>
                <SellerSidebar />
            </Suspense>

            <main className="flex-1 overflow-y-auto h-screen relative">
                {/* Top Header */}
                <div className="hidden md:flex justify-end items-center p-4 absolute top-0 right-0 z-30 w-full pointer-events-none">
                    <div className="pointer-events-auto bg-[#111] border border-white/10 rounded-full px-4 py-2 flex items-center gap-4 shadow-xl">
                        <div className="text-right hidden lg:block">
                            <p className="text-xs text-gray-400 font-medium">Representante: <span className="text-blue-400">{profile.state}</span></p>
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
    )
}
