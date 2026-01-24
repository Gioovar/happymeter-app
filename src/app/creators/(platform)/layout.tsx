import CreatorSidebar from '@/components/CreatorSidebar'

import { auth } from '@clerk/nextjs/server'

export default async function CreatorLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const { userId, redirectToSignIn } = await auth()
    if (!userId) return redirectToSignIn()

    return (
        <div className="flex min-h-screen bg-[#0a0a0a]">
            {/* Standard Sidebar */}
            <CreatorSidebar />
            <main className="flex-1 overflow-y-auto h-screen">
                {children}
            </main>
        </div>
    )
}
