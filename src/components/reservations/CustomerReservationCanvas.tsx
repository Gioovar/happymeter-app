"use client"

import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
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
    const [scale, setScale] = useState(1)

    // Fit canvas to screen logic
    useEffect(() => {
        if (!containerRef.current) return
        const updateScale = () => {
            if (!containerRef.current) return
            const containerWidth = containerRef.current.clientWidth
            const containerHeight = containerRef.current.clientHeight

            // Allow some padding
            const availableWidth = containerWidth - 32
            const availableHeight = containerHeight - 160 // Reserve space for header/footer

            const floorWidth = floorPlan.width || 800
            const floorHeight = floorPlan.height || 600

            const scaleX = availableWidth / floorWidth
            const scaleY = availableHeight / floorHeight
            const newScale = Math.min(scaleX, scaleY, 1.2) // Cap at 1.2x

            setScale(newScale)
        }

        updateScale()
        window.addEventListener('resize', updateScale)
        return () => window.removeEventListener('resize', updateScale)
    }, [floorPlan])

    const handleTableClick = (table: Table) => {
        // Simple logic: if has paid price or not, just select
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
        <div className="h-screen flex flex-col relative overflow-hidden bg-zinc-950">
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
                <div className="w-10" /> {/* Spacer */}
            </div>

            {/* Canvas Container */}
            <div
                ref={containerRef}
                className="flex-1 flex items-center justify-center relative overflow-hidden cursor-move touch-none"
            >
                <motion.div
                    className="relative bg-zinc-900/50 rounded-3xl border border-white/5 shadow-2xl"
                    style={{
                        width: floorPlan.width || 800,
                        height: floorPlan.height || 600,
                        scale: scale,
                        transformOrigin: 'center center'
                    }}
                >
                    {/* Render Tables */}
                    {floorPlan.tables.map((table: Table) => {
                        const isPaid = (table.reservationPrice || 0) > 0

                        return (
                            <div
                                key={table.id}
                                onClick={() => handleTableClick(table)}
                                className={`absolute flex items-center justify-center transition-all duration-300 cursor-pointer hover:scale-105 active:scale-95
                                    ${selectedTable?.id === table.id
                                        ? 'ring-4 ring-indigo-500 shadow-[0_0_30px_rgba(99,102,241,0.5)] z-20'
                                        : 'hover:ring-2 hover:ring-white/50'
                                    }
                                `}
                                style={{
                                    left: table.x,
                                    top: table.y,
                                    width: table.width || 60,
                                    height: table.height || 60,
                                    transform: `rotate(${table.rotation || 0}deg)`,
                                    borderRadius: table.type === 'ROUND' ? '50%' : '12px',
                                    backgroundColor: isPaid ? '#4f46e5' : '#27272a', // Indigo for paid, Zinc for free
                                    color: 'white'
                                }}
                            >
                                <div className="flex flex-col items-center justify-center text-center transform" style={{ transform: `rotate(-${table.rotation || 0}deg)` }}>
                                    <span className="text-[10px] font-bold opacity-80 truncate px-1 max-w-full">
                                        {table.label}
                                    </span>
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
