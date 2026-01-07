'use client'

import { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Plus, Save, Square, Circle, Armchair, Move, RotateCw, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { saveFloorPlan } from '@/actions/reservations'

export default function CanvasEditor({ initialData }: { initialData: any }) {
    const [tables, setTables] = useState<any[]>(initialData.tables)
    const [selectedId, setSelectedId] = useState<string | null>(null)
    const [isSaving, setIsSaving] = useState(false)
    const containerRef = useRef<HTMLDivElement>(null)

    const handleDragEnd = (id: string, info: any) => {
        setTables(prev => prev.map(t => {
            if (t.id === id) {
                return {
                    ...t,
                    x: t.x + info.offset.x,
                    y: t.y + info.offset.y
                }
            }
            return t
        }))
    }

    // For Framer Motion, we need to update state differently if we want persistence after re-renders
    // Actually, onDragEnd gives delta, but x/y in style transform. 
    // Easier approach: Use `dragMomentum={false}` and update absolute position logic if complex.
    // OR simpler: just track final position visually. 
    // Let's stick to standard drag logic but ensure we capture final coords.

    const addTable = (type: string) => {
        const newTable = {
            // temp id
            id: `temp-${Date.now()}`,
            label: `Mesa ${tables.length + 1}`,
            x: 50,
            y: 50,
            width: type === 'BAR' ? 150 : 80,
            height: type === 'BAR' ? 50 : 80,
            type,
            capacity: 4,
            rotation: 0
        }
        setTables([...tables, newTable])
    }

    const updateSelected = (key: string, value: any) => {
        if (!selectedId) return
        setTables(prev => prev.map(t => t.id === selectedId ? { ...t, [key]: value } : t))
    }

    const deleteSelected = () => {
        if (!selectedId) return
        setTables(prev => prev.filter(t => t.id !== selectedId))
        setSelectedId(null)
    }

    const handleSave = async () => {
        setIsSaving(true)
        try {
            await saveFloorPlan(initialData.id, tables)
            toast.success("Distribución guardada correctamente")
        } catch (error) {
            console.error(error)
            toast.error("Error al guardar")
        } finally {
            setIsSaving(false)
        }
    }

    const selectedTable = tables.find(t => t.id === selectedId)

    return (
        <div className="flex flex-col h-[calc(100vh-120px)] gap-4">
            {/* Toolbar */}
            <div className="flex items-center justify-between bg-zinc-900 p-4 rounded-xl border border-white/10">
                <div className="flex gap-2">
                    <button onClick={() => addTable('RECT')} className="p-2 hover:bg-white/10 rounded-lg flex flex-col items-center gap-1 text-xs text-zinc-400 hover:text-white transition-colors">
                        <Square className="w-5 h-5" /> Rect
                    </button>
                    <button onClick={() => addTable('ROUND')} className="p-2 hover:bg-white/10 rounded-lg flex flex-col items-center gap-1 text-xs text-zinc-400 hover:text-white transition-colors">
                        <Circle className="w-5 h-5" /> Redonda
                    </button>
                    <button onClick={() => addTable('BAR')} className="p-2 hover:bg-white/10 rounded-lg flex flex-col items-center gap-1 text-xs text-zinc-400 hover:text-white transition-colors">
                        <div className="w-5 h-3 border border-current rounded-sm mt-1" /> Barra
                    </button>
                </div>

                <div className="flex gap-2">
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2"
                    >
                        <Save className="w-4 h-4" />
                        {isSaving ? 'Guardando...' : 'Guardar Distribución'}
                    </button>
                </div>
            </div>

            <div className="flex-1 flex gap-4 overflow-hidden">
                {/* Canvas Area */}
                <div
                    ref={containerRef}
                    className="flex-1 bg-[#1a1a1a] rounded-xl border border-white/5 relative overflow-hidden shadow-inner"
                    style={{
                        backgroundImage: 'radial-gradient(circle, #333 1px, transparent 1px)',
                        backgroundSize: '20px 20px'
                    }}
                    onClick={(e) => {
                        if (e.target === containerRef.current) setSelectedId(null)
                    }}
                >
                    {tables.map((table) => (
                        <motion.div
                            key={table.id}
                            drag
                            dragMomentum={false}
                            // We need to sync visual position with data. 
                            // Framer motion 'drag' modifies transform, not actual x/y props for render unless controlled.
                            // Better approach for simple editor: Use onDragEnd to commit final pos.
                            // Initial pos:
                            initial={{ x: table.x, y: table.y }}
                            onDragEnd={(e, info) => {
                                // Calculate new position based on delta
                                // Note: This is simplified. Real production apps use robust libraries like dnd-kit.
                                // For rapid framer prototypes, we accept slight drift or use layout layoutId.
                                // Here we just update the model.
                                const newX = table.x + info.offset.x
                                const newY = table.y + info.offset.y

                                setTables(prev => prev.map(t =>
                                    t.id === table.id ? { ...t, x: newX, y: newY } : t
                                ))
                            }}
                            onClick={(e) => {
                                e.stopPropagation()
                                setSelectedId(table.id)
                            }}
                            className={`absolute flex items-center justify-center cursor-move group
                                ${selectedId === table.id ? 'ring-2 ring-indigo-500 z-10' : 'hover:ring-1 hover:ring-white/30'}
                            `}
                            style={{
                                width: table.width,
                                height: table.height,
                                rotate: table.rotation,
                                borderRadius: table.type === 'ROUND' ? '50%' : '4px',
                                backgroundColor: table.type === 'BAR' ? '#333' : '#444',
                                border: '1px solid #666',
                            }}
                        >
                            <span className="text-xs text-white font-medium select-none pointer-events-none">
                                {table.label}
                            </span>

                            {/* Capacity dot */}
                            <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[10px] text-zinc-500 whitespace-nowrap">
                                {table.capacity} pax
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Properties Panel */}
                {selectedId && selectedTable && (
                    <div className="w-64 bg-zinc-900 border border-white/10 rounded-xl p-4 flex flex-col gap-4">
                        <h3 className="text-sm font-bold text-white mb-2">Editar Mesa</h3>

                        <div className="space-y-1">
                            <label className="text-xs text-zinc-400">Nombre</label>
                            <input
                                type="text"
                                value={selectedTable.label}
                                onChange={(e) => updateSelected('label', e.target.value)}
                                className="w-full bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-sm text-white focus:outline-none focus:border-indigo-500"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-1">
                                <label className="text-xs text-zinc-400">Capacidad</label>
                                <input
                                    type="number"
                                    value={selectedTable.capacity}
                                    onChange={(e) => updateSelected('capacity', parseInt(e.target.value))}
                                    className="w-full bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-sm text-white"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs text-zinc-400">Rotación</label>
                                <div className="flex items-center gap-1">
                                    <button
                                        onClick={() => updateSelected('rotation', (selectedTable.rotation || 0) + 45)}
                                        className="p-1 bg-zinc-800 rounded hover:bg-zinc-700"
                                    >
                                        <RotateCw className="w-4 h-4 text-zinc-400" />
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-1">
                                <label className="text-xs text-zinc-400">Ancho</label>
                                <input
                                    type="number"
                                    value={selectedTable.width}
                                    onChange={(e) => updateSelected('width', parseInt(e.target.value))}
                                    className="w-full bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-sm text-white"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs text-zinc-400">Largo</label>
                                <input
                                    type="number"
                                    value={selectedTable.height}
                                    onChange={(e) => updateSelected('height', parseInt(e.target.value))}
                                    className="w-full bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-sm text-white"
                                />
                            </div>
                        </div>

                        <div className="pt-4 mt-auto border-t border-white/10">
                            <button
                                onClick={deleteSelected}
                                className="w-full flex items-center justify-center gap-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 p-2 rounded-lg transition-colors text-sm"
                            >
                                <Trash2 className="w-4 h-4" /> Eliminar
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
