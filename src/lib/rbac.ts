export type HappyModule =
    | 'RESERVATIONS'
    | 'TEAM'
    | 'BILLING'
    | 'SETTINGS'
    | 'SURVEYS'
    | 'REPORTS'
    | 'LOYALTY';

export type HappyAction =
    | 'VIEW'
    | 'EDIT'
    | 'CREATE'
    | 'DELETE'
    | 'MANAGE_BILLING'
    | 'MANAGE_ROLES'
    | 'OPERATE'; // specialized operational actions (check-in, hostess, etc)

export type TeamRoleType = 'ADMIN' | 'EDITOR' | 'SUPERVISOR' | 'OBSERVER' | 'OPERATOR' | 'HOSTESS';

// Default matrix mapping based on Meta Business Manager concepts
const ROLE_PERMISSIONS: Record<TeamRoleType, Partial<Record<HappyModule, HappyAction[]>>> = {
    ADMIN: {
        RESERVATIONS: ['VIEW', 'EDIT', 'CREATE', 'DELETE', 'OPERATE'],
        TEAM: ['VIEW', 'EDIT', 'CREATE', 'DELETE', 'MANAGE_ROLES'],
        BILLING: ['VIEW', 'MANAGE_BILLING'],
        SETTINGS: ['VIEW', 'EDIT'],
        SURVEYS: ['VIEW', 'EDIT', 'CREATE', 'DELETE'],
        REPORTS: ['VIEW'],
        LOYALTY: ['VIEW', 'EDIT', 'CREATE', 'DELETE'],
    },
    EDITOR: {
        RESERVATIONS: ['VIEW', 'EDIT', 'CREATE', 'OPERATE'],
        TEAM: [], // Cannot manage team
        BILLING: [], // Cannot see billing
        SETTINGS: ['VIEW'], // Basic read access to general settings
        SURVEYS: ['VIEW', 'EDIT', 'CREATE'],
        REPORTS: ['VIEW'],
        LOYALTY: ['VIEW', 'EDIT', 'CREATE'],
    },
    SUPERVISOR: {
        RESERVATIONS: ['VIEW', 'EDIT', 'OPERATE'], // Can oversee and edit mistakes
        TEAM: ['VIEW'], // Can see who is on the team to assign tasks
        BILLING: [],
        SETTINGS: ['VIEW'],
        SURVEYS: ['VIEW'],
        REPORTS: ['VIEW'], // Can see operational reports
        LOYALTY: ['VIEW'],
    },
    OBSERVER: {
        RESERVATIONS: ['VIEW'],
        TEAM: ['VIEW'],
        BILLING: [],
        SETTINGS: [],
        SURVEYS: ['VIEW'],
        REPORTS: ['VIEW'],
        LOYALTY: ['VIEW'],
    },
    OPERATOR: {
        RESERVATIONS: ['VIEW', 'OPERATE'],
        TEAM: [],
        BILLING: [],
        SETTINGS: [],
        SURVEYS: ['VIEW'],
        REPORTS: [],
        LOYALTY: ['VIEW', 'OPERATE'],
    },
    HOSTESS: {
        RESERVATIONS: ['VIEW', 'OPERATE', 'CREATE'],
        TEAM: [],
        BILLING: [],
        SETTINGS: [],
        SURVEYS: [],
        REPORTS: [],
        LOYALTY: [],
    }
};

/**
 * Validates if a user role has permission to perform an action on a specific module.
 * 
 * @param role The TeamRole enum string of the user in the current context
 * @param action The intended action string
 * @param module The target system module string
 * @returns boolean True if allowed, False if denied
 */
export function hasPermission(role: string | null | undefined, action: HappyAction, module: HappyModule): boolean {
    if (!role) return false;

    // Super Admin / System Roles boundary (if interacting dynamically)
    if (role === 'SUPER_ADMIN') return true;

    const rolePerms = ROLE_PERMISSIONS[role as TeamRoleType];
    if (!rolePerms) return false; // Unknown role

    const modulePerms = rolePerms[module];
    if (!modulePerms) return false; // Module not defined for this role

    // Check if the specific action is included in the permissions array for that module
    return modulePerms.includes(action);
}

/**
 * Returns a human-readable summary of the role's permissions for UI display
 */
export function getRoleSummary(role: TeamRoleType) {
    const descriptions = {
        ADMIN: {
            name: "Administrador",
            description: "Acceso total al sistema y a todas sus funciones.",
            allowed: ["Suscripciones y cobros", "Gestión de reservaciones", "Permisos y equipo", "Eliminar establecimientos"],
            denied: []
        },
        EDITOR: {
            name: "Editor / Mánager",
            description: "Puede gestionar el día a día sin tocar configuraciones sensibles.",
            allowed: ["Modificar reservaciones", "Crear encuestas y lealtad", "Operar la app de Hostess", "Ver reportes"],
            denied: ["Suscripciones o pagos", "Cobros u opciones de facturación", "Eliminar cuenta de negocio"]
        },
        SUPERVISOR: {
            name: "Supervisor",
            description: "Enfocado en revisar tareas y monitorear operación.",
            allowed: ["Visualizar reportes en tiempo real", "Editar información de reservas", "Ver equipo de trabajo"],
            denied: ["Crear sucursales o roles", "Cobros y planes", "Eliminar información"]
        },
        OBSERVER: {
            name: "Observador",
            description: "Solo puede visualizar información, útil para socios o consultores.",
            allowed: ["Ver analíticas y reportes", "Ver lista de reservaciones", "Información de encuestas"],
            denied: ["Modificar cualquier dato", "Responder reseñas", "Descargar membresías", "Pagos"]
        },
        OPERATOR: {
            name: "Operador de Piso",
            description: "Rol restringido para tareas específicas usando las Apps móviles.",
            allowed: ["Validar QR's", "Tomar órdenes de tareas", "Ver su propia asignación"],
            denied: ["Ver reportes financieros", "Ver pagos", "Acceso al Dashboard Web administrativo"]
        },
        HOSTESS: {
            name: "Hostess",
            description: "Control exclusivo del flujo de mesas y recepción.",
            allowed: ["Layout de Mesas y Recepción", "Asignación de clientes", "Check-in de Reservaciones"],
            denied: ["Reportes de negocio", "Lealtad y recompensas de Admin", "Planes de Pago"]
        }
    };

    return descriptions[role] || descriptions.OBSERVER;
}
