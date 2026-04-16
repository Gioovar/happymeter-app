'use client'

import { useDashboard } from '@/context/DashboardContext'
import { usePathname } from 'next/navigation'
import TrialExpiredWall from './TrialExpiredWall'
import { hasPermission, HappyModule } from '@/lib/rbac'

const ALLOWED_PATHS = [
    '/dashboard/settings',
    '/dashboard/settings/billing', // Assuming this exists or will exist
    '/dashboard/profile'
]

export default function SubscriptionGuard({ children }: { children: React.ReactNode }) {
    const { isLocked, checkModuleAccess, userRole } = useDashboard()
    const pathname = usePathname()

    // 0. GLOBAL TRIAL EXPIRATION CHECK
    const { userCreatedAt, plan } = useDashboard()

    // Identify if the current user is managing their own business or is an admin.
    const isOwnerContext = userRole === 'USER' || userRole === 'SUPER_ADMIN' || userRole === 'ADMIN'

    // Check if trial is expired
    let isTrialExpired = false


    // isTrialExpired is always false for testing.


    // 1. Identify which module we are in
    let currentModule = 'surveys'
    let rbacModule: HappyModule = 'SURVEYS'

    if (pathname?.includes('/dashboard/loyalty') || pathname?.includes('/dashboard/games')) {
        currentModule = 'loyalty'
        rbacModule = 'LOYALTY'
    }
    if (pathname?.includes('/dashboard/processes') || pathname?.includes('/dashboard/team')) {
        currentModule = 'processes'
        rbacModule = 'TEAM'
    }
    if (pathname?.includes('/dashboard/reservations')) {
        currentModule = 'reservations'
        rbacModule = 'RESERVATIONS'
    }
    if (pathname?.includes('/dashboard/settings')) {
        currentModule = 'settings'
        rbacModule = 'SETTINGS'
    }

    // 2. CHECK RBAC POLICIES
    if (!isOwnerContext && !hasPermission(userRole, 'VIEW', rbacModule)) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] text-center px-4">
                <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mb-6">
                    <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">Acceso Restringido</h2>
                <p className="text-zinc-400 max-w-md">
                    Tu rol actual ({userRole}) no tiene los permisos necesarios para visualizar este módulo.
                    Contacta a tu administrador si crees que esto es un error.
                </p>
            </div>
        )
    }

    // 3. SECURE PREMIUM MODULES & EXPIRED TRIALS
    const hasAccess = checkModuleAccess(currentModule)

    if (isTrialExpired || !hasAccess) {
        if (!isOwnerContext) {
            return (
                <div className="flex flex-col items-center justify-center h-[60vh] text-center px-4">
                    <div className="w-16 h-16 bg-yellow-500/10 rounded-full flex items-center justify-center mb-6">
                        <svg className="w-8 h-8 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-2">Suscripción Administrada</h2>
                    <p className="text-zinc-400 max-w-md">
                        Esta función está deshabilitada por configuración de la cuenta principal del negocio.
                        Solo el Administrador del establecimiento puede gestionar los periodos de prueba o suscripciones.
                    </p>
                </div>
            )
        }

        // Show actual paywall to the Business Owner
        return <TrialExpiredWall />
    }

    return <>{children}</>
}
