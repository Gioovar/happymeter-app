
'use client'

import { useState, useEffect } from 'react'
import { Search, MoreHorizontal, Shield, ShieldAlert, Trash2, Mail, Calendar, BarChart3, Loader2 } from 'lucide-react'
import { format } from 'date-fns'
import Image from 'next/image'

interface User {
    id: string
    name: string
    email: string
    image: string
    lastLogin: number
    createdAt: number
    banned: boolean
    plan: string
    surveyCount: number
}

export default function AdminUsersPage() {
    const [users, setUsers] = useState<User[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [actionLoading, setActionLoading] = useState<string | null>(null)

    useEffect(() => {
        fetchUsers()
    }, [])

    const fetchUsers = async () => {
        try {
            const res = await fetch('/api/admin/users')
            if (res.ok) {
                const data = await res.json()
                setUsers(data)
            }
        } catch (error) {
            console.error('Failed to fetch users', error)
        } finally {
            setIsLoading(false)
        }
    }

    const handleBan = async (userId: string, currentStatus: boolean) => {
        if (!confirm(`¿Estás seguro de ${currentStatus ? 'desbloquear' : 'bloquear'} a este usuario?`)) return

        setActionLoading(userId)
        try {
            const res = await fetch('/api/admin/users', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, banned: !currentStatus })
            })

            if (res.ok) {
                setUsers(users.map(u => u.id === userId ? { ...u, banned: !currentStatus } : u))
            }
        } catch (error) {
            console.error('Error toggling ban', error)
        } finally {
            setActionLoading(null)
        }
    }

    const handleDelete = async (userId: string) => {
        if (!confirm('PELIGRO: Esta acción eliminará permanentemente al usuario y TODOS sus datos. ¿Continuar?')) return

        setActionLoading(userId)
        try {
            const res = await fetch(`/api/admin/users?id=${userId}`, {
                method: 'DELETE'
            })

            if (res.ok) {
                setUsers(users.filter(u => u.id !== userId))
            }
        } catch (error) {
            console.error('Error deleting user', error)
        } finally {
            setActionLoading(null)
        }
    }

    const filteredUsers = users.filter(user =>
        user.name.toLowerCase().includes(search.toLowerCase()) ||
        user.email.toLowerCase().includes(search.toLowerCase())
    )

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-white p-8 font-sans">
            <div className="max-w-7xl mx-auto">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold flex items-center gap-3">
                            <Shield className="w-8 h-8 text-violet-500" />
                            Gestión de Usuarios
                        </h1>
                        <p className="text-gray-400 mt-2">Control total sobre los usuarios registrados en la plataforma.</p>
                    </div>
                    <div className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 flex items-center gap-2 w-64">
                        <Search className="w-4 h-4 text-gray-500" />
                        <input
                            type="text"
                            placeholder="Buscar usuario..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="bg-transparent border-none focus:outline-none text-sm w-full text-white"
                        />
                    </div>
                </div>

                <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-white/10 bg-white/5">
                                    <th className="p-4 text-xs font-bold text-gray-400 uppercase">Usuario</th>
                                    <th className="p-4 text-xs font-bold text-gray-400 uppercase">Estado</th>
                                    <th className="p-4 text-xs font-bold text-gray-400 uppercase">Plan</th>
                                    <th className="p-4 text-xs font-bold text-gray-400 uppercase">Actividad</th>
                                    <th className="p-4 text-xs font-bold text-gray-400 uppercase">Registro</th>
                                    <th className="p-4 text-xs font-bold text-gray-400 uppercase text-right">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {isLoading ? (
                                    <tr>
                                        <td colSpan={6} className="p-8 text-center text-gray-500">
                                            <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                                            Cargando usuarios...
                                        </td>
                                    </tr>
                                ) : filteredUsers.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="p-8 text-center text-gray-500">
                                            No se encontraron usuarios.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredUsers.map(user => (
                                        <tr key={user.id} className="hover:bg-white/[0.02] transition group">
                                            <td className="p-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-gray-800 overflow-hidden relative border border-white/10">
                                                        {user.image ? (
                                                            <Image src={user.image} alt={user.name} fill className="object-cover" />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center text-xs font-bold text-gray-500">
                                                                {user.name.charAt(0)}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <div className="font-bold text-sm">{user.name}</div>
                                                        <div className="text-xs text-gray-500 flex items-center gap-1">
                                                            <Mail className="w-3 h-3" /> {user.email}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                {user.banned ? (
                                                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-red-500/20 text-red-400 text-xs font-bold border border-red-500/20">
                                                        <ShieldAlert className="w-3 h-3" /> Banned
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-green-500/20 text-green-400 text-xs font-bold border border-green-500/20">
                                                        Activo
                                                    </span>
                                                )}
                                            </td>
                                            <td className="p-4">
                                                <span className={`text-xs font-bold px-2 py-1 rounded border ${user.plan === 'PRO' ? 'bg-violet-500/20 border-violet-500/50 text-violet-300' :
                                                    user.plan === 'STARTER' ? 'bg-blue-500/20 border-blue-500/50 text-blue-300' :
                                                        'bg-gray-500/20 border-gray-500/50 text-gray-400'
                                                    }`}>
                                                    {user.plan}
                                                </span>
                                            </td>
                                            <td className="p-4">
                                                <div className="flex items-center gap-4 text-sm text-gray-400">
                                                    <span className="flex items-center gap-1" title="Encuestas creadas">
                                                        <BarChart3 className="w-4 h-4" /> {user.surveyCount}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="p-4 text-sm text-gray-500">
                                                <div className="flex items-center gap-1">
                                                    <Calendar className="w-3 h-3" />
                                                    {user.createdAt ? format(new Date(user.createdAt), 'dd MMM yyyy') : '-'}
                                                </div>
                                            </td>
                                            <td className="p-4 text-right">
                                                <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition">
                                                    <div className="flex items-center gap-1 mr-2 border-r border-white/10 pr-2">
                                                        <button
                                                            onClick={async () => {
                                                                if (!confirm(`¿Iniciar sesión como ${user.name}?`)) return;
                                                                try {
                                                                    const res = await fetch(`/api/admin/users/${user.id}/impersonate`, { method: 'POST' })
                                                                    if (res.ok) {
                                                                        const { url } = await res.json()
                                                                        window.open(url, '_blank')
                                                                    } else {
                                                                        alert('Error al generar sesión')
                                                                    }
                                                                } catch (e) { console.error(e); alert('Error') }
                                                            }}
                                                            className="p-2 rounded-lg hover:bg-violet-500/10 text-gray-500 hover:text-violet-400 transition"
                                                            title="Iniciar sesión como este usuario (God Mode)"
                                                        >
                                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12h10" /><path d="M9 4v16" /><path d="m3 9-3 3 3 3" /><path d="M14 8V6a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-6a2 2 0 0 1-2-2v-2" /></svg>
                                                        </button>
                                                        <a
                                                            href={`/api/admin/users/${user.id}/export?format=meta`}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="p-2 rounded-lg hover:bg-blue-500/10 text-gray-500 hover:text-blue-400 transition"
                                                            title="Exportar para Meta Ads"
                                                        >
                                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path></svg>
                                                        </a>
                                                        <a
                                                            href={`/api/admin/users/${user.id}/export?format=whatsapp`}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="p-2 rounded-lg hover:bg-green-500/10 text-gray-500 hover:text-green-400 transition"
                                                            title="Exportar contactos WhatsApp"
                                                        >
                                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
                                                        </a>
                                                        <button
                                                            onClick={async () => {
                                                                if (!confirm(`¿Convertir a ${user.name} en Cadena?`)) return;
                                                                // Import dynamically or use standard fetch if server action is problematic in client component without proper setup
                                                                // But here we can use a small inline fetch or import the action if we change file to use server actions
                                                                // Since this is 'use client', we should better wrap the action or use a route handler.
                                                                // Or just call the action if nextjs allows (it does).
                                                                // We need to import it. Let's assume we imported it or use a fetch wrapper.
                                                                // BUT I haven't added the import. 
                                                                // Let's us a simple fetch wrapper to a new API route OR add the import.
                                                                // Since I can't add imports easily with replace_file_content at top AND here, I'll rely on a new api route for safety/ease
                                                                // OR I can use the manual upgrade API I created!
                                                                // It takes email. I have user.email.

                                                                try {
                                                                    const res = await fetch('/api/admin/manual-upgrade', {
                                                                        method: 'POST',
                                                                        headers: { 'Content-Type': 'application/json' },
                                                                        body: JSON.stringify({ email: user.email })
                                                                    })
                                                                    const data = await res.json()
                                                                    if (data.success) {
                                                                        alert('Usuario actualizado a Cadena exitosamente')
                                                                    } else {
                                                                        alert('Error: ' + (data.error || data.message))
                                                                    }
                                                                } catch (e) { console.error(e); alert('Error de conexión') }
                                                            }}
                                                            className="p-2 rounded-lg hover:bg-orange-500/10 text-gray-500 hover:text-orange-400 transition"
                                                            title="Upgrade to Chain (Cadena)"
                                                        >
                                                            <div className="flex items-center justify-center font-bold text-xs border border-current w-4 h-4 rounded">C</div>
                                                        </button>
                                                    </div>

                                                    <button
                                                        onClick={() => handleBan(user.id, user.banned)}
                                                        disabled={actionLoading === user.id}
                                                        className={`p-2 rounded-lg transition ${user.banned
                                                            ? 'bg-green-500/10 text-green-400 hover:bg-green-500/20'
                                                            : 'bg-yellow-500/10 text-yellow-400 hover:bg-yellow-500/20'
                                                            }`}
                                                        title={user.banned ? "Desbloquear usuario" : "Bloquear usuario"}
                                                    >
                                                        {actionLoading === user.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldAlert className="w-4 h-4" />}
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(user.id)}
                                                        disabled={actionLoading === user.id}
                                                        className="p-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition"
                                                        title="Eliminar usuario permanentemente"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    )
}
