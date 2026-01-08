"use client"

import { useState, useRef, useEffect, useMemo } from "react"
import { motion, AnimatePresence, useMotionValue } from "framer-motion"
import { Users, DollarSign, Calendar, ChevronLeft, Check } from "lucide-react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

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
    floorPlan: any
    businessName: string
    programId: string
}

export function CustomerReservationCanvas({ floorPlan, businessName, programId }: CustomerReservationCanvasProps) {
    const router = useRouter()
    const [selectedTable, setSelectedTable] = useState<Table | null>(null)
    const [isConfirmOpen, setIsConfirmOpen] = useState(false)
    const containerRef = useRef<HTMLDivElement>(null)

    // Motion Values for performant drag/zoom
    const x = useMotionValue(0)
    const y = useMotionValue(0)
    const scale = useMotionValue(1)

    // Auto-Crop Width: Calculate actual content width to prevent empty space
    const contentWidth = useMemo(() => {
        if (!floorPlan.tables?.length) return floorPlan.width || 800
        let max = 0
        floorPlan.tables.forEach((t: any) => max = Math.max(max, t.x + (t.width || 60)))
        return Math.max(max + 40, 350) // Padding + Min Width safety
    }, [floorPlan])

    // We also keep a state for scale just to trigger re-renders if needed for UI updates (like zoom buttons disabled state), 
    // but primarily we trust the motion value.
    // Actually, for simple zoom buttons, we can just read/set the motion value.
    // But to show "100%" or similar we might need state. Let's stick to motion values.

    // Pinch State
    const lastDist = useRef<number | null>(null)

    // Fit content logic
    useEffect(() => {
        if (!containerRef.current || !floorPlan.tables || floorPlan.tables.length === 0) return

        const fitContent = () => {
            if (!containerRef.current) return

            // 1. Simple Fit Width Logic (Match Editor)
            // We ignore "floorPlan.width" and use calculated "contentWidth" (Auto-Crop).
            const containerWidth = containerRef.current.clientWidth

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
    }, [floorPlan, contentWidth, x, y, scale])

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

        setSelectedTable(table)
        setIsConfirmOpen(true)
    }

    const confirmReservation = () => {
        // Placeholder for booking logic
        toast.success("¡Mesa seleccionada!", {
            description: "En el futuro aquí te pediremos pago o confirmación final."
        })
        setIsConfirmOpen(false)
    }

    return (
        <div className="h-[100dvh] flex flex-col relative overflow-hidden bg-zinc-950 touch-none">
            {/* Header */}
            <div className="absolute top-0 left-0 right-0 p-4 z-50 flex items-center justify-between bg-gradient-to-b from-black/80 to-transparent pointer-events-none">
                <button
                    onClick={() => router.back()}
                    className="pointer-events-auto p-2 bg-white/10 backdrop-blur-md rounded-full text-white hover:bg-white/20 transition-colors"
                >
                    <ChevronLeft className="w-6 h-6" />
                </button>
                <div className="text-center pointer-events-auto">
                    <h1 className="text-lg font-bold text-white shadow-sm">{businessName}</h1>
                    <p className="text-xs text-zinc-400">Selecciona tu mesa</p>
                </div>
                <div className="w-10" />
            </div>

            {/* Zoom Controls */}
            <div className="absolute bottom-6 right-6 z-50 flex flex-col gap-2 pointer-events-auto">
                <button onClick={zoomIn} className="p-3 bg-zinc-800 text-white rounded-full shadow-lg border border-white/10 hover:bg-zinc-700 active:scale-90 transition-transform">+</button>
                <button onClick={zoomOut} className="p-3 bg-zinc-800 text-white rounded-full shadow-lg border border-white/10 hover:bg-zinc-700 active:scale-90 transition-transform">-</button>
            </div>

            {/* Canvas Container */}
            <div
                ref={containerRef}
                // ENABLE NATIVE SCROLL (overflow-y-auto), HIDE SCROLLBAR
                className="flex-1 relative overflow-y-auto overflow-x-hidden bg-black scrollbar-hide [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']"
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
                    {floorPlan.tables.map((table: Table) => {
                        const isReserved = (table.reservations?.length || 0) > 0
                        const isPaid = (table.reservationPrice || 0) > 0 && !isReserved

                        return (
                            <div
                                key={table.id}
                                onClick={() => handleTableClick(table)}
                                className={`absolute flex items-center justify-center transition-all duration-300 cursor-pointer 
                                    ${selectedTable?.id === table.id
                                        ? 'ring-4 ring-indigo-500 shadow-[0_0_30px_rgba(99,102,241,0.5)] z-20'
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

            {/* Confirmation Drawer/Modal */}
            <AnimatePresence>
                {selectedTable && isConfirmOpen && (
                    <Dialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
                        <DialogContent className="max-w-sm rounded-[24px] border-zinc-800 bg-zinc-900 text-white">
                            <DialogHeader>
                                <DialogTitle>{selectedTable.label || "Mesa seleccionada"}</DialogTitle>
                                <DialogDescription className="text-zinc-400">
                                    Confirma los detalles de tu reserva.
                                </DialogDescription>
                            </DialogHeader>

                            <div className="py-4 space-y-4">
                                <div className="flex items-center justify-between p-3 bg-zinc-800/50 rounded-xl">
                                    <div className="flex items-center gap-3">
                                        <Users className="w-5 h-5 text-zinc-400" />
                                        <div>
                                            <p className="text-sm font-medium">Personas</p>
                                            <p className="text-xs text-zinc-500">Máximo {selectedTable.capacity || 4}</p>
                                        </div>
                                    </div>
                                    <span className="text-sm font-bold">{selectedTable.capacity || 4}</span>
                                </div>

                                <div className="flex items-center justify-between p-3 bg-zinc-800/50 rounded-xl">
                                    <div className="flex items-center gap-3">
                                        <Calendar className="w-5 h-5 text-zinc-400" />
                                        <div>
                                            <p className="text-sm font-medium">Fecha</p>
                                            <p className="text-xs text-zinc-500">Hoy, lo antes posible</p>
                                        </div>
                                    </div>
                                    <span className="text-xs bg-indigo-500/20 text-indigo-400 px-2 py-1 rounded-md">Hoy</span>
                                </div>

                                {(selectedTable.reservationPrice || 0) > 0 && (
                                    <div className="flex items-center justify-between p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-xl">
                                        <div className="flex items-center gap-3">
                                            <DollarSign className="w-5 h-5 text-indigo-400" />
                                            <div>
                                                <p className="text-sm font-bold text-indigo-100">Costo de Reserva</p>
                                                <p className="text-xs text-indigo-300">Se cobra al confirmar</p>
                                            </div>
                                        </div>
                                        <span className="text-lg font-bold text-white">${selectedTable.reservationPrice}</span>
                                    </div>
                                )}
                            </div>

                            <DialogFooter>
                                <Button className="w-full bg-white text-black hover:bg-zinc-200 rounded-xl py-6 text-base font-bold" onClick={confirmReservation}>
                                    Confirmar Reserva <Check className="w-4 h-4 ml-2" />
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                )}
            </AnimatePresence>
        </div>
    )
}
