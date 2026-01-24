'use client'

import React, { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { getAllAchievements, upsertAchievement } from '@/actions/admin-achievements'
import { Loader2, Plus, Pencil, Trophy, Save } from 'lucide-react'
import { toast } from 'sonner'

export default function ManageAchievementsModal() {
    const [achievements, setAchievements] = useState<any[]>([])
    const [loading, setLoading] = useState(false)
    const [editingId, setEditingId] = useState<string | null>(null)
    const [formData, setFormData] = useState<any>({})
    const [open, setOpen] = useState(false)

    const load = async () => {
        setLoading(true)
        try {
            const data = await getAllAchievements()
            setAchievements(data)
        } catch (error) {
            toast.error('Error cargando logros')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (open) load()
    }, [open])

    const handleEdit = (item: any) => {
        setEditingId(item.id)
        setFormData({ ...item })
    }

    const handleCreate = () => {
        setEditingId('NEW')
        setFormData({
            name: '',
            description: '',
            instructions: '',
            level: achievements.length + 1,
            rewardAmount: 0,
            icon: '🏆',
            type: 'MANUAL',
            threshold: 1
        })
    }

    const handleSave = async () => {
        try {
            await upsertAchievement({ ...formData, id: editingId === 'NEW' ? undefined : editingId })
            toast.success('Logro guardado correctamente')
            setEditingId(null)
            load()
        } catch (error) {
            toast.error('Error guardando logro')
        }
    }

    return (
        <>
            <button
                onClick={() => setOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-white text-black font-medium border border-gray-200 rounded-lg hover:bg-gray-100 transition text-sm shadow-sm"
            >
                <Trophy className="w-4 h-4" />
                Gestionar Logros
            </button>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto bg-[#0a0a0a] text-white border border-white/10 shadow-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
                            Gestión de Logros y Niveles
                        </DialogTitle>
                    </DialogHeader>

                    <div className="space-y-6 mt-4">
                        {!editingId ? (
                            <>
                                <div className="flex justify-end">
                                    <button
                                        onClick={handleCreate}
                                        className="flex items-center gap-2 px-4 py-2 bg-white text-black hover:bg-gray-200 rounded-full font-bold text-sm transition"
                                    >
                                        <Plus className="w-4 h-4" /> Nuevo Logro
                                    </button>
                                </div>

                                <div className="grid grid-cols-1 gap-3">
                                    {loading ? (
                                        <div className="text-center py-20"><Loader2 className="w-8 h-8 animate-spin mx-auto text-violet-500" /></div>
                                    ) : (
                                        achievements.map((item) => (
                                            <div key={item.id} className="group bg-[#111] border border-white/5 rounded-xl p-4 flex items-center justify-between hover:border-violet-500/30 transition duration-300">
                                                <div className="flex items-center gap-5">
                                                    <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center text-2xl group-hover:scale-110 transition">
                                                        {item.icon}
                                                    </div>
                                                    <div>
                                                        <h4 className="font-bold text-lg text-white">{item.name}</h4>
                                                        <div className="flex items-center gap-2 text-sm text-gray-400 font-mono">
                                                            <span className="px-2 py-0.5 bg-white/5 rounded text-xs">Lvl {item.level}</span>
                                                            <span className="text-green-400">${item.rewardAmount}</span>
                                                        </div>
                                                        <p className="text-xs text-gray-500 mt-1 line-clamp-1 max-w-md">{item.description}</p>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => handleEdit(item)}
                                                    className="p-2 text-gray-500 hover:text-white hover:bg-white/10 rounded-full transition"
                                                >
                                                    <Pencil className="w-4 h-4" />
                                                </button>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </>
                        ) : (
                            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Nombre del Logro</label>
                                        <input
                                            value={formData.name || ''}
                                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                                            placeholder="Ej. Súper Influencer"
                                            className="flex h-12 w-full rounded-xl border border-white/10 bg-[#161616] px-4 py-2 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-violet-500 transition"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Icono (Emoji)</label>
                                        <input
                                            value={formData.icon || ''}
                                            onChange={e => setFormData({ ...formData, icon: e.target.value })}
                                            placeholder="🏆"
                                            className="flex h-12 w-full rounded-xl border border-white/10 bg-[#161616] px-4 py-2 text-2xl text-center focus:outline-none focus:border-violet-500 transition"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Nivel</label>
                                        <input
                                            type="number"
                                            value={formData.level || ''}
                                            onChange={e => setFormData({ ...formData, level: e.target.value })}
                                            className="flex h-12 w-full rounded-xl border border-white/10 bg-[#161616] px-4 py-2 text-sm text-white focus:outline-none focus:border-violet-500 transition"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Recompensa ($MXN)</label>
                                        <div className="relative">
                                            <span className="absolute left-4 top-3.5 text-gray-500">$</span>
                                            <input
                                                type="number"
                                                value={formData.rewardAmount || ''}
                                                onChange={e => setFormData({ ...formData, rewardAmount: e.target.value })}
                                                className="flex h-12 w-full rounded-xl border border-white/10 bg-[#161616] pl-8 pr-4 py-2 text-sm text-white focus:outline-none focus:border-violet-500 transition"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Descripción Corta</label>
                                    <textarea
                                        value={formData.description || ''}
                                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                                        placeholder="Breve descripción que aparece en la tarjeta..."
                                        className="flex min-h-[80px] w-full rounded-xl border border-white/10 bg-[#161616] px-4 py-3 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-violet-500 transition"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-violet-400 uppercase tracking-wider">Instrucciones Detalladas</label>
                                    <p className="text-xs text-gray-500 mb-2">Explica paso a paso qué debe hacer el creador. (Soporta saltos de línea)</p>
                                    <textarea
                                        value={formData.instructions || ''}
                                        onChange={e => setFormData({ ...formData, instructions: e.target.value })}
                                        placeholder="1. Sube una historia mencionando a @happymeter..."
                                        className="flex min-h-[150px] w-full rounded-xl border border-white/10 bg-[#161616] px-4 py-3 text-sm text-white font-mono placeholder:text-gray-600 focus:outline-none focus:border-violet-500 transition"
                                    />
                                </div>

                                <div className="flex justify-end gap-3 pt-6 border-t border-white/10">
                                    <button
                                        onClick={() => setEditingId(null)}
                                        className="px-6 py-2 hover:bg-white/5 rounded-lg text-sm font-medium text-gray-400 hover:text-white transition"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        onClick={handleSave}
                                        className="flex items-center gap-2 px-6 py-2 bg-white text-black hover:bg-gray-200 rounded-lg text-sm font-bold transition shadow-lg shadow-white/5"
                                    >
                                        <Save className="w-4 h-4" /> Guardar Cambios
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </>
    )
}
