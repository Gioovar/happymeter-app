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
    const { isLocked, checkModuleAccess } = useDashboard()
    const pathname = usePathname()

    // 0. GLOBAL TRIAL EXPIRATION CHECK
    const { userCreatedAt, plan } = useDashboard()

    // Check if trial is expired
    let isTrialExpired = false
    if (plan === 'FREE' && userCreatedAt) {
        const start = new Date(userCreatedAt).getTime()
        const trialDuration = 7 * 24 * 60 * 60 * 1000 // 7 Days
        const end = start + trialDuration
        const now = new Date().getTime()

        if (now > end) {
            isTrialExpired = true
        }
    }

    // Force block if trial expired, regardless of module
    if (isTrialExpired) {
        return <TrialExpiredWall />
    }

    // 1. Identify which module we are in
    let currentModule = 'surveys'
    if (pathname?.includes('/dashboard/loyalty') || pathname?.includes('/dashboard/games')) currentModule = 'loyalty'
    if (pathname?.includes('/dashboard/processes')) currentModule = 'processes'
    if (pathname?.includes('/dashboard/reservations')) currentModule = 'reservations'

    // 2. Check Access
    const hasAccess = checkModuleAccess(currentModule)

    // 3. Special Case: Global Lock (Trial Expired) - ONLY for Surveys if strictly needed, 
    // or we can allow Surveys always and just block Premium Modules.
    // User said: "deve permitir entrar pero no usar las funviones no contratadas"
    // So if isLocked (Trial Expired), we might still allow entry to dashboard (surveys) but maybe read-only?
    // For now, let's Stick to: Premium Modules are STRICTLY BLOCKED.
    // And if Trial Expired, maybe we block EVERYTHING or just let them see the dashboard?
    // User said: "cuando le den clik a las funciones no contratadas... solo deve de tener acceso a las herramientas contratadas"

    if (!hasAccess) {
        return <TrialExpiredWall />
    }

    // Optional: If users strictly want "Trial Expired" to block EVERYTHING (even Surveys), keep this.
    // But user implication was "partial access". 
    // Let's assume Surveys is core and always accessible (maybe read-only later), 
    // but the Guard mainly protects the Premium Modules now.

    return <>{children}</>
}
