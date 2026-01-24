'use client'

import React, { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { upsertAchievement } from '@/actions/staff-achievements'
import { Loader2, Save, Trophy, Star, DollarSign, ListChecks } from 'lucide-react'
import { toast } from 'sonner'

interface ManageAchievementModalProps {
    isOpen: boolean
    onClose: () => void
    achievementToEdit?: any
    onSuccess: () => void
}

export default function ManageAchievementModal({ isOpen, onClose, achievementToEdit, onSuccess }: ManageAchievementModalProps) {
    const [loading, setLoading] = useState(false)

    const [name, setName] = useState('')
    const [description, setDescription] = useState('')
    const [icon, setIcon] = useState('🏆')
    const [level, setLevel] = useState(1)
    const [type, setType] = useState('VISITS_COUNT')
    const [threshold, setThreshold] = useState(0)
    const [metricKey, setMetricKey] = useState('')
    const [rewardAmount, setRewardAmount] = useState(0)

    useEffect(() => {
        if (isOpen) {
            if (achievementToEdit) {
                setName(achievementToEdit.name)
                setDescription(achievementToEdit.description)
                setIcon(achievementToEdit.icon)
                setLevel(achievementToEdit.level)
                setType(achievementToEdit.type)
                setThreshold(achievementToEdit.threshold)
                setMetricKey(achievementToEdit.metricKey || '')
                setRewardAmount(achievementToEdit.rewardAmount)
            } else {
                resetForm()
            }
        }
    }, [isOpen, achievementToEdit])

    const resetForm = () => {
        setName('')
        setDescription('')
        setIcon('🏆')
        setLevel(1)
        setType('VISITS_COUNT')
        setThreshold(0)
        setMetricKey('')
        setRewardAmount(0)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        try {
            const result = await upsertAchievement({
                id: achievementToEdit?.id,
                name,
                description,
                icon,
                level: Number(level),
                type,
                threshold: Number(threshold),
                metricKey: type === 'METRIC_THRESHOLD' ? metricKey : undefined,
                rewardAmount: Number(rewardAmount)
            })

            if (!result.success) throw new Error('Error al guardar el logro')

            toast.success('Logro guardado correctamente')
            onSuccess()
            onClose()
        } catch (error: any) {
            toast.error(error.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="bg-[#111] border-white/10 text-white max-w-lg">
                <DialogHeader>
                    <DialogTitle>{achievementToEdit ? 'Editar Logro' : 'Nuevo Logro'}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                    <div className="grid grid-cols-4 gap-4">
                        <div className="col-span-3 space-y-2">
                            <label className="text-xs font-bold text-gray-400">Nombre del Logro</label>
                            <input
                                required
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Ej: Creador Novato"
                                className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-400">Icono</label>
                            <input
                                value={icon}
                                onChange={(e) => setIcon(e.target.value)}
                                className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white text-center"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-400">Descripción (Visible para el creador)</label>
                        <textarea
                            required
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Completa 5 visitas para desbloquear..."
                            className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-400">Nivel (1-20)</label>
                            <input
                                type="number"
                                required
                                min="1"
                                max="20"
                                value={level}
                                onChange={(e) => setLevel(Number(e.target.value))}
                                className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-400">Recompensa ($)</label>
                            <input
                                type="number"
                                required
                                min="0"
                                value={rewardAmount}
                                onChange={(e) => setRewardAmount(Number(e.target.value))}
                                className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white"
                            />
                        </div>
                    </div>

                    <div className="p-4 bg-white/5 rounded-xl border border-white/10 space-y-4">
                        <h4 className="text-sm font-bold flex items-center gap-2">
                            <ListChecks className="w-4 h-4 text-violet-400" /> Criterio de Desbloqueo
                        </h4>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-400">Tipo de Condición</label>
                            <select
                                value={type}
                                onChange={(e) => setType(e.target.value)}
                                className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white"
                            >
                                <option value="VISITS_COUNT">Total de Visitas Aprobadas</option>
                                <option value="EARNINGS_THRESHOLD">Ganancias Totales ($)</option>
                                <option value="METRIC_THRESHOLD">Métrica Específica (Likes/Views)</option>
                                <option value="MANUAL">Asignación Manual</option>
                            </select>
                        </div>

                        {type !== 'MANUAL' && (
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-400">
                                    {type === 'VISITS_COUNT' ? 'Cantidad de Visitas' :
                                        type === 'EARNINGS_THRESHOLD' ? 'Monto Acumulado ($)' :
                                            'Valor Objetivo'}
                                </label>
                                <input
                                    type="number"
                                    required
                                    value={threshold}
                                    onChange={(e) => setThreshold(Number(e.target.value))}
                                    className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white"
                                />
                            </div>
                        )}

                        {type === 'METRIC_THRESHOLD' && (
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-400">Nombre de la Métrica (en JSON)</label>
                                <input
                                    value={metricKey}
                                    onChange={(e) => setMetricKey(e.target.value)}
                                    placeholder="ej: likes, views, reach"
                                    className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white"
                                />
                            </div>
                        )}
                    </div>

                    <div className="flex justify-end pt-4 gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 hover:bg-white/10 rounded-lg text-gray-400 transition"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-6 py-2 bg-violet-600 hover:bg-violet-500 rounded-lg text-white font-bold flex items-center gap-2"
                        >
                            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                            Guardar
                        </button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}
