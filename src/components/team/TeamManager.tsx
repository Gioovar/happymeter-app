'use client'

import { useState } from 'react'
import { inviteMember, removeMember, cancelInvitation, resendInvitation } from '@/actions/team'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Trash2, Mail, UserPlus, Shield, RefreshCcw, Loader2 } from 'lucide-react'
import InviteMemberModal from './InviteMemberModal'
import DeleteConfirmationDialog from './DeleteConfirmationDialog'

export default function TeamManager({ initialData, branchId }: { initialData: any, branchId?: string }) {
    const [loading, setLoading] = useState(false)
    const [open, setOpen] = useState(false)
    const [loadingIds, setLoadingIds] = useState<string[]>([])
    const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean, id: string, type: 'member' | 'invite' }>({
        isOpen: false,
        id: '',
        type: 'member'
    })

    async function handleInvite(formData: FormData) {
        setLoading(true)
        try {
            if (branchId) {
                formData.append('branchId', branchId)
            }
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
        setLoadingIds(prev => [...prev, id])
        try {
            await removeMember(id)
            toast.success('Miembro eliminado')
        } catch (e) {
            toast.error('Error al eliminar miembro')
        } finally {
            setLoadingIds(prev => prev.filter(item => item !== id))
            setDeleteModal({ isOpen: false, id: '', type: 'member' })
        }
    }

    async function handleCancel(id: string) {
        setLoadingIds(prev => [...prev, id])
        try {
            await cancelInvitation(id)
            toast.success('Invitación eliminada')
        } catch (e) {
            toast.error('Error al eliminar invitación')
        } finally {
            setLoadingIds(prev => prev.filter(item => item !== id))
            setDeleteModal({ isOpen: false, id: '', type: 'invite' })
        }
    }

    async function handleResend(id: string) {
        setLoadingIds(prev => [...prev, id])
        try {
            await resendInvitation(id)
            toast.success('Invitación reenviada correctamente')
        } catch (e) {
            toast.error('Error al reenviar invitación')
        } finally {
            setLoadingIds(prev => prev.filter(item => item !== id))
        }
    }

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-white">Miembros del Equipo</h2>
                <Button
                    onClick={() => setOpen(true)}
                    className="bg-violet-600 hover:bg-violet-700 text-white shadow-lg shadow-violet-600/20"
                >
                    <UserPlus className="w-4 h-4 mr-2" /> Invitar Miembro
                </Button>
                <InviteMemberModal
                    isOpen={open}
                    onOpenChange={setOpen}
                    branchId={branchId}
                />
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
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            disabled={loadingIds.includes(member.id)}
                                            onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                setDeleteModal({ isOpen: true, id: member.id, type: 'member' });
                                            }}
                                            className="text-red-400 hover:bg-red-500/10"
                                        >
                                            {loadingIds.includes(member.id) ? (
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                            ) : (
                                                <Trash2 className="w-4 h-4" />
                                            )}
                                        </Button>
                                    )}
                                </td>
                            </tr>
                        ))}

                        {/* Pending Invitations */}
                        {initialData.invitations.map((invite: any) => {
                            const isLoading = loadingIds.includes(invite.id);
                            return (
                                <tr key={invite.id} className="bg-white/[0.02]">
                                    <td className="p-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-gray-500/20 flex items-center justify-center text-gray-400">
                                                <Mail className="w-4 h-4" />
                                            </div>
                                            <div>
                                                <p className="font-medium text-gray-300">{invite.email}</p>
                                                <p className="text-xs text-gray-500 italic">Invitación enviada</p>
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
                                        <div className="flex items-center justify-end gap-1">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                disabled={isLoading}
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                    handleResend(invite.id);
                                                }}
                                                className="text-gray-500 hover:text-violet-400"
                                                title="Reenviar invitación"
                                            >
                                                {isLoading ? (
                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                ) : (
                                                    <RefreshCcw className="w-4 h-4" />
                                                )}
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                disabled={isLoading}
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                    setDeleteModal({ isOpen: true, id: invite.id, type: 'invite' });
                                                }}
                                                className="text-gray-500 hover:text-red-400"
                                                title="Eliminar invitación"
                                            >
                                                {isLoading ? (
                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                ) : (
                                                    <Trash2 className="w-4 h-4" />
                                                )}
                                            </Button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}

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

            <DeleteConfirmationDialog
                isOpen={deleteModal.isOpen}
                onOpenChange={(open) => setDeleteModal(prev => ({ ...prev, isOpen: open }))}
                onConfirm={() => {
                    if (deleteModal.type === 'member') {
                        handleRemove(deleteModal.id)
                    } else {
                        handleCancel(deleteModal.id)
                    }
                }}
                isLoading={loadingIds.includes(deleteModal.id)}
                title={deleteModal.type === 'member' ? '¿Eliminar miembro?' : '¿Eliminar invitación?'}
                description={deleteModal.type === 'member'
                    ? 'Esta acción desactivará el acceso de este empleado permanentemente de esta sucursal.'
                    : 'Esta invitación será borrada y el código de acceso dejará de funcionar.'}
            />
        </div>
    )
}
