'use client'

import { useState } from 'react'
import { inviteMember, removeMember, cancelInvitation, resendInvitation } from '@/actions/team'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
    Trash2,
    Mail,
    UserPlus,
    Shield,
    CheckCircle2,
    ChevronRight,
    Zap,
    Users,
    RefreshCcw,
    Loader2
} from 'lucide-react'
import InviteMemberModal from './InviteMemberModal'
import StaffDetailModal from './StaffDetailModal'
import { cn } from '@/lib/utils'

interface ProcessTeamManagerProps {
    initialData: any
    branchId: string
    performanceStats: any[]
}

export default function ProcessTeamManager({ initialData, branchId, performanceStats }: ProcessTeamManagerProps) {
    const [isInviteOpen, setIsInviteOpen] = useState(false)
    const [selectedStaff, setSelectedStaff] = useState<any>(null)
    const [loadingIds, setLoadingIds] = useState<string[]>([])

    const handleRemove = async (id: string) => {
        const ok = window.confirm('¿Eliminar este miembro permanentemente?')
        if (!ok) return

        setLoadingIds(prev => [...prev, id])
        try {
            await removeMember(id)
            toast.success('Miembro eliminado')
        } catch (e) {
            toast.error('Error al eliminar miembro')
        } finally {
            setLoadingIds(prev => prev.filter(item => item !== id))
        }
    }

    const handleCancel = async (id: string) => {
        // Use a small delay or ensure we are outside of any conflicting re-renders
        const ok = window.confirm('¿Eliminar esta invitación permanentemente?')
        if (!ok) return

        setLoadingIds(prev => [...prev, id])
        try {
            await cancelInvitation(id)
            toast.success('Invitación eliminada')
        } catch (e) {
            toast.error('Error al eliminar invitación')
        } finally {
            setLoadingIds(prev => prev.filter(item => item !== id))
        }
    }

    const handleResend = async (id: string) => {
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
        <div className="space-y-6">
            <div className="flex justify-between items-center bg-[#0f1115] p-6 rounded-2xl border border-white/5 shadow-xl">
                <div className="flex items-center gap-5">
                    <div className="w-12 h-12 rounded-2xl bg-violet-600/10 flex items-center justify-center">
                        <Zap className="w-6 h-6 text-violet-500" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-white tracking-tight">Desempeño de Personal</h2>
                        <p className="text-xs text-gray-400 font-medium">Monitoreo de tareas y cumplimiento operativo diario</p>
                    </div>
                </div>
                <Button
                    onClick={() => setIsInviteOpen(true)}
                    className="bg-violet-600 hover:bg-violet-700 text-white shadow-xl shadow-violet-600/20 rounded-2xl px-6 h-12 font-bold transition-all"
                >
                    <UserPlus className="w-4 h-4 mr-2" /> Invitar Personal
                </Button>
            </div>

            <div className="bg-[#0f1115] border border-white/5 rounded-3xl overflow-hidden shadow-2xl">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-[#151820]/80 backdrop-blur-md text-gray-500 text-[10px] uppercase font-bold tracking-[0.2em] border-b border-white/5">
                            <tr>
                                <th className="p-6">Colaborador</th>
                                <th className="p-6">Puesto</th>
                                <th className="p-6">Desempeño Hoy (6AM - 5AM)</th>
                                <th className="p-6 text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {performanceStats.map((staff: any) => (
                                <tr
                                    key={staff.staffId}
                                    onClick={() => setSelectedStaff(staff)}
                                    className="group hover:bg-white/[0.02] transition-all cursor-pointer"
                                >
                                    <td className="p-6">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center text-white font-bold shadow-lg overflow-hidden shrink-0 transition-transform group-hover:scale-105">
                                                {staff.photo ? (
                                                    <img src={staff.photo} alt={staff.name} className="w-full h-full object-cover" />
                                                ) : (
                                                    <span className="text-lg">{staff.name[0]}</span>
                                                )}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="font-bold text-white group-hover:text-violet-400 transition-colors truncate">{staff.name}</p>
                                                <Badge className={cn(
                                                    "border-none text-[8px] h-4 mt-1 font-black leading-none",
                                                    staff.isActive
                                                        ? "bg-emerald-500/10 text-emerald-500"
                                                        : "bg-rose-500/10 text-rose-500"
                                                )}>
                                                    {staff.isActive ? 'OPERADOR ACTIVO' : 'ACCESO BLOQUEADO'}
                                                </Badge>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-6">
                                        <Badge variant="outline" className="bg-white/5 text-gray-400 border-white/10 px-3 py-1 rounded-xl text-[11px] font-medium">
                                            <Shield className="w-3 h-3 mr-2 opacity-50" /> {staff.jobTitle || staff.role}
                                        </Badge>
                                    </td>
                                    <td className="p-6">
                                        <div className="flex items-center gap-5">
                                            <div className="flex-1 max-w-[150px] h-2 bg-white/5 rounded-full overflow-hidden">
                                                <div
                                                    className={cn(
                                                        "h-full transition-all duration-1000",
                                                        staff.stats.complianceRate >= 90 ? "bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.3)]" :
                                                            staff.stats.complianceRate >= 70 ? "bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.3)]" :
                                                                "bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.3)]"
                                                    )}
                                                    style={{ width: `${staff.stats.complianceRate}%` }}
                                                />
                                            </div>
                                            <div className="flex flex-col">
                                                <span className={cn(
                                                    "text-lg font-black tabular-nums leading-none",
                                                    staff.stats.complianceRate >= 90 ? "text-emerald-400" :
                                                        staff.stats.complianceRate >= 70 ? "text-amber-400" :
                                                            "text-rose-400"
                                                )}>
                                                    {staff.stats.complianceRate}%
                                                </span>
                                                <span className="text-[10px] text-gray-600 font-bold uppercase mt-1 tracking-tighter">
                                                    {staff.stats.completed}/{staff.stats.total} Tareas
                                                </span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-6 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                disabled={loadingIds.includes(staff.staffId)}
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                    handleRemove(staff.staffId);
                                                }}
                                                className="h-10 w-10 text-gray-500 hover:text-rose-500 hover:bg-rose-500/10 rounded-xl transition-all"
                                                title="Eliminar miembro"
                                            >
                                                {loadingIds.includes(staff.staffId) ? (
                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                ) : (
                                                    <Trash2 className="w-4 h-4" />
                                                )}
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="text-gray-500 hover:text-white group-hover:bg-white/5 rounded-xl px-4"
                                            >
                                                Reporte <ChevronRight className="w-4 h-4 ml-1 opacity-0 group-hover:opacity-100 transition-all group-hover:translate-x-1" />
                                            </Button>
                                        </div>
                                    </td>
                                </tr>
                            ))}

                            {/* Pending Invitations */}
                            {initialData.invitations.map((invite: any) => {
                                const isLoading = loadingIds.includes(invite.id);
                                return (
                                    <tr key={invite.id} className="bg-gray-900/20 opacity-90 border-b border-white/5 last:border-0">
                                        <td className="p-6">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-2xl bg-gray-800 flex items-center justify-center text-gray-500 border border-white/5">
                                                    <Mail className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <p className="font-bold text-gray-300 truncate max-w-[150px]">{invite.email}</p>
                                                    <p className="text-[9px] text-amber-500/70 font-black uppercase tracking-[0.1em] mt-1 italic">Pendiente de Aceptación</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-6">
                                            <Badge variant="outline" className="text-gray-500 border-gray-800 px-3 py-1 uppercase text-[10px] rounded-xl font-bold">
                                                {invite.role}
                                            </Badge>
                                        </td>
                                        <td className="p-6">
                                            <div className="flex items-center gap-3 text-amber-500/30 italic text-xs font-medium">
                                                <div className="w-2 h-2 bg-amber-500/20 rounded-full animate-pulse shrink-0" />
                                                <span className="truncate">Sin datos de rendimiento</span>
                                            </div>
                                        </td>
                                        <td className="p-6">
                                            <div className="flex items-center justify-end gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    disabled={isLoading}
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        e.stopPropagation();
                                                        handleResend(invite.id);
                                                    }}
                                                    className="h-10 w-10 text-gray-500 hover:text-violet-400 hover:bg-violet-500/10 rounded-xl transition-all"
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
                                                        handleCancel(invite.id);
                                                    }}
                                                    className="h-10 w-10 text-gray-500 hover:text-rose-500 hover:bg-rose-500/10 rounded-xl transition-all"
                                                    title="Eliminar invitación permanentemente"
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

                            {(performanceStats.length === 0 && initialData.invitations.length === 0) && (
                                <tr>
                                    <td colSpan={4} className="p-20 text-center">
                                        <div className="flex flex-col items-center max-w-xs mx-auto">
                                            <div className="w-16 h-16 bg-white/5 rounded-3xl flex items-center justify-center mb-6">
                                                <Users className="w-8 h-8 text-gray-700" />
                                            </div>
                                            <p className="text-white font-bold text-lg">Tu equipo está vacío</p>
                                            <p className="text-gray-500 text-sm mt-2 leading-relaxed">
                                                Para empezar a monitorear el cumplimiento de tareas, invita a tus colaboradores.
                                            </p>
                                            <Button
                                                onClick={() => setIsInviteOpen(true)}
                                                className="mt-6 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-2xl"
                                            >
                                                Comenzar ahora
                                            </Button>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <InviteMemberModal
                isOpen={isInviteOpen}
                onOpenChange={setIsInviteOpen}
                branchId={branchId}
            />

            <StaffDetailModal
                isOpen={!!selectedStaff}
                onOpenChange={(open) => !open && setSelectedStaff(null)}
                staff={selectedStaff}
            />
        </div>
    )
}
