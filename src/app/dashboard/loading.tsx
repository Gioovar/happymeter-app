export default function DashboardLoading() {
    return (
        <div className="p-6 space-y-6 animate-pulse">
            {/* Header Skeleton */}
            <div className="flex justify-between items-center mb-8">
                <div className="h-8 w-48 bg-white/5 rounded-lg"></div>
                <div className="h-10 w-32 bg-white/5 rounded-lg"></div>
            </div>

            {/* Stats Grid Skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {[...Array(4)].map((_, i) => (
                    <div key={i} className="h-32 bg-white/5 rounded-2xl border border-white/5"></div>
                ))}
            </div>

            {/* Content Skeleton */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 h-96 bg-white/5 rounded-2xl border border-white/5"></div>
                <div className="h-96 bg-white/5 rounded-2xl border border-white/5"></div>
            </div>
        </div>
    )
}
