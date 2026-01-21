'use client'

import { useState } from 'react'
import { Search, Shield, ShieldAlert, Trash2, Mail, Calendar, BarChart3, Loader2, MoreHorizontal } from 'lucide-react'
import { format } from 'date-fns'
import Image from 'next/image'
import UserDetailModal from './UserDetailModal'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { toggleUserStatus } from '@/actions/admin-dashboard'

interface User {
    id: string
    userId: string
    businessName: string | null
    email: string | null
    plan: string
    role: string
    createdAt: Date
    branchCount: number
    surveyCount: number
    photoUrl: string | null
    banned?: boolean
    isActive: boolean
}

export default function UsersTableClient({ initialUsers }: { initialUsers: User[] }) {
    const [users, setUsers] = useState<User[]>(initialUsers)
    const [search, setSearch] = useState('')
    const [selectedUser, setSelectedUser] = useState<User | null>(null)
    const router = useRouter()

    const filteredUsers = users.filter(user =>
        (user.email || '').toLowerCase().includes(search.toLowerCase()) ||
        user.userId.includes(search)
    )

    const handleToggleStatus = async (userId: string, currentStatus: boolean, e: React.MouseEvent) => {
        e.stopPropagation()
        const newStatus = !currentStatus

        // Optimistic update
        setUsers(prev => prev.map(u => u.userId === userId ? { ...u, isActive: newStatus } : u))

        try {
            await toggleUserStatus(userId, newStatus)
            toast.success(`Usuario ${newStatus ? 'activado' : 'desactivado'}`)
            router.refresh()
        } catch (error) {
            // Revert on error
            setUsers(prev => prev.map(u => u.userId === userId ? { ...u, isActive: currentStatus } : u))
            toast.error('Error al cambiar estado')
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 flex items-center gap-2 w-full max-w-sm">
                    <Search className="w-4 h-4 text-gray-500" />
                    <input
                        type="text"
                        placeholder="Buscar por nombre, email o ID..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="bg-transparent border-none focus:outline-none text-sm w-full text-white"
                    />
                </div>
                <div className="text-xs text-gray-500">
                    {filteredUsers.length} usuarios encontrados
                </div>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-white/10 bg-white/5">
                                <th className="p-4 text-xs font-bold text-gray-400 uppercase">Usuario / Negocio</th>
                                <th className="p-4 text-xs font-bold text-gray-400 uppercase">Rol & Plan</th>
                                <th className="p-4 text-xs font-bold text-gray-400 uppercase">Métricas</th>
                                <th className="p-4 text-xs font-bold text-gray-400 uppercase">Registro</th>
                                <th className="p-4 text-xs font-bold text-gray-400 uppercase">Estado</th>
                                <th className="p-4 text-xs font-bold text-gray-400 uppercase text-right">Detalles</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {filteredUsers.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="p-8 text-center text-gray-500">
                                        No se encontraron usuarios.
                                    </td>
                                </tr>
                            ) : (
                                filteredUsers.map(user => (
                                    <tr
                                        key={user.userId}
                                        className="hover:bg-white/[0.02] transition cursor-pointer group"
                                        onClick={() => setSelectedUser(user)}
                                    >
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-gray-800 overflow-hidden relative border border-white/10">
                                                    {user.photoUrl ? (
                                                        <Image src={user.photoUrl} alt={user.businessName || 'User'} fill className="object-cover" />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-xs font-bold text-gray-500 bg-gradient-to-br from-gray-700 to-gray-800">
                                                            {(user.businessName || user.userId).charAt(0).toUpperCase()}
                                                        </div>
                                                    )}
                                                </div>
                                                <div>
                                                    <div className="font-bold text-sm text-white">{user.businessName || 'Sin Nombre'}</div>
                                                    <div className="text-xs text-gray-400 flex items-center gap-1">
                                                        <Mail className="w-3 h-3" /> {user.email || user.userId.substring(0, 15) + '...'}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <div className="space-y-1">
                                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${user.role === 'SUPER_ADMIN' ? 'bg-red-500/20 border-red-500/50 text-red-300' :
                                                    'bg-gray-500/20 border-gray-500/50 text-gray-400'
                                                    }`}>
                                                    {user.role}
                                                </span>
                                                <br />
                                                <span className={`text-xs font-bold px-2 py-1 rounded inline-block mt-1 ${user.plan === 'PRO' || user.plan === 'POWER' ? 'bg-violet-500/20 text-violet-300' :
                                                    user.plan === 'STARTER' ? 'bg-blue-500/20 text-blue-300' :
                                                        'bg-white/5 text-gray-400'
                                                    }`}>
                                                    {user.plan}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-4 text-sm text-gray-400">
                                                <div className="flex flex-col">
                                                    <span className="text-xs text-gray-500">Sucr.</span>
                                                    <span className="font-bold text-white">{user.branchCount}</span>
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-xs text-gray-500">Surv.</span>
                                                    <span className="font-bold text-white">{user.surveyCount}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4 text-sm text-gray-500">
                                            <div className="flex items-center gap-1">
                                                <Calendar className="w-3 h-3" />
                                                {format(new Date(user.createdAt), 'dd MMM yyyy')}
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <button
                                                onClick={(e) => handleToggleStatus(user.userId, user.isActive, e)}
                                                className={`w-10 h-5 rounded-full relative transition-colors duration-200 ${user.isActive ? 'bg-green-500' : 'bg-red-500/50'}`}
                                                title={user.isActive ? 'Desactivar usuario' : 'Activar usuario'}
                                            >
                                                <div className={`w-3 h-3 bg-white rounded-full absolute top-1 transition-all duration-200 ${user.isActive ? 'left-6' : 'left-1'}`} />
                                            </button>
                                        </td>
                                        <td className="p-4 text-right">
                                            <button className="p-2 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition">
                                                <MoreHorizontal className="w-5 h-5" />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <UserDetailModal
                user={selectedUser}
                isOpen={!!selectedUser}
                onClose={() => setSelectedUser(null)}
                onUpdate={() => {
                    toast.success('Usuario actualizado')
                    router.refresh()
                    setSelectedUser(null)
                }}
            />
        </div>
    )
}
