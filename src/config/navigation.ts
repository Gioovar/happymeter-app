import {
    LayoutDashboard,
    PlusCircle,
    Shield,
    MessageSquare,
    Users,
    Settings,
    PieChart,
    FileText,
    Megaphone,
    ScanLine,
    Gamepad2,
    Trophy,
    GraduationCap,
    HelpCircle,
    Workflow,
    Clock,
    CalendarDays,
    CalendarCheck,
    AlertCircle,
    GitMerge,
    Armchair,
    BarChart3,
    Gift,
    Settings2,
    Calendar
} from 'lucide-react'

export type NavigationMode = 'surveys' | 'loyalty' | 'processes' | 'reservations';

export interface NavItem {
    title: string;
    href: string;
    icon: any; // Lucide icon
    matchExact?: boolean;
    query?: Record<string, string>;
    feature?: string;
}

export const NAVIGATION_CONFIG: Record<NavigationMode, NavItem[]> = {
    surveys: [
        { title: 'Mis Encuestas', href: '/dashboard', icon: LayoutDashboard, matchExact: true },
        { title: 'Crear Nueva', href: '/dashboard/create', icon: PlusCircle },
        { title: 'Buzón Staff', href: '/dashboard/create', query: { mode: 'anonymous' }, icon: Shield, feature: 'growth_locked' },
        { title: 'Respuestas', href: '/dashboard/responses', icon: MessageSquare, feature: 'growth_locked' },
        { title: 'Equipo', href: '/dashboard/team', icon: Users, feature: 'growth_locked' },
        { title: 'Estadísticas', href: '/dashboard/analytics', icon: PieChart, feature: 'ai_analytics' },
        { title: 'Reportes', href: '/dashboard/reports', icon: FileText, feature: 'ai_analytics' },
        { title: 'Campañas', href: '/dashboard/campaigns', icon: Megaphone, feature: 'growth_locked' },
        { title: 'Academy', href: '/dashboard/academy', icon: GraduationCap, feature: 'growth_locked' },
    ],
    loyalty: [
        { title: 'Dashboard Lealtad', href: '/dashboard/loyalty', icon: ScanLine, matchExact: true },
        { title: 'Clientes', href: '/dashboard/loyalty', query: { tab: 'clients' }, icon: Users },
        { title: 'Juegos', href: '/dashboard/games', icon: Gamepad2 },
        { title: 'Logros', href: '/dashboard/achievements', icon: Trophy },
        { title: 'Historial de Premios', href: '/dashboard/loyalty/history', icon: Clock },
        { title: 'Campañas', href: '/dashboard/campaigns', icon: Megaphone },
    ],
    processes: [
        { title: 'Dashboard Procesos', href: '/dashboard/processes', icon: Workflow },
        { title: 'Supervisión', href: '/dashboard/supervision', icon: Shield },
        { title: 'Flujos Activos', href: '/dashboard/processes/flows', icon: GitMerge },
        { title: 'Tiempos de Atención', href: '/dashboard/processes/times', icon: Clock },
        { title: 'Incidencias', href: '/dashboard/processes/issues', icon: AlertCircle },
        { title: 'Equipo', href: '/dashboard/processes/team', icon: Users },
    ],
    reservations: [
        { title: 'Agenda', href: '/dashboard/reservations', icon: CalendarDays },
        { title: 'Capacidad', href: '/dashboard/reservations/setup', icon: Armchair },
        { title: 'Próximas', href: '/dashboard/reservations/upcoming', icon: CalendarCheck },
        { title: 'Configuración', href: '/dashboard/settings', icon: Settings },
    ]
};

export const MODES = [
    {
        id: 'surveys',
        label: 'Encuestas',
        href: '/dashboard',
        icon: BarChart3,
        color: 'from-violet-600 to-indigo-600'
    },
    {
        id: 'loyalty',
        label: 'Lealtad',
        href: '/dashboard/loyalty',
        icon: Gift,
        color: 'from-fuchsia-600 to-pink-600'
    },
    {
        id: 'processes',
        label: 'Procesos',
        href: '/dashboard/processes',
        icon: Settings2,
        color: 'from-cyan-600 to-blue-600'
    },
    {
        id: 'reservations',
        label: 'Reservas',
        href: '/dashboard/reservations',
        icon: Calendar,
        color: 'from-amber-500 to-orange-600'
    }
] as const;

export const GLOBAL_NAV_ITEMS: NavItem[] = [
    { title: 'Ayuda y Soporte', href: '/dashboard/help', icon: HelpCircle },
    { title: 'Configuración', href: '/dashboard/settings', icon: Settings },
];
