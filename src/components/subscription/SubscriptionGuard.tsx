'use client'

import { useDashboard } from '@/context/DashboardContext'
import { usePathname } from 'next/navigation'
import TrialExpiredWall from './TrialExpiredWall'

const ALLOWED_PATHS = [
    '/dashboard/settings',
    '/dashboard/settings/billing', // Assuming this exists or will exist
    '/dashboard/profile'
]

export default function SubscriptionGuard({ children }: { children: React.ReactNode }) {
    const { isLocked, subscriptionStatus } = useDashboard()
    const pathname = usePathname()

    // If locked, check if current path is allowed (e.g. settings to upgrade)
    if (isLocked) {
        // If the path starts with any allowed path, allow it
        const isAllowed = ALLOWED_PATHS.some(path => pathname?.startsWith(path))

        if (!isAllowed) {
            return <TrialExpiredWall />
        }
    }

    return <>{children}</>
}
