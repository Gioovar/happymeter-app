'use client'

import { useState } from 'react'
import { ShieldAlert, Trash2, Plus, Loader2, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'
import { toggleSuperAdminRole } from '@/actions/admin-dashboard'

interface AdminUser {
    userId: string
    businessName: string | null
    role: string
    createdAt: Date
    email?: string // Might be missing if not joined, but for display we try
}

export default function SuperAdminManagement({ admins, currentUserEmail }: { admins: AdminUser[], currentUserEmail: string }) {
    const [inviteEmail, setInviteEmail] = useState('')
    const [loading, setLoading] = useState(false)

    // Hardcoded list of immutable admins
    const IMMUTABLE_ADMINS = ['gtrendy2017@gmail.com', 'gioovar@gmail.com', 'armelzuniga87@gmail.com']
    const isOwner = currentUserEmail === 'gtrendy2017@gmail.com'

    const handleInvite = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!inviteEmail) return
        if (!isOwner) {
            toast.error('Solo el Dueño puede invitar nuevos Super Admins.')
            return
        }

        if (!confirm(`¿Hacer Super Admin a ${inviteEmail}? Tendrá acceso TOTAL.`)) return

        setLoading(true)
        try {
            await toggleSuperAdminRole(inviteEmail, 'PROMOTE')
            toast.success('¡Usuario promovido a Super Admin!')
            setInviteEmail('')
        } catch (error: any) {
            toast.error(error.message)
        } finally {
            setLoading(false)
        }
    }

    const handleDemote = async (email: string) => { // We use email if available, or fetch by ID? Action takes email.
        // If we don't have email in the list, we can't easily use the action which expects email to finding Clerk user.
        // Ideally action should take userId. But let's assume we know the email or the user is in the list.
        // Wait, getSuperAdmins returns userId, businessName. No email.
        // We really should return email in getSuperAdmins.
        // For now, I'll update getSuperAdmins to include email or this component won't work well.
        // But let's write this component assuming admins has email.

        if (!isOwner) {
            toast.error('Solo el Dueño puede remover Super Admins.')
            return
        }

        if (IMMUTABLE_ADMINS.includes(email)) {
            toast.error('Este Admin es inamovible.')
            return
        }

        if (!confirm(`¿Revocar acceso Super Admin a ${email}?`)) return

        setLoading(true)
        try {
            await toggleSuperAdminRole(email, 'DEMOTE')
            toast.success('Acceso revocado correctamente.')
        } catch (error: any) {
            toast.error(error.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* List */}
            <div className="bg-[#0f0f0f] border border-white/10 rounded-2xl p-6">
                <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                    <ShieldAlert className="w-5 h-5 text-red-500" />
                    Equipo God Mode
                </h3>
                <div className="space-y-4">
                    {admins.map((admin) => (
                        <div key={admin.userId} className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5">
                            <div>
                                <p className="font-bold text-white">{admin.businessName || 'Admin'}</p>
                                <p className="text-xs text-gray-500">{admin.userId}</p>
                                {/* We display ID if email missing, ideally we fetch email */}
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] bg-red-500/20 text-red-400 px-2 py-1 rounded border border-red-500/20">
                                    SUPER ADMIN
                                </span>
                                {isOwner && (
                                    <button
                                        onClick={() => handleDemote(admin.email || '')}
                                        className="p-2 hover:bg-red-500/20 rounded-lg text-gray-500 hover:text-red-500 transition"
                                        title="Revocar Acceso"
                                        disabled={!admin.email}
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Invite Form */}
            <div className="bg-[#0f0f0f] border border-white/10 rounded-2xl p-6 h-fit">
                <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                    <Plus className="w-5 h-5 text-green-500" />
                    Invitar Nuevo Admin
                </h3>
                <p className="text-gray-400 text-sm mb-6">
                    Advertencia: Los Super Admins tienen acceso completo a los datos, finanzas y configuración de TODOS los clientes.
                </p>

                {isOwner ? (
                    <form onSubmit={handleInvite} className="space-y-4">
                        <div>
                            <label className="text-xs text-gray-500 mb-1 block">Email del Usuario (Debe estar registrado)</label>
                            <input
                                type="email"
                                value={inviteEmail}
                                onChange={(e) => setInviteEmail(e.target.value)}
                                placeholder="usuario@ejemplo.com"
                                className="w-full bg-black border border-white/20 rounded-lg p-3 text-white outline-none focus:border-green-500 transition"
                                required
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={loading || !inviteEmail}
                            className="w-full py-3 bg-white text-black font-bold rounded-lg hover:bg-gray-200 transition flex items-center justify-center gap-2"
                        >
                            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                            Promover a Super Admin
                        </button>
                    </form>
                ) : (
                    <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl text-yellow-200 text-sm">
                        Solo el Dueño de la cuenta (gtrendy2017@gmail.com) puede invitar a nuevos administradores.
                    </div>
                )}
            </div>
        </div>
    )
}
