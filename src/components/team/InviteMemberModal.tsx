'use client'

import { useState } from 'react'
import { inviteMember } from '@/actions/team'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2, Mail, Shield, ArrowLeft, CheckCircle2, XCircle } from 'lucide-react'
import { getRoleSummary, TeamRoleType } from '@/lib/rbac'

interface InviteMemberModalProps {
    isOpen: boolean
    onOpenChange: (open: boolean) => void
    branchId?: string
    branchSlug?: string
    staffOnly?: boolean
}

export default function InviteMemberModal({ isOpen, onOpenChange, branchId, branchSlug, staffOnly }: InviteMemberModalProps) {
    const [loading, setLoading] = useState(false)
    const [step, setStep] = useState<1 | 2>(1)

    // Form State
    const [email, setEmail] = useState('')
    const [role, setRole] = useState<TeamRoleType>(staffOnly ? "OPERATOR" : "OBSERVER")

    // Handle initial form click (Move to step 2)
    function handleGoToStep2(e: React.FormEvent) {
        e.preventDefault()
        if (!email) return toast.error('Ingresa un correo electrónico')
        setStep(2)
    }

    // Final confirmation action
    async function handleInviteConfirmation() {
        setLoading(true)
        try {
            const formData = new FormData()
            formData.append('email', email)
            formData.append('role', role)
            if (branchId) formData.append('branchId', branchId)
            if (branchSlug) formData.append('branchSlug', branchSlug)

            const result = await inviteMember(formData)
            if (result?.success) {
                toast.success('Invitación enviada correctamente')

                // Reset state
                setEmail('')
                setRole(staffOnly ? "OPERATOR" : "OBSERVER")
                setStep(1)

                onOpenChange(false)
            } else if (result?.error) {
                toast.error(result.error)
            }
        } catch (error: any) {
            toast.error(error.message || 'Error al enviar invitación')
        } finally {
            setLoading(false)
        }
    }

    // Handle closing the dialog and resetting state
    const handleClose = (open: boolean) => {
        if (!open) {
            setStep(1)
            setEmail('')
            setRole(staffOnly ? "OPERATOR" : "OBSERVER")
        }
        onOpenChange(open)
    }

    const roleSummary = getRoleSummary(role)

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="bg-[#050505]/95 border border-white/10 text-white max-w-md p-0 overflow-hidden backdrop-blur-xl shadow-2xl">
                {/* Decorative Background */}
                <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-violet-600/10 blur-[100px] rounded-full pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-[200px] h-[200px] bg-blue-600/10 blur-[80px] rounded-full pointer-events-none" />

                <div className="relative p-6">
                    {/* STEP 1: SELECT BASIC INFO */}
                    {step === 1 && (
                        <>
                            <DialogHeader className="mb-6 space-y-2 text-center sm:text-left">
                                <div className="mx-auto sm:mx-0 w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center mb-4 border border-white/10 shadow-inner">
                                    <Mail className="w-6 h-6 text-violet-400" />
                                </div>
                                <DialogTitle className="text-xl sm:text-2xl font-bold bg-gradient-to-br from-white to-gray-400 bg-clip-text text-transparent">
                                    {staffOnly ? 'Agregar Personal Operativo' : 'Invitar al Equipo'}
                                </DialogTitle>
                                <p className="text-sm text-gray-500 max-w-xs mx-auto sm:mx-0">
                                    {staffOnly ? 'Añade operadores o hostess a esta sucursal.' : 'Envía una invitación para que se unan a esta sucursal.'}
                                </p>
                            </DialogHeader>

                            <form onSubmit={handleGoToStep2} className="space-y-5">
                                <div className="space-y-2">
                                    <Label className="text-xs font-medium text-gray-400 uppercase tracking-wider ml-1">Email del colaborador</Label>
                                    <div className="relative group">
                                        <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                                            <Mail className="h-4 w-4 text-gray-500 group-focus-within:text-violet-400 transition-colors" />
                                        </div>
                                        <Input
                                            name="email"
                                            type="email"
                                            placeholder="ejemplo@empresa.com"
                                            required
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            className="pl-10 bg-[#0a0a0a] border-white/10 text-white placeholder:text-gray-600 focus:border-violet-500/50 focus:bg-[#0a0a0a] transition-all h-12 rounded-xl shadow-inner"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-xs font-medium text-gray-400 uppercase tracking-wider ml-1">Rol Asignado</Label>
                                    <Select value={role} onValueChange={(v) => setRole(v as TeamRoleType)}>
                                        <SelectTrigger className="h-12 bg-[#0a0a0a] border-white/10 text-white focus:border-violet-500/50 rounded-xl px-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-6 h-6 rounded-md bg-violet-500/20 flex items-center justify-center">
                                                    <Shield className="w-3.5 h-3.5 text-violet-400" />
                                                </div>
                                                <SelectValue />
                                            </div>
                                        </SelectTrigger>
                                        <SelectContent className="bg-[#18181b] border-white/10 text-white rounded-xl p-1 shadow-2xl">
                                            {!staffOnly && (
                                                <>
                                                    <SelectItem value="ADMIN" className="focus:bg-white/10 focus:text-white rounded-lg my-0.5 cursor-pointer">
                                                        <div className="flex flex-col py-1">
                                                            <span className="font-medium text-white text-sm">Administrador</span>
                                                            <span className="text-[10px] text-gray-500">Acceso Total (Pagos, Reservas, Equipo)</span>
                                                        </div>
                                                    </SelectItem>
                                                    <SelectItem value="EDITOR" className="focus:bg-white/10 focus:text-white rounded-lg my-0.5 cursor-pointer">
                                                        <div className="flex flex-col py-1">
                                                            <span className="font-medium text-white text-sm">Editor / Operador Web</span>
                                                            <span className="text-[10px] text-gray-500">Día a día. Operaciones sin configuraciones maestras.</span>
                                                        </div>
                                                    </SelectItem>
                                                    <SelectItem value="SUPERVISOR" className="focus:bg-white/10 focus:text-white rounded-lg my-0.5 cursor-pointer">
                                                        <div className="flex flex-col py-1">
                                                            <span className="font-medium text-white text-sm">Supervisor</span>
                                                            <span className="text-[10px] text-gray-500">Supervisión, Tareas, Evidencias, Auditoría.</span>
                                                        </div>
                                                    </SelectItem>
                                                    <SelectItem value="OBSERVER" className="focus:bg-white/10 focus:text-white rounded-lg my-0.5 cursor-pointer">
                                                        <div className="flex flex-col py-1">
                                                            <span className="font-medium text-white text-sm">Observador</span>
                                                            <span className="text-[10px] text-gray-500">Lectura 100%. Analítica, reportes, vistas (sin editar nada).</span>
                                                        </div>
                                                    </SelectItem>
                                                </>
                                            )}
                                            <SelectItem value="OPERATOR" className="focus:bg-white/10 focus:text-white rounded-lg my-0.5 cursor-pointer">
                                                <div className="flex flex-col py-1">
                                                    <span className="font-medium text-white text-sm">Staff (Mesero/Asistente)</span>
                                                    <span className="text-[10px] text-gray-500">Limitado a la App Móvil para tareas y reportes rápidos.</span>
                                                </div>
                                            </SelectItem>
                                            <SelectItem value="HOSTESS" className="focus:bg-white/10 focus:text-white rounded-lg my-0.5 cursor-pointer">
                                                <div className="flex flex-col py-1">
                                                    <span className="font-medium text-white text-sm">Hostess (Recepción)</span>
                                                    <span className="text-[10px] text-gray-500">Limitado a la App Móvil para check-ins y mesas.</span>
                                                </div>
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <Button
                                    type="submit"
                                    className="w-full h-12 mt-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold rounded-xl shadow-lg shadow-violet-600/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
                                >
                                    Continuar y Validar Permisos
                                </Button>
                            </form>
                        </>
                    )}

                    {/* STEP 2: CONFIRMATION (RBAC POPUP) */}
                    {step === 2 && (
                        <div className="animate-in slide-in-from-right-4 fade-in duration-300">
                            <button
                                onClick={() => setStep(1)}
                                className="absolute top-6 left-6 text-gray-400 hover:text-white transition-colors"
                            >
                                <ArrowLeft className="w-5 h-5" />
                            </button>

                            <DialogHeader className="mb-6 space-y-2 mt-8">
                                <DialogTitle className="text-xl sm:text-2xl font-bold text-center">
                                    Resumen de Permisos
                                </DialogTitle>
                                <p className="text-sm text-gray-400 mx-auto text-center">
                                    Estás invitando a <strong className="text-white">{email}</strong> como <span className="text-violet-400 font-semibold">{roleSummary.name}</span>. Por favor revisa sus accesos.
                                </p>
                            </DialogHeader>

                            <div className="space-y-4 mb-8">
                                <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4">
                                    <h4 className="text-green-400 font-medium text-sm mb-3 flex items-center gap-2">
                                        <CheckCircle2 className="w-4 h-4" /> Este usuario SÍ podrá:
                                    </h4>
                                    <ul className="space-y-2">
                                        {roleSummary.allowed.length > 0 ? roleSummary.allowed.map((item, idx) => (
                                            <li key={idx} className="text-sm text-gray-300 flex items-start gap-2">
                                                <span className="text-green-500/50 mt-1">•</span> {item}
                                            </li>
                                        )) : (
                                            <li className="text-sm text-gray-500 text-center py-2">Ningún permiso especial</li>
                                        )}
                                    </ul>
                                </div>

                                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
                                    <h4 className="text-red-400 font-medium text-sm mb-3 flex items-center gap-2">
                                        <XCircle className="w-4 h-4" /> Este usuario NO tendrá acceso a:
                                    </h4>
                                    <ul className="space-y-2">
                                        {roleSummary.denied.length > 0 ? roleSummary.denied.map((item, idx) => (
                                            <li key={idx} className="text-sm text-gray-300 flex items-start gap-2">
                                                <span className="text-red-500/50 mt-1">•</span> {item}
                                            </li>
                                        )) : (
                                            <li className="text-sm text-gray-500 text-center py-2">Ninguna restricción aplicable (Control Total)</li>
                                        )}
                                    </ul>
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <Button
                                    variant="outline"
                                    onClick={() => setStep(1)}
                                    className="w-full h-12 border-white/10 text-white hover:bg-white/5 rounded-xl"
                                >
                                    Cancelar
                                </Button>
                                <Button
                                    onClick={handleInviteConfirmation}
                                    disabled={loading}
                                    className="w-full h-12 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold rounded-xl shadow-lg shadow-violet-600/20"
                                >
                                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Confirmar y Enviar'}
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    )
}

