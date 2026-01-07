'use client'

import { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Plus, Save, Square, Circle, Armchair, Move, RotateCw, Trash2, PenTool, Sparkles, Copy, Layout, Settings, DollarSign } from 'lucide-react'
import { toast } from 'sonner'
import { saveFloorPlan } from '@/actions/reservations'
import { supabase } from '@/lib/supabase'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

export default function CanvasEditor({ initialData }: { initialData: any[] }) {

    const [floorPlans, setFloorPlans] = useState<any[]>(initialData)
    const [activeFloorId, setActiveFloorId] = useState<string>(initialData[0]?.id || "")

    // Edit Floor State
    const [isEditFloorModalOpen, setIsEditFloorModalOpen] = useState(false)
    const [editFloorData, setEditFloorData] = useState({ name: '', width: 10, height: 10 })
    const [isPropertiesModalOpen, setIsPropertiesModalOpen] = useState(false)

    // AI Import State
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
        let width = 50
        let height = 50
        let points = null
        let label = `Mesa ${tables.length + 1}`

        if (type === 'BAR') {
            width = 120
            height = 40
        } else if (type === 'L_SHAPE') {
            width = 80
            height = 80
            // L shape 0-100
            points = [
                { x: 0, y: 0 }, { x: 40, y: 0 }, { x: 40, y: 60 },
                { x: 100, y: 60 }, { x: 100, y: 100 }, { x: 0, y: 100 }
            ]
        } else if (type === 'T_SHAPE') {
            width = 80
            height = 80
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

    const openEditFloorModal = () => {
        const floor = floorPlans.find(f => f.id === activeFloorId)
        if (!floor) return
        setEditFloorData({
            name: floor.name,
            width: floor.physicalWidth || 10,
            height: floor.physicalHeight || 10
        })
        setIsEditFloorModalOpen(true)
    }

    const handleUpdateFloor = async () => {
        setIsUpdating(true)
        try {
            const { updateFloorMetadata } = await import("@/actions/reservations")
            const result = await updateFloorMetadata(activeFloorId, editFloorData)
            if (result.success) {
                setFloorPlans(prev => prev.map(p => p.id === activeFloorId ? { ...p, ...result.floorPlan } : p))
                setIsEditFloorModalOpen(false)
                toast.success("Espacio actualizado")
            } else {
                toast.error("Error al actualizar")
            }
        } catch (e) {
            console.error(e)
            toast.error("Error al actualizar")
        } finally {
            setIsUpdating(false)
        }
    }

    const handleDeleteFloor = async () => {
        if (!confirm("¿Estás seguro de eliminar este piso? Esta acción no se puede deshacer.")) return

        try {
            const { deleteFloorPlan } = await import("@/actions/reservations")
            const result = await deleteFloorPlan(activeFloorId)
            if (result.success) {
                const remaining = floorPlans.filter(p => p.id !== activeFloorId)
                setFloorPlans(remaining)
                setActiveFloorId(remaining[0]?.id || "")
                setIsEditFloorModalOpen(false)
                toast.success("Piso eliminado")
            } else {
                toast.error(result.error || "No se pudo eliminar")
            }
        } catch (e) {
            console.error(e)
            toast.error("Error al eliminar")
        }
    }


    const activeFloorIndex = floorPlans.findIndex(p => p.id === activeFloorId)
    const TINT_COLORS = [
        'from-indigo-500/10',
        'from-purple-500/10',
        'from-blue-500/10',
        'from-orange-500/10',
        'from-emerald-500/10',
        'from-rose-500/10',
    ]
    const currentTint = activeFloorIndex >= 0 ? TINT_COLORS[activeFloorIndex % TINT_COLORS.length] : TINT_COLORS[0]

    const [containerSize, setContainerSize] = useState({ width: 0, height: 0 })
    const wrapperRef = useRef<HTMLDivElement>(null)
    const [isUpdating, setIsUpdating] = useState(false)

    useEffect(() => {
        if (!wrapperRef.current) return

        const observer = new ResizeObserver((entries) => {
            const entry = entries[0]
            if (entry) {
                setContainerSize({
                    width: entry.contentRect.width,
                    height: entry.contentRect.height
                })
            }
        })

        observer.observe(wrapperRef.current)
        return () => observer.disconnect()
    }, [])


    const activeFloor = floorPlans.find(f => f.id === activeFloorId)
    const physWidth = activeFloor?.physicalWidth || 10
    const physHeight = activeFloor?.physicalHeight || 10
    const floorRatio = physWidth / physHeight
    const containerRatio = containerSize.width / containerSize.height || 1

    // Determine fit sizing
    // If floor is "wider" relative to container, constrain width. Else constrain height.
    const fitStyle = floorRatio > containerRatio
        ? { width: '100%', height: 'auto', aspectRatio: `${physWidth}/${physHeight}` }
        : { height: '100%', width: 'auto', aspectRatio: `${physWidth}/${physHeight}` }

    // Layout constants
    const PHONE_WIDTH = 390
    const PHONE_HEIGHT = 844

    return (
        <div className="flex h-[calc(100vh-80px)] bg-zinc-950 overflow-hidden">
            {/* LEFT PANEL: Tools & Properties */}
            <div className="w-[400px] flex flex-col border-r border-white/10 bg-zinc-900/50">
                <div className="p-6 border-b border-white/10">
                    <h2 className="text-xl font-bold text-white mb-2">Editor de Mapa</h2>
                    <p className="text-sm text-zinc-400">
                        Diseña tu espacio pensando en móvil.
                        Tus clientes verán esto en su celular.
                    </p>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {/* Floor Selection */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Pisos / Áreas</label>
                            <button
                                onClick={openCreateFloorModal}
                                className="p-1 hover:bg-white/10 rounded text-zinc-400 hover:text-white"
                            >
                                <Plus className="w-4 h-4" />
                            </button>
                        </div>
                        <div className="flex flex-col gap-2">
                            {floorPlans.map(floor => (
                                <button
                                    key={floor.id}
                                    onClick={() => setActiveFloorId(floor.id)}
                                    className={`flex items-center justify-between px-3 py-3 rounded-lg text-sm transition-all ${activeFloorId === floor.id
                                        ? 'bg-indigo-600 text-white shadow-md'
                                        : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                                        }`}
                                >
                                    <span className="font-medium">{floor.name}</span>
                                    {activeFloorId === floor.id && <Settings onClick={(e) => { e.stopPropagation(); openEditFloorModal() }} className="w-4 h-4 opacity-70 hover:opacity-100" />}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="h-px bg-white/10" />

                    {/* Palette */}
                    <div className="space-y-3">
                        <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Agregar Elementos</label>
                        <div className="grid grid-cols-2 gap-3">
                            <button onClick={() => addTable('RECT')} className="p-3 bg-zinc-800 hover:bg-zinc-700 rounded-xl flex flex-col items-center gap-2 text-zinc-300 transition-all border border-transparent hover:border-white/10">
                                <Square className="w-6 h-6" /> <span className="text-xs">Rectangular</span>
                            </button>
                            <button onClick={() => addTable('ROUND')} className="p-3 bg-zinc-800 hover:bg-zinc-700 rounded-xl flex flex-col items-center gap-2 text-zinc-300 transition-all border border-transparent hover:border-white/10">
                                <Circle className="w-6 h-6" /> <span className="text-xs">Redonda</span>
                            </button>
                            <button onClick={() => addTable('BAR')} className="p-3 bg-zinc-800 hover:bg-zinc-700 rounded-xl flex flex-col items-center gap-2 text-zinc-300 transition-all border border-transparent hover:border-white/10">
                                <div className="w-6 h-4 border-2 border-current rounded-sm mt-1" /> <span className="text-xs">Barra</span>
                            </button>
                            <button onClick={() => addTable('L_SHAPE')} className="p-3 bg-zinc-800 hover:bg-zinc-700 rounded-xl flex flex-col items-center gap-2 text-zinc-300 transition-all border border-transparent hover:border-white/10">
                                <span className="font-bold text-xl leading-5">L</span> <span className="text-xs">Forma L</span>
                            </button>
                            <button onClick={() => addTable('T_SHAPE')} className="p-3 bg-zinc-800 hover:bg-zinc-700 rounded-xl flex flex-col items-center gap-2 text-zinc-300 transition-all border border-transparent hover:border-white/10">
                                <span className="font-bold text-xl leading-5">T</span> <span className="text-xs">Forma T</span>
                            </button>
                            <button
                                onClick={isDrawing ? cancelDrawing : startDrawing}
                                className={`p-3 rounded-xl flex flex-col items-center gap-2 transition-all border border-transparent ${isDrawing ? 'bg-indigo-600 text-white' : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:border-white/10'}`}
                            >
                                <PenTool className="w-6 h-6" />
                                <span className="text-xs">{isDrawing ? 'Cancel' : 'Dibujar'}</span>
                            </button>
                        </div>
                    </div>

                    <div className="h-px bg-white/10" />

                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Importar con AI</label>
                    <label className="cursor-pointer p-3 bg-zinc-800 hover:bg-zinc-700 rounded-xl flex flex-col items-center gap-2 text-indigo-400 transition-all border border-transparent hover:border-white/10">
                        <Sparkles className="w-6 h-6" />
                        <span className="text-xs">Subir Imagen</span>
                        <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleAIImport}
                            disabled={isProcessingAI}
                        />
                    </label>

                    {/* Properties (Moved from floating right panel to here) */}
                    {/* Properties (Moved to Modal) */}
                    {selectedId && selectedTable && (
                        <div className="mt-4 p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-center">
                            <p className="text-sm text-indigo-300 font-medium mb-2">Elemento Seleccionado</p>
                            <p className="text-xs text-zinc-400 mb-3">Haz doble clic en la mesa o usa el botón de editar para modificar propiedades.</p>
                            <button
                                onClick={() => setIsPropertiesModalOpen(true)}
                                className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm transition-colors flex items-center justify-center gap-2"
                            >
                                <Settings className="w-4 h-4" /> Editar Propiedades
                            </button>
                        </div>
                    )}
                </div>

                <div className="p-4 border-t border-white/10 bg-zinc-900">
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="w-full bg-indigo-600 hover:bg-indigo-500 text-white h-12 rounded-xl text-sm font-bold flex items-center justify-center gap-2 shadow-lg shadow-indigo-900/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
                    >
                        {isSaving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
                        {isSaving ? 'Guardando...' : 'Guardar Cambios'}
                    </button>
                </div>
            </div>

            {/* CENTER PANEL: Mobile Preview */}
            <div className="flex-1 bg-[#09090b] relative flex items-center justify-center p-8 overflow-hidden">

                {/* Dotted Grid Background */}
                <div
                    className="absolute inset-0 opacity-20 pointer-events-none"
                    style={{ backgroundImage: 'radial-gradient(circle, #444 1px, transparent 1px)', backgroundSize: '24px 24px' }}
                />

                <div className="flex flex-col items-center gap-4 animate-in zoom-in-95 duration-500">
                    <span className="text-xs font-medium text-zinc-500 uppercase tracking-widest bg-zinc-900/80 px-3 py-1 rounded-full border border-white/5 backdrop-blur-sm">
                        Vista Previa del Cliente (Móvil)
                    </span>

                    {/* PHONE FRAME */}
                    <div
                        className="relative bg-black rounded-[40px] border-[8px] border-zinc-700 shadow-2xl overflow-hidden ring-1 ring-white/20"
                        style={{ width: PHONE_WIDTH, height: PHONE_HEIGHT }}
                    >
                        {/* Status Bar Fake */}
                        <div className="h-6 w-full flex items-center justify-between px-6 pt-2 z-20 relative select-none pointer-events-none">
                            <span className="text-[10px] font-medium text-white">9:41</span>
                            <div className="flex gap-1">
                                <div className="w-3 h-3 rounded-full border border-white/20" />
                                <div className="w-3 h-3 rounded-full border border-white/20" />
                            </div>
                        </div>

                        {/* Interactive Canvas Container */}
                        <div
                            ref={wrapperRef}
                            className="absolute inset-0 top-0 bottom-0 flex items-center justify-center bg-zinc-800 overflow-hidden"
                        >
                            {/* The actual Scale Wrapper */}
                            {containerSize.width > 0 && (
                                <div
                                    ref={containerRef}
                                    className={`relative transition-colors duration-300 ${isDrawing ? 'cursor-crosshair' : 'cursor-default'}`}
                                    style={{
                                        // We fit the floor plan into the phone screen width/height based on aspect ratio
                                        // But wait, we want the user to be able to PAN around if it's large?
                                        // No, for "Map Editor" usually we want to see the whole thing or zoom.
                                        // Let's stick to the existing "fitStyle" logic but applied to the phone dimensions.
                                        // containerSize is now the phone screen size.
                                        ...fitStyle,
                                        width: fitStyle.width,
                                        height: fitStyle.height,
                                        // Visualization helpers
                                        boxShadow: '0 0 0 1px rgba(255,255,255,0.1)',
                                    }}
                                    onClick={(e) => {
                                        if (isDrawing) {
                                            handleCanvasClick(e)
                                        } else {
                                            if (e.target === containerRef.current) setSelectedId(null)
                                        }
                                    }}
                                >
                                    {/* Grid on the map itself */}
                                    <div className="absolute inset-0 opacity-20 pointer-events-none"
                                        style={{ backgroundImage: 'linear-gradient(rgba(99, 102, 241, 0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(99, 102, 241, 0.5) 1px, transparent 1px)', backgroundSize: '40px 40px' }}
                                    />

                                    {/* Render Shapes (Existing Logic) */}
                                    {tables.map((table) => {
                                        const isCustomShape = ['CUSTOM', 'L_SHAPE', 'T_SHAPE', 'U_SHAPE'].includes(table.type)
                                        return (
                                            <motion.div
                                                key={table.id}
                                                drag={!isDrawing}
                                                dragMomentum={false}
                                                // Constrain drag to parent? Maybe not, allow dragging out slightly to rearrange
                                                // dragConstraints={containerRef}
                                                initial={{ x: table.x, y: table.y }}
                                                onDragEnd={(e, info) => {
                                                    // Note: frame-motion drag adds translation to the element transform style.
                                                    // We need to sync back to state.
                                                    // BUT: The existing logic uses info.offset which is delta.
                                                    // If we render with absolute x/y, we should update x/y.

                                                    // Important: Framer Motion 'drag' modifies the visual transform.
                                                    // If we update state 'x' and 'y', React re-renders.
                                                    // If we just use 'offset', we are assuming previous position.

                                                    // The original code:
                                                    // x: t.x + info.offset.x
                                                    // This is correct for delta updates.

                                                    const newX = table.x + info.offset.x
                                                    const newY = table.y + info.offset.y
                                                    setTables(prev => prev.map(t =>
                                                        t.id === table.id ? { ...t, x: newX, y: newY } : t
                                                    ))
                                                }}
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    if (!isDrawing) {
                                                        setSelectedId(table.id)
                                                        // Optional: Auto open on double click or just select
                                                    }
                                                }}
                                                onDoubleClick={(e) => {
                                                    e.stopPropagation()
                                                    if (!isDrawing) {
                                                        setSelectedId(table.id)
                                                        setIsPropertiesModalOpen(true)
                                                    }
                                                }}
                                                className={`absolute flex items-center justify-center cursor-move group touch-none
                                                    ${selectedId === table.id ? 'ring-2 ring-indigo-500 z-20 shadow-lg shadow-indigo-500/20' : 'hover:ring-1 hover:ring-white/30'}
                                                `}
                                                style={{
                                                    width: table.width,
                                                    height: table.height,
                                                    rotate: table.rotation,
                                                    borderRadius: table.type === 'ROUND' ? '50%' : '8px',
                                                    backgroundColor: isCustomShape ? 'rgba(79, 70, 229, 0.2)' : '#27272a', // Zinc 800
                                                    border: isCustomShape ? 'none' : '1px solid rgba(255,255,255,0.1)',
                                                }}
                                            >
                                                {/* Content similar to before... */}
                                                {isCustomShape ? (
                                                    <svg
                                                        width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none"
                                                        className="overflow-visible pointer-events-none"
                                                    >
                                                        <path
                                                            d={getPathFromPoints(table.points)}
                                                            fill={table.type === 'CUSTOM' ? "rgba(99, 102, 241, 0.3)" : "#27272a"}
                                                            stroke={table.type === 'CUSTOM' ? "#6366f1" : "#52525b"}
                                                            strokeWidth="2"
                                                            vectorEffect="non-scaling-stroke"
                                                        />
                                                    </svg>
                                                ) : (
                                                    <>
                                                        <span className="text-[10px] text-white/90 font-bold select-none pointer-events-none truncate max-w-full px-1">
                                                            {table.label}
                                                        </span>
                                                        {table.capacity > 0 && (
                                                            <div className="absolute -bottom-4 bg-black/50 px-1 rounded text-[8px] text-zinc-400 whitespace-nowrap">
                                                                {table.capacity}p
                                                            </div>
                                                        )}
                                                        {/* Price Indicator */}
                                                        {(table.reservationPrice || 0) > 0 && (
                                                            <div className="absolute -top-2 -right-2 bg-green-500 text-black text-[8px] font-bold px-1 rounded-full shadow-sm">
                                                                $
                                                            </div>
                                                        )}
                                                    </>
                                                )}

                                                {/* Edit Button Overlay */}
                                                {selectedId === table.id && !isDrawing && (
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation()
                                                            setIsPropertiesModalOpen(true)
                                                        }}
                                                        className="absolute -top-8 left-1/2 -translate-x-1/2 bg-indigo-600 text-white p-1.5 rounded-full shadow-lg hover:scale-110 transition-transform z-30"
                                                    >
                                                        <PenTool className="w-3 h-3" />
                                                    </button>
                                                )}


                                                {/* L/T/U Label */}
                                                {['L_SHAPE', 'T_SHAPE', 'U_SHAPE'].includes(table.type) && (
                                                    <span className="absolute inset-0 flex items-center justify-center text-xs text-white/50 font-bold select-none pointer-events-none">
                                                        {table.label}
                                                    </span>
                                                )}
                                            </motion.div>
                                        )
                                    })}

                                    {/* Drawing Layer */}
                                    {isDrawing && (
                                        <svg className="absolute inset-0 pointer-events-none w-full h-full z-50">
                                            <polyline points={drawingPoints.map(p => `${p.x},${p.y}`).join(' ')} fill="none" stroke="#6366f1" strokeWidth="2" strokeDasharray="4" />
                                            {drawingPoints.map((p, i) => (
                                                <circle key={i} cx={p.x} cy={p.y} r="3" fill="#fff" stroke="#6366f1" />
                                            ))}
                                        </svg>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Interactive Hint */}
                        <div className="absolute bottom-8 left-0 right-0 text-center pointer-events-none z-20">
                            <p className="text-[10px] text-white/20">Interactúa aquí como si fuera tu celular</p>
                        </div>
                    </div>
                </div>

            </div>

            {/* Modals */}
            <Dialog open={isFloorModalOpen} onOpenChange={setIsFloorModalOpen}>
                <DialogContent className="sm:max-w-md bg-zinc-900 border-zinc-800 text-white">
                    <DialogHeader>
                        <DialogTitle>Crear Nuevo Piso</DialogTitle>
                        <DialogDescription>Define el nombre y dimensiones aproximadas.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Nombre del Piso</label>
                            <Input value={newFloorName} onChange={(e) => setNewFloorName(e.target.value)} placeholder="Ej. Terraza, Planta Baja" className="bg-black border-zinc-800" />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsFloorModalOpen(false)} className="border-zinc-700 hover:bg-zinc-800 hover:text-white">Cancelar</Button>
                        <Button onClick={confirmCreateFloor} className="bg-indigo-600 hover:bg-indigo-700 text-white">Crear Piso</Button>
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

            {/* Edit Floor Modal */}
            {/* Edit Floor Modal */}
            <Dialog open={isEditFloorModalOpen} onOpenChange={setIsEditFloorModalOpen}>
                <DialogContent className="sm:max-w-md bg-zinc-900 border-zinc-800 text-white">
                    <DialogHeader>
                        <DialogTitle>Editar Piso Actual</DialogTitle>
                        <DialogDescription>Modifica las dimensiones físicas para calibrar el mapa.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Nombre</label>
                            <Input value={editFloorData.name} onChange={(e) => setEditFloorData({ ...editFloorData, name: e.target.value })} className="bg-black border-zinc-800" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Ancho (metros)</label>
                                <Input type="number" value={editFloorData.width} onChange={(e) => setEditFloorData({ ...editFloorData, width: parseFloat(e.target.value) })} className="bg-black border-zinc-800" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Largo (metros)</label>
                                <Input type="number" value={editFloorData.height} onChange={(e) => setEditFloorData({ ...editFloorData, height: parseFloat(e.target.value) })} className="bg-black border-zinc-800" />
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <div className="flex justify-between w-full">
                            <Button variant="destructive" onClick={handleDeleteFloor} className="px-3 bg-red-900/50 hover:bg-red-900 text-red-200 border border-red-900/50">
                                <Trash2 className="w-4 h-4" />
                            </Button>
                            <div className="flex gap-2">
                                <Button variant="outline" onClick={() => setIsEditFloorModalOpen(false)} className="border-zinc-700 hover:bg-zinc-800 hover:text-white">Cancelar</Button>
                                <Button onClick={handleUpdateFloor} disabled={isUpdating} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                                    {isUpdating ? 'Guardando...' : 'Guardar Cambios'}
                                </Button>
                            </div>
                        </div>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Table Properties Modal (New Pop-up) */}
            <Dialog open={isPropertiesModalOpen} onOpenChange={setIsPropertiesModalOpen}>
                <DialogContent className="sm:max-w-md bg-zinc-900 border-zinc-800 text-white">
                    <DialogHeader className="flex flex-row items-center justify-between">
                        <DialogTitle>Editar {selectedTable?.label || 'Elemento'}</DialogTitle>
                        {selectedTable && (
                            <Button variant="ghost" size="icon" onClick={() => { deleteSelected(); setIsPropertiesModalOpen(false) }} className="text-red-400 hover:text-red-300 hover:bg-red-900/20">
                                <Trash2 className="w-5 h-5" />
                            </Button>
                        )}
                    </DialogHeader>

                    {selectedId && selectedTable ? (
                        <div className="space-y-4 py-4">
                            <div className="space-y-1">
                                <label className="text-xs text-zinc-400">Nombre / Etiqueta</label>
                                <Input
                                    value={selectedTable.label}
                                    onChange={(e) => updateSelected('label', e.target.value)}
                                    className="bg-black border-zinc-700 focus-visible:ring-indigo-500"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-xs text-zinc-400">Tipo</label>
                                    <div className="flex bg-black rounded-lg p-1 border border-zinc-800">
                                        <button onClick={() => updateSelected('capacity', 4)} className={`flex-1 py-1 text-xs rounded ${selectedTable.capacity > 0 ? 'bg-zinc-800 text-white border border-zinc-700' : 'text-zinc-500'}`}>Mesa</button>
                                        <button onClick={() => updateSelected('capacity', 0)} className={`flex-1 py-1 text-xs rounded ${selectedTable.capacity === 0 ? 'bg-zinc-800 text-white border border-zinc-700' : 'text-zinc-500'}`}>Deco</button>
                                    </div>
                                </div>
                                {selectedTable.capacity > 0 && (
                                    <div className="space-y-1">
                                        <label className="text-xs text-zinc-400">Personas (Pax)</label>
                                        <Input
                                            type="number"
                                            value={selectedTable.capacity}
                                            onChange={(e) => updateSelected('capacity', parseInt(e.target.value))}
                                            className="bg-black border-zinc-700 text-center"
                                        />
                                    </div>
                                )}
                            </div>

                            {/* Paid Reservation Toggle */}
                            <div className="bg-black/50 p-3 rounded-lg border border-zinc-800 space-y-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <DollarSign className={`w-4 h-4 ${selectedTable.reservationPrice > 0 ? 'text-green-500' : 'text-zinc-500'}`} />
                                        <span className="text-sm font-medium text-zinc-300">Reserva Pagada</span>
                                    </div>
                                    <div
                                        onClick={() => updateSelected('reservationPrice', (selectedTable.reservationPrice || 0) > 0 ? 0 : 100)}
                                        className={`w-10 h-5 rounded-full relative cursor-pointer transition-colors ${selectedTable.reservationPrice > 0 ? 'bg-indigo-500' : 'bg-zinc-700'}`}
                                    >
                                        <div className={`w-3 h-3 bg-white rounded-full absolute top-1 transition-all ${selectedTable.reservationPrice > 0 ? 'left-6' : 'left-1'}`} />
                                    </div>
                                </div>

                                {selectedTable.reservationPrice > 0 && (
                                    <div className="animate-in slide-in-from-top-2">
                                        <label className="text-xs text-zinc-400 mb-1 block">Precio de Reserva (MXN)</label>
                                        <div className="relative">
                                            <span className="absolute left-3 top-2.5 text-zinc-500">$</span>
                                            <Input
                                                type="number"
                                                value={selectedTable.reservationPrice}
                                                onChange={(e) => updateSelected('reservationPrice', parseFloat(e.target.value))}
                                                className="pl-7 bg-zinc-900 border-zinc-700 border-indigo-500/50"
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Dimensions & Rotation */}
                            <div className="grid grid-cols-3 gap-3">
                                <div className="space-y-1">
                                    <label className="text-[10px] text-zinc-500 uppercase">Rotación</label>
                                    <div className="flex items-center gap-1">
                                        <Button variant="outline" size="icon" onClick={() => updateSelected('rotation', (selectedTable.rotation || 0) - 45)} className="h-8 w-8 border-zinc-700 bg-black hover:bg-zinc-900"><RotateCw className="w-3 h-3 -scale-x-100" /></Button>
                                        <div className="text-xs text-center flex-1">{selectedTable.rotation}°</div>
                                        <Button variant="outline" size="icon" onClick={() => updateSelected('rotation', (selectedTable.rotation || 0) + 45)} className="h-8 w-8 border-zinc-700 bg-black hover:bg-zinc-900"><RotateCw className="w-3 h-3" /></Button>
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] text-zinc-500 uppercase">Ancho</label>
                                    <Input type="number" value={selectedTable.width} onChange={(e) => updateSelected('width', parseInt(e.target.value))} className="h-8 bg-black border-zinc-700 text-center" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] text-zinc-500 uppercase">Alto</label>
                                    <Input type="number" value={selectedTable.height} onChange={(e) => updateSelected('height', parseInt(e.target.value))} className="h-8 bg-black border-zinc-700 text-center" />
                                </div>
                            </div>

                        </div>
                    ) : (
                        <div className="py-8 text-center text-zinc-500">No hay elemento seleccionado</div>
                    )}

                    <DialogFooter className="flex-row gap-2 justify-end sm:justify-end">
                        <Button variant="outline" onClick={duplicateSelected} className="border-zinc-700 text-zinc-300 hover:text-white hover:bg-zinc-800">
                            <Copy className="w-4 h-4 mr-2" /> Duplicar
                        </Button>
                        <Button onClick={() => setIsPropertiesModalOpen(false)} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                            Listo
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
