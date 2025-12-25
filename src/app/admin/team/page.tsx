'use client'

import { useState, useEffect, useTransition } from 'react'
import { Plus, Mail, Shield, Trash2, Copy, Check, Loader2, Users } from 'lucide-react'
import { toast } from 'sonner'
import { inviteTeamMember, getTeamMembers, deleteInvitation } from '@/actions/team'

export default function TeamPage() {
    const [members, setMembers] = useState<any[]>([])
    const [invitations, setInvitations] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isPending, startTransition] = useTransition()

    // Form
    const [email, setEmail] = useState('')
    const [role, setRole] = useState<'ADMIN' | 'STAFF' | 'REPRESENTATIVE'>('STAFF')
    const [state, setState] = useState('')
    const [generatedLink, setGeneratedLink] = useState('')

    const mexicanStates = [
        "Aguascalientes", "Baja California", "Baja California Sur", "Campeche", "Chiapas", "Chihuahua", "Ciudad de México", "Coahuila", "Colima", "Durango", "Estado de México", "Guanajuato", "Guerrero", "Hidalgo", "Jalisco", "Michoacán", "Morelos", "Nayarit", "Nuevo León", "Oaxaca", "Puebla", "Querétaro", "Quintana Roo", "San Luis Potosí", "Sinaloa", "Sonora", "Tabasco", "Tamaulipas", "Tlaxcala", "Veracruz", "Yucatán", "Zacatecas"
    ]

    useEffect(() => {
        loadData()
    }, [])

    const loadData = async () => {
        try {
            const data = await getTeamMembers()
            setMembers(data.members)
            setInvitations(data.invitations)
        } catch (error) {
            console.error(error)
        } finally {
            setIsLoading(false)
        }
    }

    const handleInvite = async (e: React.FormEvent) => {
        e.preventDefault()
        setGeneratedLink('')

        startTransition(async () => {
            try {
                if (role === 'REPRESENTATIVE' && !state) {
                    toast.error('Debes seleccionar un estado para el representante')
                    return
                }
                const res = await inviteTeamMember(email, role, state)
                toast.success('Invitación creada')
                setGeneratedLink(res.link)
                setEmail('')
                setState('')
                loadData()
            } catch (error) {
                toast.error('Error al crear invitación')
            }
        })
    }

    const handleDelete = async (id: string) => {
        if (!confirm('¿Eliminar invitación?')) return
        try {
            await deleteInvitation(id)
            toast.success('Eliminada')
            loadData()
        } catch (error) {
            toast.error('Error')
        }
    }

    const copyLink = () => {
        navigator.clipboard.writeText(generatedLink)
        toast.success('Enlace copiado')
    }

    if (isLoading) return <div className="p-8 text-white"><Loader2 className="animate-spin" /></div>

    return (
        <div className="p-6 md:p-8 space-y-8 max-w-6xl mx-auto text-white">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-violet-400 to-fuchsia-400">
                        Equipo y Permisos
                    </h1>
                    <p className="text-gray-400 mt-1">Gestiona los administradores y staff de la plataforma.</p>
                </div>
            </div>

            {/* Invite Form */}
            <div className="bg-[#111] border border-white/10 rounded-2xl p-6">
                <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <Plus className="w-5 h-5 text-violet-500" />
                    Invitar Nuevo Miembro
                </h2>

                <form onSubmit={handleInvite} className="flex flex-col md:flex-row gap-4 items-end">
                    <div className="flex-1 w-full">
                        <label className="text-xs uppercase text-gray-500 font-bold mb-1 block">Email</label>
                        <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="correo@ejemplo.com"
                            className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2.5 focus:border-violet-500 outline-none transition"
                        />
                    </div>
                    <div className="w-full md:w-48">
                        <label className="text-xs uppercase text-gray-500 font-bold mb-1 block">Rol</label>
                        <select
                            value={role}
                            onChange={(e) => setRole(e.target.value as any)}
                            className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2.5 focus:border-violet-500 outline-none transition text-white appearance-none"
                        >
                            <option value="STAFF">Staff (Soporte)</option>
                            <option value="ADMIN">Administrador</option>
                            <option value="REPRESENTATIVE">Representante</option>
                        </select>
                    </div>

                    {role === 'REPRESENTATIVE' && (
                        <div className="w-full md:w-48 animate-in fade-in slide-in-from-left-2">
                            <label className="text-xs uppercase text-gray-500 font-bold mb-1 block">Estado</label>
                            <select
                                value={state}
                                onChange={(e) => setState(e.target.value)}
                                className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2.5 focus:border-violet-500 outline-none transition text-white appearance-none"
                            >
                                <option value="">Seleccionar...</option>
                                {mexicanStates.map(s => (
                                    <option key={s} value={s}>{s}</option>
                                ))}
                            </select>
                        </div>
                    )}
                    <button
                        type="submit"
                        disabled={isPending}
                        className="w-full md:w-auto px-6 py-2.5 bg-violet-600 hover:bg-violet-500 text-white font-bold rounded-lg transition disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
                        Generar Invitación
                    </button>
                </form>

                {generatedLink && (
                    <div className="mt-6 bg-green-500/10 border border-green-500/20 rounded-xl p-4 flex flex-col md:flex-row items-center justify-between gap-4 animate-in fade-in slide-in-from-top-2">
                        <div className="flex-1 overflow-hidden">
                            <p className="text-green-400 text-sm font-bold mb-1">¡Invitación Creada!</p>
                            <p className="text-gray-400 text-xs truncate">{generatedLink}</p>
                        </div>
                        <button onClick={copyLink} className="whitespace-nowrap px-4 py-2 bg-green-500 text-black font-bold rounded-lg hover:bg-green-400 transition flex items-center gap-2 text-sm">
                            <Copy className="w-4 h-4" />
                            Copiar Enlace
                        </button>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Active Members */}
                <div className="space-y-4">
                    <h3 className="text-xl font-bold flex items-center gap-2">
                        <Shield className="w-5 h-5 text-blue-400" />
                        Miembros Activos
                    </h3>
                    <div className="bg-[#111] border border-white/10 rounded-2xl overflow-hidden">
                        {members.length === 0 ? (
                            <p className="p-6 text-gray-500 text-center text-sm">No hay miembros aún.</p>
                        ) : (
                            <div className="divide-y divide-white/5">
                                {members.map((m) => (
                                    <div key={m.id} className="p-4 flex items-center justify-between hover:bg-white/5 transition">
                                        <div>
                                            {/* We don't have email in UserSettings, showing businessName or ID */}
                                            <p className="font-medium text-white">{m.businessName}</p>
                                            <span className={`text-[10px] px-2 py-0.5 rounded-full uppercase font-bold ${m.role === 'SUPER_ADMIN' ? 'bg-fuchsia-500/20 text-fuchsia-400' :
                                                m.role === 'ADMIN' ? 'bg-violet-500/20 text-violet-400' :
                                                    m.role === 'REPRESENTATIVE' ? 'bg-emerald-500/20 text-emerald-400' :
                                                        'bg-blue-500/20 text-blue-400'
                                                }`}>
                                                {m.role} {m.state ? `(${m.state})` : ''}
                                            </span>
                                        </div>
                                        <div className="text-xs text-gray-500">
                                            {new Date(m.createdAt).toLocaleDateString()}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Pending Invitations */}
                <div className="space-y-4">
                    <h3 className="text-xl font-bold flex items-center gap-2">
                        <Mail className="w-5 h-5 text-yellow-400" />
                        Invitaciones Pendientes
                    </h3>
                    <div className="bg-[#111] border border-white/10 rounded-2xl overflow-hidden">
                        {invitations.length === 0 ? (
                            <p className="p-6 text-gray-500 text-center text-sm">No hay invitaciones pendientes.</p>
                        ) : (
                            <div className="divide-y divide-white/5">
                                {invitations.map((inv) => (
                                    <div key={inv.id} className="p-4 flex items-center justify-between hover:bg-white/5 transition">
                                        <div className="flex-1 min-w-0 mr-4">
                                            <p className="font-medium text-white truncate">{inv.email}</p>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className="text-[10px] bg-yellow-500/10 text-yellow-500 px-2 py-0.5 rounded-full uppercase font-bold">
                                                    {inv.role} {inv.state ? `(${inv.state})` : ''}
                                                </span>
                                                <code className="text-[10px] text-gray-600 truncate max-w-[100px]">{inv.token}</code>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => handleDelete(inv.id)}
                                            className="p-2 hover:bg-red-500/20 text-gray-500 hover:text-red-400 rounded-lg transition"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
