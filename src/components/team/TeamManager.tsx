'use client'

import { useState } from 'react'
import { inviteMember, removeMember, cancelInvitation } from '@/actions/team'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Trash2, Mail, Loader2, UserPlus, Shield } from 'lucide-react'

export default function TeamManager({ initialData }: { initialData: any }) {
    const [loading, setLoading] = useState(false)
    const [open, setOpen] = useState(false)

    async function handleInvite(formData: FormData) {
        setLoading(true)
        try {
            await inviteMember(formData)
            toast.success('Invitación enviada')
            setOpen(false)
        } catch (error: any) {
            toast.error(error.message)
        } finally {
            setLoading(false)
        }
    }

    async function handleRemove(id: string) {
        if (!confirm('¿Eliminar miembro?')) return
        try {
            await removeMember(id)
            toast.success('Miembro eliminado')
        } catch (e) {
            toast.error('Error')
        }
    }

    async function handleCancel(id: string) {
        if (!confirm('¿Cancelar invitación?')) return
        try {
            await cancelInvitation(id)
            toast.success('Invitación cancelada')
        } catch (e) {
            toast.error('Error')
        }
    }

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-white">Miembros del Equipo</h2>
                <Dialog open={open} onOpenChange={setOpen}>
                    <DialogTrigger asChild>
                        <Button className="bg-violet-600 hover:bg-violet-700 text-white">
                            <UserPlus className="w-4 h-4 mr-2" /> Invitar Miembro
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-[#111] border-white/10 text-white">
                        <DialogHeader>
                            <DialogTitle>Invitar al Equipo</DialogTitle>
                        </DialogHeader>
                        <form action={handleInvite} className="space-y-4 pt-4">
                            <div className="space-y-2">
                                <Label>Email</Label>
                                <Input name="email" type="email" placeholder="colaborador@correo.com" required className="bg-black/50" />
                            </div>
                            <div className="space-y-2">
                                <Label>Rol</Label>
                                <Select name="role" defaultValue="OBSERVER">
                                    <SelectTrigger className="bg-black/50 border-white/10">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="bg-[#111] border-white/10 text-white">
                                        <SelectItem value="ADMIN">Admin (Control Total)</SelectItem>
                                        <SelectItem value="EDITOR">Editor (Puede editar encuestas)</SelectItem>
                                        <SelectItem value="OBSERVER">Observador (Solo lectura)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <Button type="submit" disabled={loading} className="w-full bg-violet-600 hover:bg-violet-700">
                                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Enviar Invitación'}
                            </Button>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="bg-[#111] border border-white/5 rounded-xl overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-white/5 text-gray-400 text-xs uppercase">
                        <tr>
                            <th className="p-4">Usuario</th>
                            <th className="p-4">Rol</th>
                            <th className="p-4">Estado</th>
                            <th className="p-4 text-right">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {/* Active Members */}
                        {initialData.members.map((member: any) => (
                            <tr key={member.id}>
                                <td className="p-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-violet-500/20 flex items-center justify-center text-violet-400 font-bold">
                                            {member.user.businessName?.[0] || 'U'}
                                        </div>
                                        <div>
                                            <p className="font-medium text-white">{member.user.businessName || 'Usuario'}</p>
                                            {/* We rely on businessName usually, but email isn't directly on UserSettings unless we synced it? 
                                                Ah, UserSettings doesn't have email. We might only show businessName. 
                                                If we need email, we need to fetch from Clerk or store it. 
                                                For now we might just act on ID/Names.
                                            */}
                                        </div>
                                    </div>
                                </td>
                                <td className="p-4">
                                    <Badge variant="outline" className="text-gray-300 border-gray-700">
                                        <Shield className="w-3 h-3 mr-1" /> {member.role}
                                    </Badge>
                                </td>
                                <td className="p-4">
                                    <Badge className="bg-green-500/10 text-green-500 hover:bg-green-500/20">Activo</Badge>
                                </td>
                                <td className="p-4 text-right">
                                    {(initialData.isOwner || (initialData.currentUserRole === 'ADMIN' && member.role !== 'ADMIN')) && (
                                        <Button variant="ghost" size="icon" onClick={() => handleRemove(member.id)} className="text-red-400 hover:bg-red-500/10">
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    )}
                                </td>
                            </tr>
                        ))}

                        {/* Pending Invitations */}
                        {initialData.invitations.map((invite: any) => (
                            <tr key={invite.id} className="bg-white/[0.02]">
                                <td className="p-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-gray-500/20 flex items-center justify-center text-gray-400">
                                            <Mail className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <p className="font-medium text-gray-300">{invite.email}</p>
                                            <p className="text-xs text-gray-500">Invitación enviada</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="p-4">
                                    <Badge variant="outline" className="text-gray-400 border-gray-800">
                                        {invite.role}
                                    </Badge>
                                </td>
                                <td className="p-4">
                                    <Badge className="bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20">Pendiente</Badge>
                                </td>
                                <td className="p-4 text-right">
                                    <Button variant="ghost" size="icon" onClick={() => handleCancel(invite.id)} className="text-gray-500 hover:text-white">
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </td>
                            </tr>
                        ))}

                        {initialData.members.length === 0 && initialData.invitations.length === 0 && (
                            <tr>
                                <td colSpan={4} className="p-8 text-center text-gray-500">
                                    No tienes miembros en tu equipo aún.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
