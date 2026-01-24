'use client'

import { useState } from 'react'
import { approveRepresentative, rejectRepresentative } from '@/actions/admin-representatives'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Check, X, MapPin, Phone, Linkedin, Eye } from 'lucide-react'

export default function RepresentativesTable({ representatives }: { representatives: any[] }) {
    const [loading, setLoading] = useState<string | null>(null)
    const [selectedRep, setSelectedRep] = useState<any>(null)
    const [commission, setCommission] = useState(15)

    async function handleApprove() {
        if (!selectedRep) return
        setLoading(selectedRep.id)
        try {
            await approveRepresentative(selectedRep.id, commission)
            toast.success('Embajador aprobado')
            setSelectedRep(null)
        } catch (e) {
            toast.error('Error al aprobar')
        } finally {
            setLoading(null)
        }
    }

    async function handleReject(id: string) {
        if (!confirm('¿Rechazar solicitud?')) return
        setLoading(id)
        try {
            await rejectRepresentative(id)
            toast.success('Solicitud rechazada')
        } catch (e) {
            toast.error('Error')
        } finally {
            setLoading(null)
        }
    }

    return (
        <div className="bg-[#111] border border-white/5 rounded-2xl overflow-hidden">
            <table className="w-full text-left">
                <thead className="bg-white/5 text-gray-400 text-xs uppercase">
                    <tr>
                        <th className="p-4">Embajador</th>
                        <th className="p-4">Territorio</th>
                        <th className="p-4">Info</th>
                        <th className="p-4">Experiencia</th>
                        <th className="p-4">Estado</th>
                        <th className="p-4 text-right">Acciones</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                    {representatives.map((rep) => (
                        <tr key={rep.id} className="hover:bg-white/5 transition">
                            <td className="p-4">
                                <p className="font-bold text-white">{rep.user?.businessName || 'Usuario'}</p>
                                <p className="text-xs text-gray-500">{rep.email || rep.user?.email || 'No email'}</p>
                            </td>
                            <td className="p-4">
                                <div className="flex items-center gap-2">
                                    <MapPin className="w-4 h-4 text-blue-500" />
                                    <span className="text-blue-200">{rep.state}</span>
                                </div>
                            </td>
                            <td className="p-4 space-y-1">
                                {rep.phone && (
                                    <div className="flex items-center gap-2 text-xs text-gray-400">
                                        <Phone className="w-3 h-3" /> {rep.phone}
                                    </div>
                                )}
                                {rep.socialLink && (
                                    <a href={rep.socialLink} target="_blank" className="flex items-center gap-2 text-xs text-blue-400 hover:underline">
                                        <Linkedin className="w-3 h-3" /> Ver Perfil
                                    </a>
                                )}
                            </td>
                            <td className="p-4">
                                <Dialog>
                                    <DialogTrigger asChild>
                                        <Button variant="ghost" size="sm" className="text-xs text-gray-400">
                                            <Eye className="w-3 h-3 mr-1" /> Leer Bio
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent className="bg-[#111] border-white/10 text-white">
                                        <DialogHeader>
                                            <DialogTitle>Experiencia de {rep.user?.businessName}</DialogTitle>
                                        </DialogHeader>
                                        <p className="text-gray-300 leading-relaxed whitespace-pre-wrap">{rep.experience}</p>
                                    </DialogContent>
                                </Dialog>
                            </td>
                            <td className="p-4">
                                <Badge className={
                                    rep.status === 'APPROVED' ? 'bg-green-500/10 text-green-500' :
                                        rep.status === 'REJECTED' ? 'bg-red-500/10 text-red-500' :
                                            'bg-yellow-500/10 text-yellow-500'
                                }>
                                    {rep.status}
                                </Badge>
                                {rep.status === 'APPROVED' && (
                                    <p className="text-xs text-gray-500 mt-1">{rep.commissionRate}% Com.</p>
                                )}
                            </td>
                            <td className="p-4 text-right">
                                {rep.status === 'PENDING' && (
                                    <div className="flex justify-end gap-2">
                                        <Button
                                            size="sm"
                                            className="bg-red-500/10 text-red-500 hover:bg-red-500/20"
                                            onClick={() => handleReject(rep.id)}
                                            disabled={!!loading}
                                        >
                                            <X className="w-4 h-4" />
                                        </Button>

                                        <Dialog>
                                            <DialogTrigger asChild>
                                                <Button
                                                    size="sm"
                                                    className="bg-green-500 text-white hover:bg-green-600"
                                                    onClick={() => { setSelectedRep(rep); setCommission(15); }}
                                                >
                                                    <Check className="w-4 h-4 mr-1" /> Aprobar
                                                </Button>
                                            </DialogTrigger>
                                            <DialogContent className="bg-[#111] border-white/10 text-white">
                                                <DialogHeader>
                                                    <DialogTitle>Aprobar Embajador</DialogTitle>
                                                </DialogHeader>
                                                <div className="py-4">
                                                    <label className="text-sm text-gray-400 mb-2 block">Asignar Comisión (%)</label>
                                                    <Input
                                                        type="number"
                                                        value={commission}
                                                        onChange={(e) => setCommission(Number(e.target.value))}
                                                        className="bg-black/50 border-white/10"
                                                    />
                                                    <p className="text-xs text-gray-500 mt-2">Por defecto: 15%</p>
                                                </div>
                                                <Button
                                                    className="w-full bg-green-600 hover:bg-green-700"
                                                    onClick={handleApprove}
                                                    disabled={loading === rep.id}
                                                >
                                                    {loading === rep.id ? 'Aprobando...' : 'Confirmar y Activar'}
                                                </Button>
                                            </DialogContent>
                                        </Dialog>
                                    </div>
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    )
}
