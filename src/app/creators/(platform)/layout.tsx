import CreatorSidebar from '@/components/CreatorSidebar'

export default function CreatorLayout({
    children,
}: {
    children: React.ReactNode
}) {
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
