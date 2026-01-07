"use client"

import { useState, useRef, useEffect } from "react"
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

            // 1. Calculate Bounding Box of Tables
            let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
            floorPlan.tables.forEach((t: Table) => {
                minX = Math.min(minX, t.x)
                minY = Math.min(minY, t.y)
                maxX = Math.max(maxX, t.x + (t.width || 60))
            })

            const PADDING = 40
            minX -= PADDING
            minY -= PADDING
            maxX += PADDING
            maxY += PADDING

            const contentWidth = maxX - minX
            const contentHeight = maxY - minY

            const containerWidth = containerRef.current.clientWidth
            const containerHeight = containerRef.current.clientHeight

            // 2. Calculate Scale
            const scaleX = containerWidth / contentWidth
            const scaleY = containerHeight / contentHeight

            // Mobile adjustment: Ensure at least 0.6x zoom so text/icons are readable
            let fitScale = Math.min(scaleX, scaleY, 1.5)
            if (containerWidth < 768) {
                fitScale = Math.max(fitScale, 0.6)
            }

            scale.set(fitScale)

            // 3. Calculate Centering Offset
            // We want the CENTER of the content to be at the CENTER of the container.
            // Currently, the map is centered by flexbox (justify-center items-center) based on its WIDTH/HEIGHT.
            // Map Center = (floorWidth/2, floorHeight/2).
            // Content Center = (minX + contentWidth/2, minY + contentHeight/2).

            const floorWidth = floorPlan.width || 800
            const floorHeight = floorPlan.height || 600

            const mapCenterX = floorWidth / 2
            const mapCenterY = floorHeight / 2

            const contentCenterX = minX + contentWidth / 2
            const contentCenterY = minY + contentHeight / 2

            // The vector to shift content to map center:
            // Delta = MapCenter - ContentCenter
            // If Content is at 100, Map is at 400. Delta = 300.
            // We need to move the map +300 (Right) so that 100 aligns with 400? 
            // Wait.
            // Visual Position = OriginalPosition + Offset.
            // We want VisualContentCenter = ScreenCenter.
            // Flexbox aligns MapCenter = ScreenCenter.
            // So we want VisualContentCenter = MapCenter (visually).
            // VisualContentCenter = ContentCenter + Offset.
            // MapCenter = ContentCenter + Offset
            // Offset = MapCenter - ContentCenter.
            // Correct.

            // Note: Framer motion applies 'scale' from the center by default (50% 50%).
            // So scaling doesn't shift the center point. We can safely calculate offset in unscaled coordinates?
            // Yes, because x/y translation happens alongside scaling. 
            // Wait, transform order matters. usually translate then scale or scale then translate.
            // Framer Motion: translate varies.
            // But usually 'x' and 'y' are pixels. Scaling happens around origin.
            // If origin is center, then (MapCenter) stays fixed during scale.
            // ContentCenter is (MapCenter - Delta).
            // If we move by +Delta, ContentCenter becomes MapCenter.
            // Scaling then happens around MapCenter (which is now ContentCenter). 
            // Perfect.

            // BUT: We need to scale the offset if the translation is applied *after* scale?
            // Standard CSS: transform: translate(tx, ty) scale(s).
            // If so, tx is in screen pixels (or element pixels?).
            // Usually, if we just set x/y, it shifts the element.

            // Let's assume x/y matches the coordinate system of the element BEFORE scale if using layout?
            // No, 'x' is typically translate-x.
            // Let's try applying (MapCenter - ContentCenter) * fitScale.
            // Actually, if we scale the whole div, the coordinate space scales.
            // Let's try raw delta first.

            const offsetX = (mapCenterX - contentCenterX) * fitScale
            const offsetY = (mapCenterY - contentCenterY) * fitScale

            x.set(offsetX)
            y.set(offsetY)
        }

        fitContent()
        // const observer = new ResizeObserver(fitContent) // Disable observer loops for now, just run on mount/floorPlan change
        // observer.observe(containerRef.current)
        // return () => observer.disconnect()
        window.addEventListener('resize', fitContent)
        return () => window.removeEventListener('resize', fitContent)
    }, [floorPlan, x, y, scale])

    // Touch Handlers for Pinch Zoom
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

            {/* Zoom Controls (Optional, user asked for pinch but buttons are good fallback) */}
            <div className="absolute bottom-6 right-6 z-50 flex flex-col gap-2 pointer-events-auto">
                <button onClick={zoomIn} className="p-3 bg-zinc-800 text-white rounded-full shadow-lg border border-white/10 hover:bg-zinc-700 active:scale-90 transition-transform">+</button>
                <button onClick={zoomOut} className="p-3 bg-zinc-800 text-white rounded-full shadow-lg border border-white/10 hover:bg-zinc-700 active:scale-90 transition-transform">-</button>
            </div>

            {/* Canvas Container */}
            <div
                ref={containerRef}
                className="flex-1 flex items-center justify-center relative overflow-hidden cursor-move touch-none bg-[#101014]"
                style={{
                    backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.05) 1px, transparent 0)',
                    backgroundSize: '20px 20px'
                }}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
            >
                <motion.div
                    drag
                    dragElastic={0.1}
                    dragMomentum={false}
                    className="relative bg-zinc-900/50 rounded-3xl border border-white/5 shadow-2xl"
                    style={{
                        width: floorPlan.width || 800,
                        height: floorPlan.height || 600,
                        x, y, scale // Bind motion values
                    }}
                >
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
