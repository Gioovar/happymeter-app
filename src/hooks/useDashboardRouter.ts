import { useRouter, useParams, usePathname } from 'next/navigation'
import { DashboardRoutes, RouteKey } from '@/config/routes'

const RESERVED_SEGMENTS = new Set([
    'chains', 'chat', 'reports', 'achievements', 'help', 'settings', 'responses',
    'create', 'edit', 'reservations', 'processes', 'games', 'loyalty',
    'supervision', 'analytics', 'campaigns', 'team', 'tickets', 'team-chat'
])

/**
 * Service/Hook centralizado para la navegación estricta dentro del ecosistema Multi-Tenant (Route Builder).
 */
export function useDashboardRouter() {
    const router = useRouter()
    const params = useParams()
    const pathname = usePathname()

    // Determinación Robusta del Slug para componentes de Nivel Superior:
    // Primero intenta leer el de los params directos (si el componente está anidado correctamente)
    let explicitSlug = params?.branchSlug as string

    // Si no está, intuye el slug a partir del URL de navegación
    if (!explicitSlug && pathname) {
        const parts = pathname.split('/').filter(Boolean)
        // Ejemplo parts: ['dashboard', 'condesa', 'responses']
        if (parts.length >= 2 && parts[0] === 'dashboard') {
            const potentialSlug = parts[1]
            if (!RESERVED_SEGMENTS.has(potentialSlug)) {
                explicitSlug = potentialSlug
            }
        }
    }

    const branchSlug = explicitSlug || ''

    // Calculates core path avoiding Trailing slashes
    const basePath = `/dashboard${branchSlug ? `/${branchSlug}` : ''}`

    const navigateTo = <K extends RouteKey>(
        route: K,
        ...args: Parameters<typeof DashboardRoutes[K]> extends [string, ...infer Rest] ? Rest : never
    ) => {
        const path = (DashboardRoutes[route] as any)(branchSlug, ...args)
        router.push(path)
    }

    const replaceTo = <K extends RouteKey>(
        route: K,
        ...args: Parameters<typeof DashboardRoutes[K]> extends [string, ...infer Rest] ? Rest : never
    ) => {
        const path = (DashboardRoutes[route] as any)(branchSlug, ...args)
        router.replace(path)
    }

    const getUrl = <K extends RouteKey>(
        route: K,
        ...args: Parameters<typeof DashboardRoutes[K]> extends [string, ...infer Rest] ? Rest : never
    ) => {
        return (DashboardRoutes[route] as any)(branchSlug, ...args)
    }

    return {
        ...router,
        navigateTo,
        replaceTo,
        getUrl,
        basePath,
        branchSlug
    }
}
