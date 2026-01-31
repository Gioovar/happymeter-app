'use client';

import { updateProcessZoneWithTasks, deleteProcessZone } from '@/actions/processes-mutations';
import { inviteMember, cancelInvitation } from '@/actions/team'; // Import invite action
import { ArrowLeft, Save, Layers, Plus, Trash2, Clock, Camera, Video, MoreVertical, UserPlus, Mail, Loader2 } from 'lucide-react';
import { TimePicker } from '@/components/ui/TimePicker';
import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { ProcessEvidenceType } from '@prisma/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

type TaskUI = {
    id?: string;
    title: string;
    description: string;
    limitTime: string;
    evidenceType: ProcessEvidenceType;
    days?: string[];
    deleted?: boolean;
};

export default function EditZoneForm({ zone, teamMembers, pendingInvitations }: { zone: any, teamMembers: any[], pendingInvitations?: any[] }) {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Invite State
    const [isInviteOpen, setIsInviteOpen] = useState(false);
    const [isInviting, setIsInviting] = useState(false);

    // Zone State
    const [name, setName] = useState(zone.name);
    const [description, setDescription] = useState(zone.description || '');
    const [assignedStaffId, setAssignedStaffId] = useState(zone.assignedStaffId || '');

    // Tasks State
    const [tasks, setTasks] = useState<TaskUI[]>(
        zone.tasks.map((t: any) => ({
            id: t.id,
            title: t.title,
            description: t.description || '',
            limitTime: t.limitTime || '',
            evidenceType: t.evidenceType,
            days: t.days || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
        }))
    );

    const addTask = () => {
        setTasks([...tasks, { title: '', description: '', limitTime: '', evidenceType: ProcessEvidenceType.PHOTO, days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] }]);
    };

    const removeTask = (index: number) => {
        const newTasks = [...tasks];
        // If it has an ID, mark as deleted instead of removing from array
        if (newTasks[index].id) {
            newTasks[index].deleted = true;
        } else {
            // New not-yet-saved task, simplify remove
            newTasks.splice(index, 1);
        }
        setTasks(newTasks);
    };

    const updateTask = (index: number, field: keyof TaskUI, value: any) => {
        const newTasks = [...tasks];
        // @ts-ignore
        newTasks[index] = { ...newTasks[index], [field]: value };
        setTasks(newTasks);
    };

    const toggleDay = (taskIndex: number, day: string) => {
        const task = tasks[taskIndex];
        const currentDays = task.days || [];
        const newDays = currentDays.includes(day)
            ? currentDays.filter(d => d !== day)
            : [...currentDays, day];

        updateTask(taskIndex, 'days', newDays);
    }

    const DAYS = [
        { key: 'Mon', label: 'L' },
        { key: 'Tue', label: 'M' },
        { key: 'Wed', label: 'M' },
        { key: 'Thu', label: 'J' },
        { key: 'Fri', label: 'V' },
        { key: 'Sat', label: 'S' },
        { key: 'Sun', label: 'D' },
    ];

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            // Validate
            const activeTasks = tasks.filter(t => !t.deleted);
            const validTasks = activeTasks.filter(t => t.title.trim() !== '');
            const payloadTasks = tasks.filter(t => t.deleted || t.title.trim() !== '');

            if (validTasks.length === 0 && activeTasks.length > 0) {
                toast.error("Las tareas activas deben tener título.");
                setIsSubmitting(false);
                return;
            }

            await updateProcessZoneWithTasks({
                zoneId: zone.id,
                name,
                description,
                assignedStaffId,
                tasks: payloadTasks
            });

            toast.success("Zona actualizada correctamente");
            router.refresh();
        } catch (error) {
            console.error(error);
            toast.error("Error al guardar cambios.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteZone = async () => {
        if (confirm("¿Estás seguro de que quieres eliminar esta zona y todas sus tareas?")) {
            try {
                await deleteProcessZone(zone.id);
                toast.success("Zona eliminada");
            } catch (error) {
                toast.error("Error al eliminar");
            }
        }
    }

    const handleStaffChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const value = e.target.value;
        if (value === '_INVITE_') {
            setIsInviteOpen(true);
            // Don't change the actual state logic yet, keep previous or empty
        } else {
            setAssignedStaffId(value);
        }
    };

    const handleInviteSubmit = async (formData: FormData) => {
        setIsInviting(true);
        try {
            // Append role OPERATOR as default for Staff
            formData.append('role', 'OPERATOR');
            await inviteMember(formData);
            toast.success("Invitación enviada correctamente");
            toast.info("El usuario aparecerá en la lista una vez acepte la invitación.");
            setIsInviteOpen(false);
        } catch (error: any) {
            toast.error(error.message || "Error al enviar invitación");
        } finally {
            setIsInviting(false);
        }
    };

    return (
        <div>
            {/* Invite Modal */}
            <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
                <DialogContent className="bg-[#111] border-white/10 text-white sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <UserPlus className="w-5 h-5 text-indigo-500" />
                            Invitar Empleado
                        </DialogTitle>
                        <DialogDescription className="text-gray-400">
                            Envía una invitación para que el empleado se una y puedas asignarle esta zona.
                        </DialogDescription>
                    </DialogHeader>

                    <form action={handleInviteSubmit} className="space-y-6 mt-4">
                        <div className="space-y-3">
                            <Label htmlFor="email" className="text-gray-200 text-base">Agregar Correo Electrónico</Label>
                            <div className="relative">
                                <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                                    <Mail className="w-5 h-5 text-gray-500" />
                                </div>
                                <Input
                                    id="email"
                                    name="email"
                                    type="email"
                                    placeholder="ejemplo@correo.com"
                                    required
                                    className="bg-black/50 border-white/10 pl-11 h-12 text-white placeholder:text-gray-600 focus:border-indigo-500 transition-colors"
                                />
                            </div>
                        </div>

                        <DialogFooter className="pt-2">
                            <Button type="button" variant="ghost" onClick={() => setIsInviteOpen(false)} className="text-gray-400 hover:text-white">
                                Cancelar
                            </Button>
                            <Button type="submit" disabled={isInviting} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                                {isInviting ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                        Enviando...
                                    </>
                                ) : (
                                    "Enviar Invitación"
                                )}
                            </Button>
                        </DialogFooter>
                    </form>

                    {/* Pending Invitations List */}
                    {pendingInvitations && pendingInvitations.length > 0 && (
                        <div className="mt-8 border-t border-white/10 pt-6">
                            <h4 className="text-sm font-semibold text-gray-400 mb-3 flex items-center gap-2">
                                <Clock className="w-4 h-4" />
                                Invitaciones Pendientes
                            </h4>
                            <div className="space-y-3 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
                                {pendingInvitations.map((invite) => (
                                    <div key={invite.id} className="flex items-center justify-between bg-white/5 p-3 rounded-lg border border-white/5 group">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center">
                                                <Mail className="w-4 h-4 text-indigo-400" />
                                            </div>
                                            <div>
                                                <p className="text-sm text-white font-medium">{invite.email}</p>
                                                <p className="text-xs text-gray-500">Enviada hace poco</p>
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={async () => {
                                                if (confirm(`¿Eliminar invitación a ${invite.email}?`)) {
                                                    try {
                                                        await cancelInvitation(invite.id);
                                                        toast.success("Invitación eliminada");
                                                        router.refresh();
                                                    } catch (e) {
                                                        toast.error("Error al eliminar");
                                                    }
                                                }
                                            }}
                                            className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-md transition-colors"
                                            title="Eliminar invitación"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            <div className="flex justify-between items-center mb-8">
                <Link href="/dashboard/processes" className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
                    <ArrowLeft className="w-4 h-4" />
                    Volver a Procesos
                </Link>
                <button
                    type="button"
                    onClick={handleDeleteZone}
                    className="text-red-500 hover:text-red-400 text-sm font-medium flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-red-500/10 transition-colors"
                >
                    <Trash2 className="w-4 h-4" />
                    Eliminar Zona
                </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
                {/* 1. Zone Definition */}
                <div className="bg-[#111] border border-white/10 rounded-2xl p-8">
                    <div className="mb-6 border-b border-white/5 pb-6">
                        <div className="w-12 h-12 bg-cyan-500/10 rounded-xl flex items-center justify-center mb-4 border border-cyan-500/20">
                            <Layers className="w-6 h-6 text-cyan-400" />
                        </div>
                        <h1 className="text-2xl font-bold text-white mb-2">Editar Zona</h1>
                    </div>

                    <div className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Nombre de la Zona</label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/50 transition-all placeholder:text-gray-600"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Empleado (Encargado)</label>
                            <select
                                value={assignedStaffId}
                                onChange={handleStaffChange}
                                className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/50 transition-all appearance-none cursor-pointer"
                            >
                                <option value="">Seleccionar empleado...</option>
                                {teamMembers?.map(member => (
                                    <option key={member.id} value={member.id}>{member.name}</option>
                                ))}
                                <hr />
                                <option value="_INVITE_" className="font-bold text-indigo-400 bg-indigo-950/30">
                                    + Invitar Nuevo Empleado
                                </option>
                            </select>
                            <p className="text-xs text-gray-500 mt-2">
                                ¿No encuentras al empleado? Selecciona "Invitar Nuevo" para añadirlo al equipo.
                            </p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Descripción</label>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/50 transition-all placeholder:text-gray-600 resize-none"
                                rows={2}
                            />
                        </div>
                    </div>
                </div>

                {/* 2. Tasks Definition */}
                <div className="bg-[#111] border border-white/10 rounded-2xl p-8">
                    <div className="mb-6 flex justify-between items-center">
                        <div>
                            <h2 className="text-xl font-bold text-white">Configurar Tareas</h2>
                            <p className="text-gray-400 text-sm">Gestiona las tareas diarias de esta zona.</p>
                        </div>
                        <button
                            type="button"
                            onClick={addTask}
                            className="bg-white/5 hover:bg-white/10 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 border border-white/10 transition-colors"
                        >
                            <Plus className="w-4 h-4" />
                            Agregar Tarea
                        </button>
                    </div>

                    <div className="space-y-4">
                        {tasks.map((task, index) => {
                            if (task.deleted) return null; // Hide deleted tasks from UI
                            return (
                                <div key={index} className="bg-black/30 border border-white/5 rounded-xl p-4 relative group">
                                    <button
                                        type="button"
                                        onClick={() => removeTask(index)}
                                        className="absolute top-4 right-4 text-gray-600 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                                    >
                                        <Trash2 className="w-5 h-5" />
                                    </button>

                                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                                        <div className="md:col-span-1 flex items-center justify-center md:justify-start">
                                            <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-xs font-bold text-gray-500 border border-white/5">
                                                {index + 1}
                                            </div>
                                        </div>

                                        <div className="md:col-span-5">
                                            <label className="text-xs text-gray-500 mb-1 block">Tarea</label>
                                            <input
                                                type="text"
                                                value={task.title}
                                                onChange={(e) => updateTask(index, 'title', e.target.value)}
                                                className="w-full bg-transparent border-b border-white/10 focus:border-cyan-500 py-1 text-white outline-none transition-colors placeholder:text-gray-700"
                                                required
                                            />

                                            {/* Days Selector */}
                                            <div className="flex gap-1 mt-3">
                                                {DAYS.map(day => {
                                                    const isActive = task.days?.includes(day.key);
                                                    return (
                                                        <button
                                                            key={day.key}
                                                            type="button"
                                                            onClick={() => toggleDay(index, day.key)}
                                                            className={`w-6 h-6 rounded-full text-[10px] font-bold flex items-center justify-center transition-all ${isActive
                                                                    ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-500/30'
                                                                    : 'bg-white/5 text-gray-500 hover:bg-white/10'
                                                                }`}
                                                        >
                                                            {day.label}
                                                        </button>
                                                    )
                                                })}
                                            </div>
                                        </div>

                                        <div className="md:col-span-3">
                                            <label className="text-xs text-gray-500 mb-1 block flex items-center gap-1">
                                                <Clock className="w-3 h-3" />
                                                Hora Límite
                                            </label>
                                            <TimePicker
                                                value={task.limitTime}
                                                onChange={(val) => updateTask(index, 'limitTime', val)}
                                            />
                                        </div>

                                        <div className="md:col-span-3">
                                            <label className="text-xs text-gray-500 mb-1 block">Tipo de Evidencia</label>
                                            <div className="flex bg-white/5 rounded-lg p-1">
                                                <button
                                                    type="button"
                                                    onClick={() => updateTask(index, 'evidenceType', ProcessEvidenceType.PHOTO)}
                                                    className={`flex-1 flex items-center justify-center gap-1 py-1 rounded text-xs transition-colors ${task.evidenceType === ProcessEvidenceType.PHOTO ? 'bg-cyan-600 text-white' : 'text-gray-400 hover:text-white'}`}
                                                >
                                                    <Camera className="w-3 h-3" />
                                                    Foto
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => updateTask(index, 'evidenceType', ProcessEvidenceType.VIDEO)}
                                                    className={`flex-1 flex items-center justify-center gap-1 py-1 rounded text-xs transition-colors ${task.evidenceType === ProcessEvidenceType.VIDEO ? 'bg-cyan-600 text-white' : 'text-gray-400 hover:text-white'}`}
                                                >
                                                    <Video className="w-3 h-3" />
                                                    Video
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => updateTask(index, 'evidenceType', ProcessEvidenceType.BOTH)}
                                                    className={`flex-1 flex items-center justify-center gap-1 py-1 rounded text-xs transition-colors ${task.evidenceType === ProcessEvidenceType.BOTH ? 'bg-cyan-600 text-white' : 'text-gray-400 hover:text-white'}`}
                                                >
                                                    <Layers className="w-3 h-3" />
                                                    Ambas
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="flex justify-end pt-4">
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold py-4 px-8 rounded-xl flex items-center gap-2 transition-all shadow-lg shadow-cyan-900/20 disabled:opacity-50"
                    >
                        {isSubmitting ? (
                            "Guardando..."
                        ) : (
                            <>
                                <Save className="w-5 h-5" />
                                Guardar Cambios
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
}
