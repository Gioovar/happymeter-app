'use client'

import { useState } from 'react'
import { inviteMember } from '@/actions/team'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2 } from 'lucide-react'

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
            if (branchId) {
                formData.append('branchId', branchId)
            }
            if (branchSlug) {
                formData.append('branchSlug', branchSlug)
            }
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
            <DialogContent className="bg-[#111] border-white/10 text-white max-w-md">
                <DialogHeader>
                    <DialogTitle className="text-xl font-bold">Invitar al Equipo</DialogTitle>
                </DialogHeader>
                <form action={handleInvite} className="space-y-4 pt-4">
                    <div className="space-y-2">
                        <Label>Email</Label>
                        <Input
                            name="email"
                            type="email"
                            placeholder="colaborador@correo.com"
                            required
                            className="bg-black/50 border-white/10 text-white focus:border-violet-500"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Rol</Label>
                        <Select name="role" defaultValue="OBSERVER">
                            <SelectTrigger className="bg-black/50 border-white/10 text-white">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-[#111] border-white/10 text-white">
                                <SelectItem value="ADMIN">Admin (Control Total)</SelectItem>
                                <SelectItem value="EDITOR">Editor (Puede editar encuestas)</SelectItem>
                                <SelectItem value="OBSERVER">Observador (Solo lectura)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <Button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-violet-600 hover:bg-violet-700 text-white font-bold h-11"
                    >
                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Enviar Invitación'}
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    )
}
