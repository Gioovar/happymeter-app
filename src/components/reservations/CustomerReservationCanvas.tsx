"use client"

import { useState, useRef, useEffect, useMemo } from "react"
import { motion, AnimatePresence, useMotionValue } from "framer-motion"
import { Users, DollarSign, Calendar, ChevronLeft, Check } from "lucide-react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { SequentialDatePicker } from "@/components/ui/SequentialDatePicker"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { createReservation, getAvailableTables } from "@/actions/reservations"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface Table {
    id: string
    x: number
    y: number
    width?: number
    height?: number
    type: string
    rotation?: number
    label?: string
    capacity?: number
    points?: any
    reservationPrice?: number
    reservations?: any[]
}

interface CustomerReservationCanvasProps {
    floorPlans?: any[] // Support multiple floors
    floorPlan?: any // Legacy support
    businessName: string
    programId: string
    currentUser?: {
        name: string
        email?: string
        phone?: string
    }
}

export function CustomerReservationCanvas({ floorPlans, floorPlan: initialFloorPlan, businessName, currentUser, programId }: CustomerReservationCanvasProps) {
    const router = useRouter()

    // Resolve initial floor (prioritize array)
    const allFloors = floorPlans || (initialFloorPlan ? [initialFloorPlan] : [])
    const [activeFloorId, setActiveFloorId] = useState<string>(allFloors[0]?.id || "")

    // Get current active floor data
    const currentFloor = allFloors.find(f => f.id === activeFloorId) || allFloors[0] || { tables: [], width: 800 }

    const [selectedTables, setSelectedTables] = useState<Table[]>([])
    // New Flow States
    const [bookingStep, setBookingStep] = useState<'SEARCH' | 'SELECT' | 'CONFIRM'>('SEARCH')
    const [occupiedTableIds, setOccupiedTableIds] = useState<string[]>([])
    const [selectedTime, setSelectedTime] = useState("14:00") // Default time
    const [partySize, setPartySize] = useState(2)

    const [isConfirmOpen, setIsConfirmOpen] = useState(false)
    const [containerRef] = useState<any>({ current: null }) // Hack to fix ref type if needed, or keep original
    // actually let's keep original ref, just add new state
    const [selectedDate, setSelectedDate] = useState<Date>(new Date())
    const [isDatePickerOpen, setIsDatePickerOpen] = useState(false)
    const [isBooking, setIsBooking] = useState(false)
    const [customerForm, setCustomerForm] = useState({
        name: currentUser?.name || '',
        phone: currentUser?.phone || '',
        email: currentUser?.email || ''
    })
    const realContainerRef = useRef<HTMLDivElement>(null)

    // Motion Values for performant drag/zoom
    const x = useMotionValue(0)
    const y = useMotionValue(0)
    const scale = useMotionValue(1)

    // Auto-Crop Width: Calculate actual content width to prevent empty space
    const contentWidth = useMemo(() => {
        if (!currentFloor.tables?.length) return currentFloor.width || 800
        let max = 0
        currentFloor.tables.forEach((t: any) => max = Math.max(max, t.x + (t.width || 60)))
        return Math.max(max + 40, 350) // Padding + Min Width safety
    }, [currentFloor])

    // We also keep a state for scale just to trigger re-renders if needed for UI updates (like zoom buttons disabled state), 
    // but primarily we trust the motion value.
    // Actually, for simple zoom buttons, we can just read/set the motion value.
    // But to show "100%" or similar we might need state. Let's stick to motion values.

    // Pinch State
    const lastDist = useRef<number | null>(null)

    // Fit content logic
    useEffect(() => {
        if (!realContainerRef.current || !currentFloor.tables || currentFloor.tables.length === 0) return

        const fitContent = () => {
            if (!realContainerRef.current) return

            // 1. Simple Fit Width Logic (Match Editor)
            // We ignore "currentFloor.width" and use calculated "contentWidth" (Auto-Crop).
            const containerWidth = realContainerRef.current.clientWidth

            // Scale to fit content width
            const fitScale = containerWidth / contentWidth
            scale.set(fitScale)

            // 2. Reset Position to Top-Left (Native Scroll starts at top)
            // We don't need to offset X or Y because native scroll handles the viewport.
            // We just ensure the div is scaled from top-left.
            x.set(0)
            y.set(0)
        }

        fitContent()
        window.addEventListener('resize', fitContent)
        return () => window.removeEventListener('resize', fitContent)
    }, [currentFloor, contentWidth, x, y, scale])

    // Touch Handlers for Pinch Zoom (Updates Scale -> Updates Div Size -> Updates Native Scroll)
    const handleTouchStart = (e: React.TouchEvent) => {
        if (e.touches.length === 2) {
            const dist = Math.hypot(
                e.touches[0].clientX - e.touches[1].clientX,
                e.touches[0].clientY - e.touches[1].clientY
            )
            lastDist.current = dist
        }
    }

    const handleTouchMove = (e: React.TouchEvent) => {
        if (e.touches.length === 2 && lastDist.current !== null) {
            const dist = Math.hypot(
                e.touches[0].clientX - e.touches[1].clientX,
                e.touches[0].clientY - e.touches[1].clientY
            )
            // Calculate scale change
            const delta = dist / lastDist.current

            // Apply zoom with limits (0.3x to 4x)
            const currentScale = scale.get()
            const newScale = Math.min(Math.max(currentScale * delta, 0.3), 4)
            scale.set(newScale)
            lastDist.current = dist
        }
    }

    const handleTouchEnd = () => {
        lastDist.current = null
    }

    const zoomIn = () => scale.set(Math.min(scale.get() * 1.2, 4))
    const zoomOut = () => scale.set(Math.max(scale.get() / 1.2, 0.3))

    const handleTableClick = (table: Table) => {
        // Red = Reserved = Blocked
        if ((table.reservations?.length || 0) > 0) {
            toast.error("Mesa Ocupada", {
                description: "Esta mesa ya tiene una reservación para hoy.",
                duration: 2000
            })
            return
        }

        setSelectedTables(prev => {
            const isSelected = prev.find(t => t.id === table.id)
            if (isSelected) {
                return prev.filter(t => t.id !== table.id)
            } else {
                if (prev.length >= 3) {
                    toast.error("Límite alcanzado", {
                        description: "Solo puedes seleccionar hasta 3 mesas.",
                    })
                    return prev
                }
                return [...prev, table]
            }
        })
    }

    const totalCapacity = selectedTables.reduce((acc, t) => acc + (t.capacity || 4), 0)
    const totalPrice = selectedTables.reduce((acc, t) => acc + (t.reservationPrice || 0), 0)
    const tableLabels = selectedTables.map(t => t.label).join(", ")

    const confirmReservation = async () => {
        if (selectedTables.length === 0) return
        if (!customerForm.name) {
            toast.error("Faltan datos", { description: "Por favor ingresa tu nombre." })
            return
        }

        const combinedDate = new Date(selectedDate)
        const [hours, minutes] = selectedTime.split(':').map(Number)
        combinedDate.setHours(hours, minutes)

        setIsBooking(true)
        const bookingData = {
            reservations: selectedTables.map(t => ({
                tableId: t.id,
                date: combinedDate,
                partySize: t.capacity || 4
            })),
            customer: customerForm
        }

        const result = await createReservation(bookingData)
        setIsBooking(false)

        if (result.success) {
            toast.success("¡Reserva Confirmada!", {
                description: "Te esperamos. Hemos guardado tu lugar.",
                duration: 5000
            })
            setIsConfirmOpen(false)
            setSelectedTables([])
            setCustomerForm({ name: '', phone: '', email: '' })
        } else {
            toast.error("Error al reservar", {
                description: result.error || "Intenta de nuevo más tarde."
            })
        }
    }

    const handleSearch = async () => {
        // Basic validation
        if (!selectedDate || !selectedTime) return

        setIsBooking(true) // Re-use loading state
        const dateStr = selectedDate
        const result = await getAvailableTables(dateStr, selectedTime)

        if (result.success) {
            setOccupiedTableIds(result.occupiedTableIds || [])
            setBookingStep('SELECT')
        } else {
            toast.error("Error al buscar mesas", { description: "Intenta de nuevo." })
        }
        setIsBooking(false)
    }

    // New SEARCH STEP UI
    if (bookingStep === 'SEARCH') {
        return (
            <div className="h-[100dvh] bg-zinc-950 flex items-center justify-center p-4">
                <div className="w-full max-w-md bg-zinc-900 border border-white/10 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
                    {/* Background Glow */}
                    <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-indigo-500/20 to-transparent pointer-events-none" />

                    <div className="relative z-10 space-y-8">
                        <div className="text-center space-y-2">
                            <h1 className="text-2xl font-bold text-white">{businessName}</h1>
                            <p className="text-zinc-400 text-sm">Reserva tu experiencia</p>
                        </div>

                        <div className="space-y-6">
                            {/* Date Picker Trigger */}
                            <div className="space-y-2">
                                <Label className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Fecha</Label>
                                <button
                                    onClick={() => setIsDatePickerOpen(true)}
                                    className="w-full flex items-center justify-between p-4 bg-zinc-800/50 border border-white/5 rounded-2xl hover:bg-zinc-800 transition-colors text-left group"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center group-hover:bg-indigo-500/30 transition-colors">
                                            <Calendar className="w-5 h-5 text-indigo-400" />
                                        </div>
                                        <div>
                                            <p className="text-white font-medium text-lg">
                                                {selectedDate ? format(selectedDate, "EEE, d MMMM", { locale: es }) : "Seleccionar Fecha"}
                                            </p>
                                            <p className="text-zinc-500 text-xs">
                                                {selectedDate ? "Fecha seleccionada" : "Toca para elegir"}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-xs bg-white/5 px-2 py-1 rounded-md text-zinc-400">Cambiar</div>
                                </button>
                            </div>

                            {/* Time & Pax Row */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Hora</Label>
                                    <select
                                        value={selectedTime}
                                        onChange={(e) => setSelectedTime(e.target.value)}
                                        className="w-full h-14 bg-zinc-800/50 border border-white/5 rounded-2xl px-4 text-white font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/50 appearance-none"
                                    >
                                        {/* Generate slots every 30 mins from 13:00 to 22:00 */}
                                        {Array.from({ length: 19 }).map((_, i) => {
                                            const hour = Math.floor(i / 2) + 13
                                            const min = (i % 2) * 30
                                            const time = `${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`
                                            return <option key={time} value={time}>{time}</option>
                                        })}
                                    </select>
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Personas</Label>
                                    <div className="flex items-center h-14 bg-zinc-800/50 border border-white/5 rounded-2xl px-2">
                                        <button
                                            onClick={() => setPartySize(Math.max(1, partySize - 1))}
                                            className="w-10 h-full flex items-center justify-center text-zinc-400 hover:text-white text-xl"
                                        >-</button>
                                        <div className="flex-1 text-center font-bold text-white text-lg">{partySize}</div>
                                        <button
                                            onClick={() => setPartySize(Math.min(20, partySize + 1))}
                                            className="w-10 h-full flex items-center justify-center text-zinc-400 hover:text-white text-xl"
                                        >+</button>
                                    </div>
                                </div>
                            </div>

                            <Button
                                onClick={handleSearch}
                                disabled={isBooking}
                                className="w-full h-14 bg-white text-black hover:bg-zinc-200 rounded-2xl text-lg font-bold shadow-xl shadow-indigo-500/10 mt-4"
                            >
                                {isBooking ? "Buscando..." : "Buscar Mesas"}
                            </Button>
                        </div>
                    </div>

                    {/* Re-use Date Picker Dialog but detached from canvas */}
                    <Dialog open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
                        <DialogContent className="w-[95vw] max-w-[320px] p-0 bg-[#1a1a1a] border border-white/10 text-white shadow-2xl rounded-xl z-[60]">
                            <SequentialDatePicker
                                value={selectedDate}
                                onChange={(date) => {
                                    setSelectedDate(date)
                                    setIsDatePickerOpen(false)
                                }}
                                onClose={() => setIsDatePickerOpen(false)}
                                showYear={false}
                                includeTime={false} // Time is handled by select now
                            />
                        </DialogContent>
                    </Dialog>
                </div>
            </div>
        )
    }

    return (
        <div className="h-[100dvh] flex flex-col relative overflow-hidden bg-zinc-950 touch-none">
            {/* Header */}
            {/* Header & Floor Selector */}
            <div className="absolute top-0 left-0 right-0 z-50 flex flex-col items-center bg-gradient-to-b from-black/90 via-black/80 to-transparent pb-8 pointer-events-none">
                <div className="w-full p-4 flex items-center justify-between">
                    <button
                        onClick={() => setBookingStep('SEARCH')}
                        className="pointer-events-auto p-2 bg-white/10 backdrop-blur-md rounded-full text-white hover:bg-white/20 transition-colors flex items-center gap-2 px-4"
                    >
                        <ChevronLeft className="w-4 h-4" />
                        <span className="text-xs font-bold">Cambiar</span>
                    </button>
                    <div className="text-center pointer-events-auto">
                        <h1 className="text-lg font-bold text-white shadow-sm">{selectedTime}</h1>
                        <p className="text-xs text-zinc-400">
                            {selectedDate ? format(selectedDate, "EEE, d MMM", { locale: es }) : ""}
                        </p>
                    </div>
                    <div className="w-10" />
                </div>

                {/* Floor Selector (Visible if > 1 floor) */}
                {allFloors.length > 1 && (
                    <div className="flex gap-2 overflow-x-auto px-4 w-full justify-center pointer-events-auto no-scrollbar">
                        {allFloors.map((floor) => (
                            <button
                                key={floor.id}
                                onClick={() => setActiveFloorId(floor.id)}
                                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap
                                    ${activeFloorId === floor.id
                                        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30'
                                        : 'bg-zinc-800/80 text-zinc-400 hover:bg-zinc-700 hover:text-white border border-white/5'
                                    }
                                `}
                            >
                                {floor.name || `Piso ${allFloors.indexOf(floor) + 1}`}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Zoom Controls */}
            <div className="absolute bottom-6 right-6 z-50 flex flex-col gap-2 pointer-events-auto">
                <button onClick={zoomIn} className="p-3 bg-zinc-800 text-white rounded-full shadow-lg border border-white/10 hover:bg-zinc-700 active:scale-90 transition-transform">+</button>
                <button onClick={zoomOut} className="p-3 bg-zinc-800 text-white rounded-full shadow-lg border border-white/10 hover:bg-zinc-700 active:scale-90 transition-transform">-</button>
            </div>

            {/* Canvas Container */}
            <div
                ref={realContainerRef}
                // ENABLE NATIVE SCROLL (overflow-y-auto), HIDE SCROLLBAR
                // ADDED PT-32 to push content below the header
                className="flex-1 relative overflow-y-auto overflow-x-hidden bg-black scrollbar-hide [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none'] pt-32"
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
            >
                <motion.div
                    // REMOVED DRAG - Conflict with Native Scroll
                    className="relative overflow-visible mx-auto" // mx-auto centers it horizontally if width < container (zoomed out)
                    style={{
                        width: contentWidth, // Use Auto-Cropped Width
                        height: 2000, // Force large height to match Editor Infinite Scroll
                        scale, // X/Y controlled by native layout now (0,0)
                        originX: 0, originY: 0, // Scale from top-left
                        // Brand Light Effect
                        background: 'radial-gradient(circle at 50% 50%, rgba(99, 102, 241, 0.1) 0%, rgba(9, 9, 11, 0) 70%)',
                    }}
                >
                    {/* Subtle top light reflection */}
                    <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />

                    {/* Render Tables */}
                    {currentFloor.tables.map((table: Table) => {
                        // FIX: Only check occupiedTableIds (from search), ignore raw reservations which might be for other days
                        const isReserved = occupiedTableIds.includes(table.id)
                        const isSelected = selectedTables.some(t => t.id === table.id)
                        const isPaid = (table.reservationPrice || 0) > 0 && !isReserved

                        return (
                            <div
                                key={table.id}
                                onClick={() => handleTableClick(table)}
                                className={`absolute flex items-center justify-center transition-all duration-300 cursor-pointer 
                                    ${isSelected
                                        ? 'ring-4 ring-indigo-500 shadow-[0_0_30px_rgba(99,102,241,0.5)] z-20 scale-105'
                                        : isReserved ? '' : 'hover:scale-105 active:scale-95 hover:ring-2 hover:ring-white/50'
                                    }
                                `}
                                style={{
                                    left: table.x,
                                    top: table.y,
                                    width: table.width || 60,
                                    height: table.height || 60,
                                    transform: `rotate(${table.rotation || 0}deg)`,
                                    borderRadius: table.type === 'ROUND' ? '50%' : '12px',
                                    // Visual Status: Red (Reserved) > Indigo (Paid) > Zinc (Free)
                                    backgroundColor: isReserved
                                        ? 'rgba(127, 29, 29, 0.8)' // Red 900
                                        : isPaid ? '#4f46e5' : '#27272a',
                                    border: isReserved ? '1px solid rgba(248, 113, 113, 0.3)' : 'none',
                                    color: 'white'
                                }}
                            >
                                <div className="flex flex-col items-center justify-center text-center transform" style={{ transform: `rotate(-${table.rotation || 0}deg)` }}>
                                    <span className="text-[10px] font-bold opacity-80 truncate px-1 max-w-full">
                                        {table.label}
                                    </span>
                                    {isReserved ? (
                                        <div className="flex flex-col items-center mt-0.5">
                                            <span className="text-[7px] font-bold uppercase tracking-wider text-red-200 bg-red-950/80 px-1.5 py-0.5 rounded border border-red-500/20">Ocupada</span>
                                        </div>
                                    ) : (
                                        <>
                                            {table.capacity && (
                                                <div className="flex items-center gap-0.5 text-[8px] opacity-60">
                                                    <Users className="w-2.5 h-2.5" />
                                                    {table.capacity}
                                                </div>
                                            )}
                                            {isPaid && (
                                                <div className="absolute -top-3 -right-3 bg-green-500 text-black text-[8px] font-bold px-1.5 py-0.5 rounded-full shadow-sm flex items-center gap-0.5 border border-white/20">
                                                    <DollarSign className="w-2 h-2" />
                                                    {table.reservationPrice}
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>
                            </div>
                        )
                    })}
                </motion.div>
            </div>

            {/* Floating Action Bar */}
            <AnimatePresence>
                {selectedTables.length > 0 && !isConfirmOpen && (
                    <motion.div
                        initial={{ x: "-50%", y: 100, opacity: 0 }}
                        animate={{ x: "-50%", y: 0, opacity: 1 }}
                        exit={{ x: "-50%", y: 100, opacity: 0 }}
                        className="absolute bottom-6 left-1/2 z-[60] w-full max-w-xs px-4 pointer-events-auto"
                    >
                        <Button
                            className="w-full bg-white text-black hover:bg-zinc-200 rounded-full py-6 text-base font-bold shadow-2xl shadow-indigo-500/20"
                            onClick={() => setIsConfirmOpen(true)}
                        >
                            Confirmar {selectedTables.length} {selectedTables.length === 1 ? 'Mesa' : 'Mesas'}
                        </Button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Confirmation Drawer/Modal */}
            <AnimatePresence>
                {isConfirmOpen && selectedTables.length > 0 && (
                    <Dialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
                        <DialogContent className="max-w-sm rounded-[24px] border-zinc-800 bg-zinc-900 text-white">
                            <DialogHeader>
                                <DialogTitle>Confirmar Reserva</DialogTitle>
                                <DialogDescription className="text-zinc-400">
                                    Has seleccionado: <span className="text-white font-medium">{tableLabels}</span>
                                </DialogDescription>
                            </DialogHeader>

                            <div className="py-4 space-y-4">
                                {/* Customer Form */}
                                <div className="space-y-3 p-3 bg-zinc-800/50 rounded-xl border border-white/5">
                                    <div className="space-y-1">
                                        <Label className="text-xs text-zinc-400">Nombre Completo</Label>
                                        <Input
                                            placeholder="Tu nombre"
                                            className="bg-black/50 border-white/10 h-9"
                                            value={customerForm.name}
                                            onChange={(e) => setCustomerForm(prev => ({ ...prev, name: e.target.value }))}
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-xs text-zinc-400">Celular (Opcional)</Label>
                                        <Input
                                            placeholder="55 1234 5678"
                                            type="tel"
                                            className="bg-black/50 border-white/10 h-9"
                                            value={customerForm.phone}
                                            onChange={(e) => setCustomerForm(prev => ({ ...prev, phone: e.target.value }))}
                                        />
                                    </div>
                                </div>

                                <div className="flex items-center justify-between p-3 bg-zinc-800/50 rounded-xl">
                                    <div className="flex items-center gap-3">
                                        <Users className="w-5 h-5 text-zinc-400" />
                                        <div>
                                            <p className="text-sm font-medium">Total Personas</p>
                                            <p className="text-xs text-zinc-500">Capacidad máxima</p>
                                        </div>
                                    </div>
                                    <span className="text-sm font-bold">{totalCapacity}</span>
                                </div>

                                <button
                                    className="flex items-center justify-between p-3 bg-zinc-800/50 rounded-xl w-full hover:bg-zinc-800 transition"
                                    onClick={() => setIsDatePickerOpen(true)}
                                >
                                    <div className="flex items-center gap-3">
                                        <Calendar className="w-5 h-5 text-zinc-400" />
                                        <div className="text-left">
                                            <p className="text-sm font-medium text-white">Fecha y Hora</p>
                                            <p className="text-xs text-zinc-500">
                                                {format(selectedDate, "PPP p", { locale: es })}
                                            </p>
                                        </div>
                                    </div>
                                    <span className="text-xs bg-indigo-500/20 text-indigo-400 px-2 py-1 rounded-md">Editar</span>
                                </button>

                                {totalPrice > 0 && (
                                    <div className="flex items-center justify-between p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-xl">
                                        <div className="flex items-center gap-3">
                                            <DollarSign className="w-5 h-5 text-indigo-400" />
                                            <div>
                                                <p className="text-sm font-bold text-indigo-100">Costo Total</p>
                                                <p className="text-xs text-indigo-300">Reserva de {selectedTables.length} mesas</p>
                                            </div>
                                        </div>
                                        <span className="text-lg font-bold text-white">${totalPrice}</span>
                                    </div>
                                )}
                            </div>

                            <DialogFooter>
                                <Button
                                    className="w-full bg-white text-black hover:bg-zinc-200 rounded-xl py-6 text-base font-bold"
                                    onClick={confirmReservation}
                                    disabled={isBooking}
                                >
                                    {isBooking ? "Confirmando..." : "Confirmar Reserva"}
                                    {!isBooking && <Check className="w-4 h-4 ml-2" />}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                )}
            </AnimatePresence>

            {/* Date Picker Dialog */}
            <Dialog open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
                <DialogContent className="w-[95vw] max-w-[320px] p-0 bg-[#1a1a1a] border border-white/10 text-white shadow-2xl rounded-xl z-[60]">
                    <DialogTitle className="sr-only">Seleccionar fecha</DialogTitle>
                    <DialogDescription className="sr-only">Selecciona la fecha de tu reserva</DialogDescription>
                    <SequentialDatePicker
                        value={selectedDate}
                        onChange={(date) => setSelectedDate(date)}
                        onClose={() => setIsDatePickerOpen(false)}
                        showYear={false}
                        includeTime={true}
                    />
                </DialogContent>
            </Dialog>
        </div>
    )
}
