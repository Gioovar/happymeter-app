'use client'

import { useState } from 'react'
import { inviteMember } from '@/actions/team'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2, Mail, Shield } from 'lucide-react'

interface InviteMemberModalProps {
    isOpen: boolean
    onOpenChange: (open: boolean) => void
    branchId?: string
    branchSlug?: string
}

export default function InviteMemberModal({ isOpen, onOpenChange, branchId, branchSlug }: InviteMemberModalProps) {
    const [loading, setLoading] = useState(false)

    async function handleInvite(formData: FormData) {
        setLoading(true)
        try {
            if (branchId) formData.append('branchId', branchId)
            if (branchSlug) formData.append('branchSlug', branchSlug)

            const result = await inviteMember(formData)
            if (result?.success) {
                toast.success(result.message || 'Invitación enviada correctamente')
                onOpenChange(false)
            }
        } catch (error: any) {
            toast.error(error.message || 'Error al enviar invitación')
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="bg-[#050505]/95 border border-white/10 text-white max-w-md p-0 overflow-hidden backdrop-blur-xl shadow-2xl">
                {/* Decorative Background */}
                <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-violet-600/10 blur-[100px] rounded-full pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-[200px] h-[200px] bg-blue-600/10 blur-[80px] rounded-full pointer-events-none" />

                <div className="relative p-6">
                    <DialogHeader className="mb-6 space-y-2 text-center sm:text-left">
                        <div className="mx-auto sm:mx-0 w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center mb-4 border border-white/10 shadow-inner">
                            <Mail className="w-6 h-6 text-violet-400" />
                        </div>
                        <DialogTitle className="text-xl sm:text-2xl font-bold bg-gradient-to-br from-white to-gray-400 bg-clip-text text-transparent">
                            Invitar al Equipo
                        </DialogTitle>
                        <p className="text-sm text-gray-500 max-w-xs mx-auto sm:mx-0">
                            Envía una invitación por correo electrónico para que se unan a esta sucursal.
                        </p>
                    </DialogHeader>

                    <form action={handleInvite} className="space-y-5">
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
                                    className="pl-10 bg-[#0a0a0a] border-white/10 text-white placeholder:text-gray-600 focus:border-violet-500/50 focus:bg-[#0a0a0a] transition-all h-12 rounded-xl shadow-inner"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-xs font-medium text-gray-400 uppercase tracking-wider ml-1">Rol Asignado</Label>
                            <Select name="role" defaultValue="OBSERVER">
                                <SelectTrigger className="h-12 bg-[#0a0a0a] border-white/10 text-white focus:border-violet-500/50 rounded-xl px-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-6 h-6 rounded-md bg-violet-500/20 flex items-center justify-center">
                                            <Shield className="w-3.5 h-3.5 text-violet-400" />
                                        </div>
                                        <SelectValue />
                                    </div>
                                </SelectTrigger>
                                <SelectContent className="bg-[#18181b] border-white/10 text-white rounded-xl p-1 shadow-2xl">
                                    <SelectItem value="ADMIN" className="focus:bg-white/10 focus:text-white rounded-lg my-0.5 cursor-pointer">
                                        <div className="flex flex-col py-1">
                                            <span className="font-medium text-white text-sm">Administrador</span>
                                            <span className="text-[10px] text-gray-500">Gestión total de usuarios y ajustes</span>
                                        </div>
                                    </SelectItem>
                                    <SelectItem value="EDITOR" className="focus:bg-white/10 focus:text-white rounded-lg my-0.5 cursor-pointer">
                                        <div className="flex flex-col py-1">
                                            <span className="font-medium text-white text-sm">Editor</span>
                                            <span className="text-[10px] text-gray-500">Crear encuestas y campañas</span>
                                        </div>
                                    </SelectItem>
                                    <SelectItem value="OBSERVER" className="focus:bg-white/10 focus:text-white rounded-lg my-0.5 cursor-pointer">
                                        <div className="flex flex-col py-1">
                                            <span className="font-medium text-white text-sm">Observador</span>
                                            <span className="text-[10px] text-gray-500">Solo visualización de reportes</span>
                                        </div>
                                    </SelectItem>
                                    <SelectItem value="OPERATOR" className="focus:bg-white/10 focus:text-white rounded-lg my-0.5 cursor-pointer">
                                        <div className="flex flex-col py-1">
                                            <span className="font-medium text-white text-sm">Operador (Staff)</span>
                                            <span className="text-[10px] text-gray-500">App móvil, tareas y evidencias</span>
                                        </div>
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <Button
                            type="submit"
                            disabled={loading}
                            className="w-full h-12 mt-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold rounded-xl shadow-lg shadow-violet-600/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
                        >
                            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Enviar Invitación'}
                        </Button>
                    </form>
                </div>
            </DialogContent>
        </Dialog>
    )
}
