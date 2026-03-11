/**
 * Diccionario centralizado de rutas del sistema Dashboard (Tenant Isolation).
 * 
 * Todas las URLs relativas al dashboard de una sucursal (branchSlug) deben registrarse 
 * aquí para evitar literales de texto dispersos y asegurar que el inyector del `branchSlug` no se pierda.
 */

export const DashboardRoutes = {
    // Core & Analíticas
    home: (slug: string) => `/dashboard${slug ? `/${slug}` : ''}`,
    reports: (slug: string) => `/dashboard${slug ? `/${slug}` : ''}/reports`,
    reportDetail: (slug: string, surveyId: string) => `/dashboard${slug ? `/${slug}` : ''}/reports/${surveyId}`,
    achievements: (slug: string) => `/dashboard${slug ? `/${slug}` : ''}/achievements`,
    help: (slug: string) => `/dashboard${slug ? `/${slug}` : ''}/help`,
    helpQR: (slug: string) => `/dashboard${slug ? `/${slug}` : ''}/help/qr`,

    // Configuración & Facturación
    settings: (slug: string) => `/dashboard${slug ? `/${slug}` : ''}/settings`,
    billing: (slug: string) => `/dashboard${slug ? `/${slug}` : ''}/settings/billing`,

    // Módulos de Operación Pura
    chat: (slug: string) => `/dashboard${slug ? `/${slug}` : ''}/chat`,
    responses: (slug: string) => `/dashboard${slug ? `/${slug}` : ''}/responses`,
    createPrompt: (slug: string) => `/dashboard${slug ? `/${slug}` : ''}/create`,
    editSurvey: (slug: string, surveyId: string) => `/dashboard${slug ? `/${slug}` : ''}/edit/${surveyId}`,
    tickets: (slug: string) => `/dashboard${slug ? `/${slug}` : ''}/tickets`,

    // Sub-Dashboards Operativos Independientes
    reservations: (slug: string) => `/dashboard${slug ? `/${slug}` : ''}/reservations`,
    reservationsSetup: (slug: string) => `/dashboard${slug ? `/${slug}` : ''}/reservations/setup`,
    processes: (slug: string) => `/dashboard${slug ? `/${slug}` : ''}/processes`,
    processNew: (slug: string) => `/dashboard${slug ? `/${slug}` : ''}/processes/new`,

    // Módulos de Programas/Juegos
    games: (slug: string) => `/dashboard${slug ? `/${slug}` : ''}/games`
} as const;

export type RouteKey = keyof typeof DashboardRoutes;
