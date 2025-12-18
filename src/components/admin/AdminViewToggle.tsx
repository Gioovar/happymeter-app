'use client'

import { useAdminView } from '@/context/AdminViewContext'
import { Eye, ShieldAlert, LogOut } from 'lucide-react'

export default function AdminViewToggle() {
    const { isSimulating, realRole, toggleSimulation } = useAdminView()

    // Only show for Admins
    if (realRole !== 'ADMIN' && realRole !== 'SUPER_ADMIN') return null

    return (
        <button
            onClick={toggleSimulation}
            className={`
                flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold transition-all border shadow-lg
                ${isSimulating
                    ? 'bg-red-500/10 border-red-500/50 text-red-400 hover:bg-red-500/20'
                    : 'bg-violet-500/10 border-violet-500/50 text-violet-400 hover:bg-violet-500/20'}
            `}
        >
            {isSimulating ? (
                <>
                    <ShieldAlert className="w-3.5 h-3.5" />
                    <span>Volver a Admin</span>
                </>
            ) : (
                <>
                    <Eye className="w-3.5 h-3.5" />
                    <span>Ver como Usuario</span>
                </>
            )}
        </button>
    )
}
