import { useRouter } from 'next/navigation'
import { useDashboard } from '@/context/DashboardContext'

/**
 * Hook centralizado para manejar la navegación dentro del ecosistema del Dashboard.
 * 
 * Resuelve automáticamente el problema de "Tenant Isolation" asegurando que 
 * todas las redirecciones respeten el `basePath` de la sucursal activa (`/dashboard/[branchSlug]/*`).
 */
export function useDashboardRouter() {
    const router = useRouter()
    const { basePath } = useDashboard()

    /**
     * Navega a una ruta relativa al dashboard actual, preservando la sucursal activa.
     * @param path Ejemplo: '/chat' -> navega a '/dashboard/[branchSlug]/chat'
     */
    const pushDashboard = (path: string) => {
        const cleanPath = path.startsWith('/') ? path : `/${path}`
        // Evita duplicar '/dashboard' si por error se envía la ruta completa
        const finalPath = path.startsWith('/dashboard') ? path : `${basePath}${cleanPath}`
        router.push(finalPath)
    }

    /**
     * Reemplaza la ruta relativa al dashboard actual (sin dejar historial).
     * @param path Ejemplo: '/settings'
     */
    const replaceDashboard = (path: string) => {
        const cleanPath = path.startsWith('/') ? path : `/${path}`
        const finalPath = path.startsWith('/dashboard') ? path : `${basePath}${cleanPath}`
        router.replace(finalPath)
    }

    /**
     * Genera un string de URL completa preservando el contexto de la sucursal.
     * Útil para hipervínculos `<Link href={getDashboardUrl('/reports')}>`
     * @param path Ruta local de módulo, e.g. '/reports'
     */
    const getDashboardUrl = (path: string) => {
        const cleanPath = path.startsWith('/') ? path : `/${path}`
        return path.startsWith('/dashboard') ? path : `${basePath}${cleanPath}`
    }

    return {
        ...router,
        pushDashboard,
        replaceDashboard,
        getDashboardUrl,
        basePath
    }
}
