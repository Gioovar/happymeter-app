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
    Armchair
} from 'lucide-react'

export type NavigationMode = 'surveys' | 'loyalty' | 'processes' | 'reservations';

export interface NavItem {
    title: string;
    href: string;
    icon: any; // Lucide icon
    matchExact?: boolean;
    query?: Record<string, string>;
}

export const NAVIGATION_CONFIG: Record<NavigationMode, NavItem[]> = {
    surveys: [
        { title: 'Mis Encuestas', href: '/dashboard', icon: LayoutDashboard, matchExact: true },
        { title: 'Crear Nueva', href: '/dashboard/create', icon: PlusCircle },
        { title: 'Buzón Staff', href: '/dashboard/create', query: { mode: 'anonymous' }, icon: Shield },
        { title: 'Respuestas', href: '/dashboard/responses', icon: MessageSquare },
        { title: 'Equipo', href: '/dashboard/team', icon: Users },
        { title: 'Estadísticas', href: '/dashboard/analytics', icon: PieChart },
        { title: 'Reportes', href: '/dashboard/reports', icon: FileText },
        { title: 'Campañas', href: '/dashboard/campaigns', icon: Megaphone },
        { title: 'Academy', href: '/dashboard/academy', icon: GraduationCap },
    ],
    loyalty: [
        { title: 'Dashboard Lealtad', href: '/dashboard/loyalty', icon: ScanLine, matchExact: true },
        { title: 'Clientes', href: '/dashboard/loyalty', query: { tab: 'clients' }, icon: Users },
        { title: 'Juegos', href: '/dashboard/games', icon: Gamepad2 },
        { title: 'Logros', href: '/dashboard/achievements', icon: Trophy },
        { title: 'Campañas', href: '/dashboard/campaigns', icon: Megaphone },
    ],
    processes: [
        { title: 'Dashboard Procesos', href: '/dashboard/processes', icon: Workflow },
        { title: 'Flujos Activos', href: '/dashboard/processes/flows', icon: GitMerge },
        { title: 'Tiempos de Atención', href: '/dashboard/processes/times', icon: Clock },
        { title: 'Incidencias', href: '/dashboard/processes/issues', icon: AlertCircle },
        { title: 'Equipo', href: '/dashboard/team', icon: Users },
    ],
    reservations: [
        { title: 'Agenda', href: '/dashboard/reservations', icon: CalendarDays },
        { title: 'Capacidad', href: '/dashboard/reservations/capacity', icon: Armchair },
        { title: 'Próximas', href: '/dashboard/reservations/upcoming', icon: CalendarCheck },
        { title: 'Configuración', href: '/dashboard/settings', icon: Settings },
    ]
};

export const GLOBAL_NAV_ITEMS: NavItem[] = [
    { title: 'Ayuda y Soporte', href: '/dashboard/help', icon: HelpCircle },
    { title: 'Configuración', href: '/dashboard/settings', icon: Settings },
];
