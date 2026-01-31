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
    days: string[];
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
        {
            title: '',
            description: '',
            limitTime: '',
            evidenceType: 'PHOTO',
            days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] // Default all days
        }
    ]);

    const addTask = () => {
        setTasks([...tasks, {
            title: '',
            description: '',
            limitTime: '',
            evidenceType: 'PHOTO',
            days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
        }]);
    };

    const removeTask = (index: number) => {
        setTasks(tasks.filter((_, i) => i !== index));
    };

    const updateTask = (index: number, field: keyof TaskDraft, value: any) => {
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
        <div className="p-6 md:p-10 max-w-5xl mx-auto">
            <div className="mb-8 flex items-center gap-4">
                <Link href="/dashboard/processes" className="p-2 bg-white/5 rounded-full hover:bg-white/10 transition-colors">
                    <ArrowLeft className="w-5 h-5 text-gray-400" />
                </Link>
                <div>
                    <h1 className="text-3xl font-bold text-white">Nueva Zona de Procesos</h1>
                    <p className="text-gray-400 mt-1">Define un área de trabajo y sus tareas recurrentes.</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
                {/* Zone Info */}
                <div className="bg-[#111] border border-white/5 rounded-2xl p-6 space-y-6">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <Layers className="w-5 h-5 text-purple-500" />
                        Información General
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="text-sm text-gray-400 mb-2 block">Nombre de la Zona</label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Ej. Cocina, Barra, Entrada..."
                                className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-purple-500 outline-none transition-colors"
                                required
                            />
                        </div>
                        <div>
                            <label className="text-sm text-gray-400 mb-2 block">Responsable (Opcional)</label>
                            <select
                                value={assignedStaffId}
                                onChange={(e) => setAssignedStaffId(e.target.value)}
                                className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-purple-500 outline-none transition-colors appearance-none"
                            >
                                <option value="">Sin asignar (Cualquiera puede completar)</option>
                                {teamMembers.map(member => (
                                    <option key={member.id} value={member.id}>{member.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                {/* Tasks Builder */}
                <div className="bg-[#111] border border-white/5 rounded-2xl p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-bold text-white flex items-center gap-2">
                            <Layers className="w-5 h-5 text-cyan-500" />
                            Lista de Tareas
                        </h3>
                        <button
                            type="button"
                            onClick={addTask}
                            className="bg-white/5 hover:bg-white/10 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors border border-white/5"
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

                <div className="flex justify-end gap-3 pt-6 border-t border-white/10">
                    <Link
                        href="/dashboard/processes"
                        className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
                    >
                        Cancelar
                    </Link>
                    <button
                        type="submit"
                        disabled={loading}
                        className="bg-violet-600 hover:bg-violet-700 text-white px-6 py-2 rounded-lg font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        {loading ? 'Guardando...' : 'Crear Zona y Tareas'}
                    </button>
                </div>
            </form>
        </div>
    );
}
