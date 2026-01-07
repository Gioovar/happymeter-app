'use client'

import { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Plus, Save, Square, Circle, Armchair, Move, RotateCw, Trash2, PenTool, Sparkles, Copy, Layout } from 'lucide-react'
import { toast } from 'sonner'
import { saveFloorPlan } from '@/actions/reservations'
import { supabase } from '@/lib/supabase'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

export default function CanvasEditor({ initialData }: { initialData: any[] }) {
    const [floorPlans, setFloorPlans] = useState<any[]>(initialData || [])
    const [activeFloorId, setActiveFloorId] = useState<string>(initialData?.[0]?.id || "")
    const [tables, setTables] = useState<any[]>(initialData?.[0]?.tables || [])
    const [selectedId, setSelectedId] = useState<string | null>(null)
    const [isSaving, setIsSaving] = useState(false)
    const [isDrawing, setIsDrawing] = useState(false)
    const [isProcessingAI, setIsProcessingAI] = useState(false)
    const [drawingPoints, setDrawingPoints] = useState<{ x: number, y: number }[]>([])

    // Modal States
    const [isFloorModalOpen, setIsFloorModalOpen] = useState(false)
    const [newFloorName, setNewFloorName] = useState("")
    const [isAIModalOpen, setIsAIModalOpen] = useState(false)
    const [pendingAIResults, setPendingAIResults] = useState<any[] | null>(null)

    const containerRef = useRef<HTMLDivElement>(null)

    // Sync tables when switching floors
    useEffect(() => {
        const activePlan = floorPlans.find(p => p.id === activeFloorId)
        if (activePlan) {
            setTables(activePlan.tables || [])
        }
    }, [activeFloorId]) // removed floorPlans from deps to avoid loop

    // Update local floorPlans state when tables change
    useEffect(() => {
        setFloorPlans(prev => prev.map(p =>
            p.id === activeFloorId ? { ...p, tables } : p
        ))
    }, [tables]) // removed activeFloorId from deps to avoid loop

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

    const startDrawing = () => {
        setIsDrawing(true)
        setDrawingPoints([])
        setSelectedId(null)
        toast.info("Haz clic en el mapa para crear puntos. Haz clic en el primer punto para cerrar la forma.")
    }

    const cancelDrawing = () => {
        setIsDrawing(false)
        setDrawingPoints([])
    }

    const handleCanvasClick = (e: React.MouseEvent) => {
        if (!isDrawing || !containerRef.current) return

        const rect = containerRef.current.getBoundingClientRect()
        const x = e.clientX - rect.left
        const y = e.clientY - rect.top

        // Check if closing shape (near first point)
        if (drawingPoints.length > 2) {
            const first = drawingPoints[0]
            const dist = Math.sqrt(Math.pow(x - first.x, 2) + Math.pow(y - first.y, 2))

            if (dist < 20) {
                finishShape()
                return
            }
        }

        setDrawingPoints([...drawingPoints, { x, y }])
    }

    // Helper to normalize points to 0-100 range
    const normalizePoints = (points: { x: number, y: number }[], width: number, height: number) => {
        return points.map(p => ({
            x: (p.x / width) * 100,
            y: (p.y / height) * 100
        }))
    }

    const finishShape = () => {
        if (drawingPoints.length < 3) return

        // Calculate bounding box to normalize position
        const minX = Math.min(...drawingPoints.map(p => p.x))
        const minY = Math.min(...drawingPoints.map(p => p.y))
        const maxX = Math.max(...drawingPoints.map(p => p.x))
        const maxY = Math.max(...drawingPoints.map(p => p.y))

        const width = maxX - minX
        const height = maxY - minY

        // Relativize points to 0,0 top-left
        const relativePoints = drawingPoints.map(p => ({
            x: p.x - minX,
            y: p.y - minY
        }))

        // Normalize to 0-100 for scalable SVG
        const normalizedPoints = normalizePoints(relativePoints, width, height)

        const newShape = {
            id: `shape-${Date.now()}`,
            label: "Zona Personalizada",
            x: minX,
            y: minY,
            width,
            height,
            type: 'CUSTOM',
            points: JSON.stringify(normalizedPoints),
            capacity: 0,
            rotation: 0
        }

        setTables([...tables, newShape])
        setIsDrawing(false)
        setDrawingPoints([])
        toast.success("Zona creada")
    }

    const addTable = (type: string) => {
        let width = 80
        let height = 80
        let points = null
        let label = `Mesa ${tables.length + 1}`

        if (type === 'BAR') {
            width = 150
            height = 50
        } else if (type === 'L_SHAPE') {
            width = 100
            height = 100
            // L shape 0-100
            points = [
                { x: 0, y: 0 }, { x: 40, y: 0 }, { x: 40, y: 60 },
                { x: 100, y: 60 }, { x: 100, y: 100 }, { x: 0, y: 100 }
            ]
        } else if (type === 'T_SHAPE') {
            width = 100
            height = 100
            // T shape 0-100
            points = [
                { x: 0, y: 0 }, { x: 100, y: 0 }, { x: 100, y: 40 },
                { x: 70, y: 40 }, { x: 70, y: 100 }, { x: 30, y: 100 }, { x: 30, y: 40 }, { x: 0, y: 40 }
            ]
        }

        const newTable = {
            id: `temp-${Date.now()}`,
            label,
            x: 50,
            y: 50,
            width,
            height,
            type,
            capacity: 4,
            rotation: 0,
            points: points ? JSON.stringify(points) : null
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

    const duplicateSelected = () => {
        if (!selectedId) return
        const itemToDuplicate = tables.find(t => t.id === selectedId)
        if (!itemToDuplicate) return

        const newItem = {
            ...itemToDuplicate,
            id: `dup-${Date.now()}`,
            label: `${itemToDuplicate.label} (Copia)`,
            x: itemToDuplicate.x + 20,
            y: itemToDuplicate.y + 20
        }

        setTables([...tables, newItem])
        setSelectedId(newItem.id)
        toast.success("Elemento duplicado")
    }

    const handleAIImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        setIsProcessingAI(true)
        const toastId = toast.loading("Subiendo imagen y analizando con AI...")

        try {
            // 1. Upload to Supabase
            // Sanitize filename: remove accents, spaces, special chars
            const cleanName = file.name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9.-]/g, "_")
            const filename = `floor-plans/${Date.now()}-${cleanName}`
            const { data, error } = await supabase.storage
                .from('evidence') // Using evidence bucket for now as it's public
                .upload(filename, file)

            if (error) throw error

            const publicUrl = supabase.storage
                .from('evidence')
                .getPublicUrl(filename).data.publicUrl

            // 2. Process with AI
            toast.loading("Generando distribución...", { id: toastId })
            const { generateLayoutFromImage } = await import("@/actions/reservations")
            const aiResult = await generateLayoutFromImage(publicUrl)

            if (aiResult.success && aiResult.tables) {
                // 3. Store result and open confirmation modal
                setPendingAIResults(aiResult.tables)
                setIsAIModalOpen(true)
                toast.success("¡Diseño generado con éxito!", { id: toastId })
            } else {
                toast.error(aiResult.error || "No se pudo generar el diseño. Intenta con una imagen más clara.", { id: toastId })
            }

        } catch (error: any) {
            console.error("AI Import Error:", error)
            const msg = error?.message || error?.error?.message || "Error al procesar la imagen"
            toast.error(msg, { id: toastId, duration: 5000 })
        } finally {
            setIsProcessingAI(false)
            // Reset input
            e.target.value = ''
        }
    }

    const confirmAIImport = (replace: boolean) => {
        if (!pendingAIResults) return

        if (replace) {
            setTables(pendingAIResults)
        } else {
            setTables(prev => [...prev, ...pendingAIResults])
        }

        setIsAIModalOpen(false)
        setPendingAIResults(null)
    }

    const openCreateFloorModal = () => {
        setNewFloorName("")
        setIsFloorModalOpen(true)
    }

    const confirmCreateFloor = async () => {
        if (!newFloorName.trim()) return
        setIsFloorModalOpen(false)

        const name = newFloorName
        try {
            // Optimistic update
            const tempId = `temp-${Date.now()}`
            const newFloor = { id: tempId, name, tables: [] }
            setFloorPlans(prev => [...prev, newFloor])
            setActiveFloorId(tempId)

            // Dynamic import to avoid circular dependency issues if any
            const { createFloorPlan } = await import("@/actions/reservations")
            const result = await createFloorPlan(name)

            if (result.success && result.floorPlan) {
                // Replace temp with real
                setFloorPlans(prev => prev.map(p => p.id === tempId ? result.floorPlan : p))
                setActiveFloorId(result.floorPlan.id)
                toast.success("Piso creado")
            } else {
                toast.error("Error al crear piso")
                // Revert
                setFloorPlans(prev => prev.filter(p => p.id !== tempId))
                setActiveFloorId(initialData[0]?.id || "")
            }
        } catch (e) {
            console.error(e)
            toast.error("Error al crear piso")
        }
    }

    const handleSave = async () => {
        if (!activeFloorId) {
            toast.error("Error: No hay piso activo.")
            return
        }

        setIsSaving(true)
        try {
            await saveFloorPlan(activeFloorId, tables)
            toast.success("Distribución guardada correctamente")
        } catch (error) {
            console.error(error)
            toast.error("Error al guardar")
        } finally {
            setIsSaving(false)
        }
    }

    const selectedTable = tables.find(t => t.id === selectedId)

    // Helper to generate SVG path from points
    const getPathFromPoints = (pointsStr: any) => {
        try {
            const points = typeof pointsStr === 'string' ? JSON.parse(pointsStr) : pointsStr
            if (!Array.isArray(points)) return ''

            // Map points to simple SVG path command
            return points.map((p: any, i: number) =>
                `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`
            ).join(' ') + ' Z'
        } catch (e) {
            return ''
        }
    }

    return (
        <div className="flex flex-col h-[calc(100vh-120px)] gap-4">
            {/* Toolbar */}
            <div className="flex items-center justify-between bg-zinc-900 p-4 rounded-xl border border-white/10">
                <div className="flex gap-2 items-center">
                    {/* Floor Selector */}
                    <div className="flex items-center gap-1 bg-zinc-800 rounded-lg p-1 mr-4">
                        {floorPlans.map(floor => (
                            <button
                                key={floor.id}
                                onClick={() => setActiveFloorId(floor.id)}
                                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${activeFloorId === floor.id
                                    ? 'bg-zinc-700 text-white shadow-sm'
                                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700/50'
                                    }`}
                            >
                                {floor.name}
                            </button>
                        ))}
                        <button
                            onClick={openCreateFloorModal}
                            className="px-2 py-1.5 text-xs font-medium rounded-md text-zinc-400 hover:text-white hover:bg-zinc-700/50"
                            title="Agregar Piso"
                        >
                            <Plus className="w-4 h-4" />
                        </button>
                    </div>

                    <div className="w-px h-8 bg-white/10 mx-2" />

                    <button onClick={() => addTable('RECT')} className="p-2 hover:bg-white/10 rounded-lg flex flex-col items-center gap-1 text-xs text-zinc-400 hover:text-white transition-colors">
                        <Square className="w-5 h-5" /> Rect
                    </button>
                    <button onClick={() => addTable('ROUND')} className="p-2 hover:bg-white/10 rounded-lg flex flex-col items-center gap-1 text-xs text-zinc-400 hover:text-white transition-colors">
                        <Circle className="w-5 h-5" /> Redonda
                    </button>
                    <button onClick={() => addTable('BAR')} className="p-2 hover:bg-white/10 rounded-lg flex flex-col items-center gap-1 text-xs text-zinc-400 hover:text-white transition-colors">
                        <div className="w-5 h-3 border border-current rounded-sm mt-1" /> Barra
                    </button>
                    <button onClick={() => addTable('L_SHAPE')} className="p-2 hover:bg-white/10 rounded-lg flex flex-col items-center gap-1 text-xs text-zinc-400 hover:text-white transition-colors">
                        <div className="font-bold text-lg leading-4">L</div> Forma L
                    </button>
                    <button onClick={() => addTable('T_SHAPE')} className="p-2 hover:bg-white/10 rounded-lg flex flex-col items-center gap-1 text-xs text-zinc-400 hover:text-white transition-colors">
                        <div className="font-bold text-lg leading-4">T</div> Forma T
                    </button>

                    <div className="w-px h-8 bg-white/10 mx-2" />

                    <label className="cursor-pointer p-2 hover:bg-white/10 rounded-lg flex flex-col items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 transition-colors">
                        <Sparkles className="w-5 h-5" />
                        <span className="text-[10px]">AI Import</span>
                        <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleAIImport}
                            disabled={isProcessingAI}
                        />
                    </label>

                    <div className="w-px h-8 bg-white/10 mx-2" />

                    <button
                        onClick={isDrawing ? cancelDrawing : startDrawing}
                        className={`p-2 rounded-lg flex flex-col items-center gap-1 text-xs transition-colors ${isDrawing ? 'bg-indigo-600 text-white' : 'hover:bg-white/10 text-zinc-400 hover:text-white'}`}
                    >
                        <PenTool className="w-5 h-5" />
                        {isDrawing ? 'Cancelar' : 'Dibujar Zona'}
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
                    className={`flex-1 bg-[#1a1a1a] rounded-xl border border-white/5 relative overflow-hidden shadow-inner ${isDrawing ? 'cursor-crosshair' : ''}`}
                    style={{
                        backgroundImage: 'radial-gradient(circle, #333 1px, transparent 1px)',
                        backgroundSize: '20px 20px'
                    }}
                    onClick={(e) => {
                        if (isDrawing) {
                            handleCanvasClick(e)
                        } else {
                            if (e.target === containerRef.current) setSelectedId(null)
                        }
                    }}
                >
                    {/* Render Shapes & Tables */}
                    {tables.map((table) => {
                        const isCustomShape = ['CUSTOM', 'L_SHAPE', 'T_SHAPE', 'U_SHAPE'].includes(table.type)
                        return (
                            <motion.div
                                key={table.id}
                                drag={!isDrawing}
                                dragMomentum={false}
                                initial={{ x: table.x, y: table.y }}
                                onDragEnd={(e, info) => {
                                    const newX = table.x + info.offset.x
                                    const newY = table.y + info.offset.y
                                    setTables(prev => prev.map(t =>
                                        t.id === table.id ? { ...t, x: newX, y: newY } : t
                                    ))
                                }}
                                onClick={(e) => {
                                    e.stopPropagation()
                                    if (!isDrawing) setSelectedId(table.id)
                                }}
                                className={`absolute flex items-center justify-center cursor-move group
                                    ${selectedId === table.id ? 'ring-2 ring-indigo-500 z-10' : 'hover:ring-1 hover:ring-white/30'}
                                `}
                                style={{
                                    width: table.width,
                                    height: table.height,
                                    rotate: table.rotation,
                                    borderRadius: table.type === 'ROUND' ? '50%' : '4px',
                                    backgroundColor: isCustomShape ? 'rgba(79, 70, 229, 0.2)' : (table.type === 'BAR' ? '#333' : '#444'),
                                    border: isCustomShape ? 'none' : '1px solid #666',
                                }}
                            >
                                {isCustomShape ? (
                                    <svg
                                        width="100%"
                                        height="100%"
                                        viewBox="0 0 100 100"
                                        preserveAspectRatio="none"
                                        className="overflow-visible pointer-events-none"
                                    >
                                        <path
                                            d={getPathFromPoints(table.points)}
                                            fill={table.type === 'CUSTOM' ? "rgba(79, 70, 229, 0.3)" : "#444"}
                                            stroke={table.type === 'CUSTOM' ? "#4f46e5" : "#666"}
                                            strokeWidth="2"
                                            vectorEffect="non-scaling-stroke"
                                        />
                                    </svg>
                                ) : (
                                    <>
                                        <span className="text-xs text-white font-medium select-none pointer-events-none">
                                            {table.label}
                                        </span>
                                        {/* Capacity dot */}
                                        <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[10px] text-zinc-500 whitespace-nowrap">
                                            {table.capacity} pax
                                        </div>
                                    </>
                                )}

                                {/* Label for L/T/U shapes inside */}
                                {['L_SHAPE', 'T_SHAPE', 'U_SHAPE'].includes(table.type) && (
                                    <span className="absolute inset-0 flex items-center justify-center text-xs text-white font-medium select-none pointer-events-none">
                                        {table.label}
                                    </span>
                                )}
                            </motion.div>
                        )
                    })}

                    {/* Active Drawing Layer */}
                    {isDrawing && (
                        <svg className="absolute inset-0 pointer-events-none w-full h-full">
                            {drawingPoints.length > 0 && (
                                <>
                                    <polyline
                                        points={drawingPoints.map(p => `${p.x},${p.y}`).join(' ')}
                                        fill="none"
                                        stroke="#4f46e5"
                                        strokeWidth="2"
                                        strokeDasharray="4"
                                    />
                                    {drawingPoints.map((p, i) => (
                                        <circle key={i} cx={p.x} cy={p.y} r="3" fill="#fff" />
                                    ))}
                                    {/* Close loop hint */}
                                    {drawingPoints.length > 2 && (
                                        <line
                                            x1={drawingPoints[drawingPoints.length - 1].x}
                                            y1={drawingPoints[drawingPoints.length - 1].y}
                                            x2={drawingPoints[0].x}
                                            y2={drawingPoints[0].y}
                                            stroke="#4f46e5"
                                            strokeOpacity="0.5"
                                            strokeWidth="1"
                                            strokeDasharray="4"
                                        />
                                    )}
                                </>
                            )}
                        </svg>
                    )}
                </div>

                {/* Properties Panel */}
                {selectedId && selectedTable && (
                    <div className="w-64 bg-zinc-900 border border-white/10 rounded-xl p-4 flex flex-col gap-4">
                        <h3 className="text-sm font-bold text-white mb-2">
                            {selectedTable.type === 'CUSTOM' ? 'Editar Zona' : 'Editar Mesa'}
                        </h3>

                        <div className="bg-zinc-800 p-1 rounded-lg flex gap-1 mb-2">
                            <button
                                onClick={() => updateSelected('capacity', selectedTable.capacity === 0 ? 4 : selectedTable.capacity)}
                                className={`flex-1 text-xs py-1.5 rounded-md transition-colors ${selectedTable.capacity > 0 ? 'bg-indigo-600 text-white font-medium shadow' : 'text-zinc-400 hover:text-zinc-300'}`}
                            >
                                Mesa
                            </button>
                            <button
                                onClick={() => updateSelected('capacity', 0)}
                                className={`flex-1 text-xs py-1.5 rounded-md transition-colors ${selectedTable.capacity === 0 ? 'bg-indigo-600 text-white font-medium shadow' : 'text-zinc-400 hover:text-zinc-300'}`}
                            >
                                Espacio
                            </button>
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs text-zinc-400">Nombre</label>
                            <input
                                type="text"
                                value={selectedTable.label}
                                onChange={(e) => updateSelected('label', e.target.value)}
                                className="w-full bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-sm text-white focus:outline-none focus:border-indigo-500"
                            />
                        </div>

                        {selectedTable.capacity > 0 && (
                            <div className="space-y-1">
                                <label className="text-xs text-zinc-400">Capacidad (personas)</label>
                                <input
                                    type="number"
                                    min="1"
                                    value={selectedTable.capacity}
                                    onChange={(e) => updateSelected('capacity', Math.max(1, parseInt(e.target.value) || 1))}
                                    className="w-full bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-sm text-white"
                                />
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-2">
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

                        <div className="pt-4 mt-auto border-t border-white/10 flex flex-col gap-2">
                            <button
                                onClick={duplicateSelected}
                                className="w-full flex items-center justify-center gap-2 text-zinc-300 hover:text-white hover:bg-white/10 p-2 rounded-lg transition-colors text-sm"
                            >
                                <Copy className="w-4 h-4" /> Duplicar
                            </button>
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

            {/* Floor Creation Modal */}
            <Dialog open={isFloorModalOpen} onOpenChange={setIsFloorModalOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Nuevo Piso o Zona</DialogTitle>
                        <DialogDescription>
                            Asigna un nombre a este nuevo espacio (ej. Terraza, Piso 2, VIP).
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <Input
                            placeholder="Nombre del espacio..."
                            value={newFloorName}
                            onChange={(e) => setNewFloorName(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && confirmCreateFloor()}
                            autoFocus
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setIsFloorModalOpen(false)}>Cancelar</Button>
                        <Button onClick={confirmCreateFloor} className="bg-indigo-600 hover:bg-indigo-700">
                            Crear Espacio <Plus className="w-4 h-4 ml-2" />
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* AI Confirmation Modal */}
            <Dialog open={isAIModalOpen} onOpenChange={setIsAIModalOpen}>
                <DialogContent className="max-w-xl">
                    <DialogHeader>
                        <DialogTitle>Diseño AI Generado</DialogTitle>
                        <DialogDescription>
                            Hemos detectado {pendingAIResults?.length || 0} elementos en tu plano. ¿Cómo deseas proceder?
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid grid-cols-2 gap-4 py-4">
                        <button
                            onClick={() => confirmAIImport(true)}
                            className="flex flex-col items-center justify-center p-4 rounded-xl border-2 border-dashed border-zinc-700 hover:border-indigo-500 hover:bg-indigo-500/10 transition-all gap-2 group"
                        >
                            <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center group-hover:bg-indigo-500 group-hover:text-white transition-colors text-indigo-400">
                                <Layout className="w-5 h-5" />
                            </div>
                            <span className="font-medium text-white text-sm">Reemplazar Todo</span>
                            <span className="text-[10px] text-zinc-400 text-center">Borra lo actual y usa solo lo nuevo</span>
                        </button>

                        <button
                            onClick={() => confirmAIImport(false)}
                            className="flex flex-col items-center justify-center p-4 rounded-xl border-2 border-dashed border-zinc-700 hover:border-emerald-500 hover:bg-emerald-500/10 transition-all gap-2 group"
                        >
                            <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center group-hover:bg-emerald-500 group-hover:text-white transition-colors text-emerald-400">
                                <Plus className="w-5 h-5" />
                            </div>
                            <span className="font-medium text-white text-sm">Combinar</span>
                            <span className="text-[10px] text-zinc-400 text-center">Agrega lo nuevo a lo existente</span>
                        </button>
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setIsAIModalOpen(false)}>Cancelar Operación</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
