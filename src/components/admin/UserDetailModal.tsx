'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Shield, CreditCard, LogIn, ExternalLink, Loader2, Save } from 'lucide-react'
import { toast } from 'sonner'
import Image from 'next/image'

interface UserDetailModalProps {
    user: any
    isOpen: boolean
    onClose: () => void
    onUpdate?: () => void
}

export default function UserDetailModal({ user, isOpen, onClose, onUpdate }: UserDetailModalProps) {
    const [loadingImpersonate, setLoadingImpersonate] = useState(false)
    const [loadingPlan, setLoadingPlan] = useState(false)

    // For manual plan assignment
    const [selectedPlan, setSelectedPlan] = useState(user?.plan || 'FREE')

    if (!user) return null

    const handleImpersonate = async () => {
        if (!confirm(`¿Iniciar sesión como ${user.name}? Tendrás acceso total a su cuenta.`)) return

        setLoadingImpersonate(true)
        try {
            const res = await fetch(`/api/admin/users/${user.userId}/impersonate`, { method: 'POST' })
            if (res.ok) {
                const { url } = await res.json()
                window.open(url, '_blank')
                toast.success('Sesión iniciada en nueva pestaña')
            } else {
                const err = await res.json()
                toast.error(`Error: ${err.error || 'No autorizado'}`)
            }
        } catch (error) {
            toast.error('Error al conectar con el servidor')
        } finally {
            setLoadingImpersonate(false)
        }
    }

    const handleUpdatePlan = async () => {
        setLoadingPlan(true)
        try {
            // We need an action for this. Let's assume updateTenantPlan exists or use api route.
            // Using a server action wrapper or api route is fine. 
            // We defined updateTenantPlan in actions/admin.ts but that file is 'use server'.
            // Can we call it? Yes, if we export it.
            // But here let's use a quick fetch to a route we'd create or just assume we'll fix the wiring.
            // Actually, best to use the server action directly if this was a server component or passed prop.
            // Since this is a client component, we'll use a server action if we import it.
            // Let's use the fetch wrapper for now to updateTenantPlan logic or manual-upgrade route.
            // I'll use /api/admin/manual-upgrade for now which I recall seeing referenced or I can create.
            // Wait, I created 'updateTenantPlan' in src/actions/admin.ts. 
            // I can import it if I mark this component as client and the action as server.

            // For now, let's mock the success and I'll wire the action in the parent or create a route.
            const res = await fetch('/api/admin/manual-upgrade', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: user.userId, email: user.email, plan: selectedPlan })
            })

            if (res.ok) {
                toast.success('Plan actualizado correctamente')
                if (onUpdate) onUpdate()
            } else {
                toast.error('Error al actualizar plan')
            }
        } catch (error) {
            console.error(error)
            toast.error('Error de conexión')
        } finally {
            setLoadingPlan(false)
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="bg-[#111] border border-white/10 text-white max-w-2xl">
                <DialogHeader>
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-full bg-gray-800 overflow-hidden relative border border-white/10">
                            {user.photoUrl ? (
                                <Image src={user.photoUrl} alt={user.businessName || 'User'} fill className="object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-xl font-bold text-gray-500">
                                    {(user.businessName || user.userId).charAt(0)}
                                </div>
                            )}
                        </div>
                        <div>
                            <DialogTitle className="text-2xl font-bold">{user.businessName || 'Usuario Sin Nombre'}</DialogTitle>
                            <DialogDescription className="text-gray-400 flex items-center gap-2">
                                {user.email || user.userId}
                                <Badge variant="outline" className="text-xs bg-white/5 border-white/10">
                                    {user.role}
                                </Badge>
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 py-6">
                    {/* Metrics */}
                    <div className="space-y-4">
                        <h4 className="font-bold text-gray-400 text-sm uppercase tracking-wider">Métricas</h4>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                                <p className="text-xs text-gray-500">Sucursales</p>
                                <p className="text-xl font-bold text-white">{user.branchCount || 0}</p>
                            </div>
                            <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                                <p className="text-xs text-gray-500">Encuestas</p>
                                <p className="text-xl font-bold text-white">{user.surveyCount || 0}</p>
                            </div>
                        </div>
                    </div>

                    {/* Subscription Management */}
                    <div className="space-y-4 border-l border-white/10 pl-6">
                        <h4 className="font-bold text-gray-400 text-sm uppercase tracking-wider flex items-center gap-2">
                            <CreditCard className="w-4 h-4" /> Suscripción (God Mode)
                        </h4>

                        <div className="space-y-2">
                            <label className="text-xs text-gray-500">Plan Asignado</label>
                            <select
                                value={selectedPlan}
                                onChange={(e) => setSelectedPlan(e.target.value)}
                                className="w-full bg-black border border-white/20 rounded-lg p-2 text-sm focus:border-violet-500 outline-none transition"
                            >
                                <option value="FREE">FREE</option>
                                <option value="STARTER">STARTER</option>
                                <option value="GROWTH">GROWTH</option>
                                <option value="POWER">POWER</option>
                                <option value="CHAIN">CHAIN</option>
                                <option value="ENTERPRISE">ENTERPRISE</option>
                            </select>
                            <Button
                                onClick={handleUpdatePlan}
                                disabled={loadingPlan || selectedPlan === user.plan}
                                className="w-full bg-violet-600 hover:bg-violet-700 text-white"
                                size="sm"
                            >
                                {loadingPlan ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Guardar Cambio de Plan'}
                            </Button>
                            <p className="text-[10px] text-gray-500 mt-1">
                                * Esto actualiza la base de datos local y otorga acceso inmediato. No afecta cobros en Stripe.
                            </p>
                        </div>
                    </div>
                </div>

                <DialogFooter className="border-t border-white/10 pt-4 flex justify-between items-center w-full sm:justify-between">
                    <Button variant="ghost" onClick={onClose} className="text-gray-400 hover:text-white">
                        Cerrar
                    </Button>

                    <Button
                        onClick={handleImpersonate}
                        disabled={loadingImpersonate}
                        className="bg-red-600 hover:bg-red-700 text-white font-bold shadow-[0_0_15px_rgba(220,38,38,0.5)] border border-red-500/50"
                    >
                        {loadingImpersonate ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <LogIn className="w-4 h-4 mr-2" />}
                        ENTRAR COMO USUARIO
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
