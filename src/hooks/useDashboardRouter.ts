import { useRouter, useParams } from 'next/navigation'
import { DashboardRoutes, RouteKey } from '@/config/routes'

/**
 * Service/Hook centralizado para la navegación estricta dentro del ecosistema Multi-Tenant (Route Builder).
 * 
 * Este helper abstrae la sintaxis hardcodeada (strings manuales). Para navegar, 
 * ahora debes referenciar las llaves tipadas de `DashboardRoutes` y proveer 
 * sus parámetros secundarios si los requiere.
 */
export function useDashboardRouter() {
    const router = useRouter()
    const params = useParams()

    // Fallback safe si la página actual no está dentro del directorio [branchSlug]
    const branchSlug = (params?.branchSlug as string) || ''

    // Calculates core path avoiding Trailing slashes
    const basePath = `/dashboard${branchSlug ? `/${branchSlug}` : ''}`

    /**
     * Navega dinámicamente inyectando el branch activo.
     * @example navigateTo('reportDetail', surveyId)
     */
    const navigateTo = <K extends RouteKey>(
        route: K,
        ...args: Parameters<typeof DashboardRoutes[K]> extends [string, ...infer Rest] ? Rest : never
    ) => {
        // Ejecuta la función de la ruta pasándole `branchSlug` como primer parámetro inamovible
        const path = (DashboardRoutes[route] as any)(branchSlug, ...args)
        router.push(path)
    }

    /**
     * Reemplaza historial inyectando el branch activo.
     */
    const replaceTo = <K extends RouteKey>(
        route: K,
        ...args: Parameters<typeof DashboardRoutes[K]> extends [string, ...infer Rest] ? Rest : never
    ) => {
        const path = (DashboardRoutes[route] as any)(branchSlug, ...args)
        router.replace(path)
    }

    /**
     * Resuelve el string literal (href target) para anclas pasivas <Link>
     * @example <Link href={getUrl('settings')}>
     */
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
