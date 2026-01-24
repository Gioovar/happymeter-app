// @ts-nocheck
"use client"

import { useState } from "react"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import dynamic from "next/dynamic"

// Dynamic import to avoid SSR issues with canvas/browser APIs
const CustomerReservationCanvas = dynamic(
    () => import("@/components/reservations/CustomerReservationCanvas").then(mod => mod.CustomerReservationCanvas),
    {
        ssr: false,
        loading: () => <div className="flex items-center justify-center h-[500px] text-zinc-500">Cargando mapa...</div>
    }
)

interface CreateReservationDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    userProfile?: {
        name?: string
        email?: string
        phone?: string
    }
    programId?: string
    floorPlans?: any[]
    businessName?: string
}

export function CreateReservationDialog({
    open,
    onOpenChange,
    userProfile,
    programId,
    floorPlans,
    businessName
}: CreateReservationDialogProps) {

    if (!programId || !floorPlans) {
        return (
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="bg-zinc-900 border-zinc-800 text-white">
                    <p>Faltan datos de configuración (Programa o Mapa).</p>
                </DialogContent>
            </Dialog>
        )
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            {/* Fullscreen-ish modal for the canvas */}
            <DialogContent className="max-w-[100vw] w-full h-[100dvh] md:h-[90vh] md:max-w-6xl p-0 bg-black border-zinc-800 text-white overflow-hidden rounded-none md:rounded-2xl">
                <CustomerReservationCanvas
                    floorPlans={floorPlans}
                    programId={programId}
                    businessName={businessName || "Reservación Manual"}
                    currentUser={userProfile}
                    className="h-full w-full"
                    isAdmin={true}
                />
            </DialogContent>
        </Dialog>
    )
}
