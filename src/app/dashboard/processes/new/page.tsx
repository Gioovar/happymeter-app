'use client';

import { createProcessZoneWithTasks } from '@/actions/processes-mutations';
import { getTeamMembers } from '@/actions/team-queries';
import { ArrowLeft, Save, Layers, Plus, Trash2, Clock, Camera, Video } from 'lucide-react';
import { TimePicker } from '@/components/ui/TimePicker';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

type TaskDraft = {
    title: string;
    description: string;
    limitTime: string;
    evidenceType: 'PHOTO' | 'VIDEO' | 'BOTH';
};

export default function NewProcessPage() {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Zone State
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [assignedStaffId, setAssignedStaffId] = useState('');
    const [teamMembers, setTeamMembers] = useState<{ id: string, name: string }[]>([]);

    useEffect(() => {
        getTeamMembers().then(setTeamMembers);
    }, []);

    // Tasks State
    const [tasks, setTasks] = useState<TaskDraft[]>([
        { title: '', description: '', limitTime: '', evidenceType: 'PHOTO' } // Start with one empty task
    ]);

    const addTask = () => {
        setTasks([...tasks, { title: '', description: '', limitTime: '', evidenceType: 'PHOTO' }]);
    };

    const removeTask = (index: number) => {
        setTasks(tasks.filter((_, i) => i !== index));
    };

    const updateTask = (index: number, field: keyof TaskDraft, value: string) => {
        const newTasks = [...tasks];
        // @ts-ignore
        newTasks[index] = { ...newTasks[index], [field]: value };
        setTasks(newTasks);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            // Validate
            const validTasks = tasks.filter(t => t.title.trim() !== '');
            if (validTasks.length === 0) {
                toast.error("Agrega al menos una tarea válida con título.");
                setIsSubmitting(false);
                return;
            }

            await createProcessZoneWithTasks({
                name,
                description,
                assignedStaffId,
                tasks: validTasks
            });

            toast.success("Zona y tareas creadas correctamente");
            router.push('/dashboard/processes');
            router.refresh();
        } catch (error) {
            console.error(error);
            toast.error("Error al guardar.");
            setIsSubmitting(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto py-8">
            <Link href="/dashboard/processes" className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-8 transition-colors">
                <ArrowLeft className="w-4 h-4" />
                Volver a Procesos
            </Link>

            <form onSubmit={handleSubmit} className="space-y-8">
                {/* 1. Zone Definition */}
                <div className="bg-[#111] border border-white/10 rounded-2xl p-8">
                    <div className="mb-6 border-b border-white/5 pb-6">
                        <div className="w-12 h-12 bg-cyan-500/10 rounded-xl flex items-center justify-center mb-4 border border-cyan-500/20">
                            <Layers className="w-6 h-6 text-cyan-400" />
                        </div>
                        <h1 className="text-2xl font-bold text-white mb-2">Paso 1: Definir Zona</h1>
                        <p className="text-gray-400">¿Qué área operativa estás configurando?</p>
                    </div>

                    <div className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Nombre de la Zona</label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Ej. Cocina Caliente, Recepción, Baños..."
                                className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/50 transition-all placeholder:text-gray-600"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Responsable (Encargado)</label>
                            <select
                                value={assignedStaffId}
                                onChange={(e) => setAssignedStaffId(e.target.value)}
                                className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/50 transition-all appearance-none"
                            >
                                <option value="">Seleccionar responsable...</option>
                                {teamMembers.map(member => (
                                    <option key={member.id} value={member.id}>{member.name}</option>
                                ))}
                            </select>
                            <p className="text-xs text-gray-500 mt-1">Quien será notificado si las tareas no se cumplen.</p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Descripción (Opcional)</label>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Detalles sobre esta zona..."
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
                            <h2 className="text-xl font-bold text-white">Paso 2: Configurar Tareas</h2>
                            <p className="text-gray-400 text-sm">Define qué debe hacerse en esta zona diariamente.</p>
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
                        {tasks.map((task, index) => (
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
                                            placeholder="Ej. Limpiar filtros..."
                                            className="w-full bg-transparent border-b border-white/10 focus:border-cyan-500 py-1 text-white outline-none transition-colors placeholder:text-gray-700"
                                            required
                                        />
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
                                                onClick={() => updateTask(index, 'evidenceType', 'PHOTO')}
                                                className={`flex-1 flex items-center justify-center gap-1 py-1 rounded text-xs transition-colors ${task.evidenceType === 'PHOTO' ? 'bg-cyan-600 text-white' : 'text-gray-400 hover:text-white'}`}
                                            >
                                                <Camera className="w-3 h-3" />
                                                Foto
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => updateTask(index, 'evidenceType', 'VIDEO')}
                                                className={`flex-1 flex items-center justify-center gap-1 py-1 rounded text-xs transition-colors ${task.evidenceType === 'VIDEO' ? 'bg-cyan-600 text-white' : 'text-gray-400 hover:text-white'}`}
                                            >
                                                <Video className="w-3 h-3" />
                                                Video
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => updateTask(index, 'evidenceType', 'BOTH')}
                                                className={`flex-1 flex items-center justify-center gap-1 py-1 rounded text-xs transition-colors ${task.evidenceType === 'BOTH' ? 'bg-cyan-600 text-white' : 'text-gray-400 hover:text-white'}`}
                                            >
                                                <Layers className="w-3 h-3" />
                                                Ambas
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
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
                                Guardar Todo
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
}
