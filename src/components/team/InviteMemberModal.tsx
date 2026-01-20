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
                    <DialogHeader className="mb-6">
                        <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                            Invitar al Equipo
                        </DialogTitle>
                        <p className="text-sm text-gray-500">
                            Envía una invitación para colaborar en esta sucursal.
                        </p>
                    </DialogHeader>

                    <form action={handleInvite} className="space-y-5">
                        <div className="space-y-2">
                            <Label className="text-xs font-medium text-gray-400 uppercase tracking-wider">Email del colaborador</Label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                                    <Mail className="h-4 w-4 text-gray-500 group-focus-within:text-violet-400 transition-colors" />
                                </div>
                                <Input
                                    name="email"
                                    type="email"
                                    placeholder="ejemplo@empresa.com"
                                    required
                                    className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-gray-600 focus:border-violet-500/50 focus:bg-white/10 transition-all h-11 rounded-xl"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-xs font-medium text-gray-400 uppercase tracking-wider">Rol Asignado</Label>
                            <Select name="role" defaultValue="OBSERVER">
                                <SelectTrigger className="h-11 bg-white/5 border-white/10 text-white focus:border-violet-500/50 rounded-xl">
                                    <div className="flex items-center gap-2">
                                        <Shield className="w-4 h-4 text-violet-400" />
                                        <SelectValue />
                                    </div>
                                </SelectTrigger>
                                <SelectContent className="bg-[#111] border-white/10 text-white rounded-xl">
                                    <SelectItem value="ADMIN" className="focus:bg-white/10 focus:text-white">
                                        <div className="flex flex-col py-1">
                                            <span className="font-medium text-white">Admin</span>
                                            <span className="text-xs text-gray-500">Control total y gestión de usuarios</span>
                                        </div>
                                    </SelectItem>
                                    <SelectItem value="EDITOR" className="focus:bg-white/10 focus:text-white">
                                        <div className="flex flex-col py-1">
                                            <span className="font-medium text-white">Editor</span>
                                            <span className="text-xs text-gray-500">Puede crear y editar encuestas</span>
                                        </div>
                                    </SelectItem>
                                    <SelectItem value="OBSERVER" className="focus:bg-white/10 focus:text-white">
                                        <div className="flex flex-col py-1">
                                            <span className="font-medium text-white">Observador</span>
                                            <span className="text-xs text-gray-500">Solo lectura de métricas</span>
                                        </div>
                                    </SelectItem>
                                    <SelectItem value="OPERATOR" className="focus:bg-white/10 focus:text-white">
                                        <div className="flex flex-col py-1">
                                            <span className="font-medium text-white">Operador</span>
                                            <span className="text-xs text-gray-500">Acceso limitado a operaciones diarias</span>
                                        </div>
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <Button
                            type="submit"
                            disabled={loading}
                            className="w-full h-12 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold rounded-xl shadow-lg shadow-violet-600/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
                        >
                            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Enviar Invitación'}
                        </Button>
                    </form>
                </div>
            </DialogContent>
        </Dialog>
    )
}
