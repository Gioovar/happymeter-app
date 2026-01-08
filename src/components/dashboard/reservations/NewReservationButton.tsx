"use client"

import { useState } from "react"
import { CalendarDays } from "lucide-react"
import { CreateReservationDialog } from "./CreateReservationDialog"

interface NewReservationButtonProps {
    userProfile?: {
        name?: string
        email?: string
        phone?: string
    }
}

export function NewReservationButton({ userProfile }: NewReservationButtonProps) {
    const [isModalOpen, setIsModalOpen] = useState(false)

    return (
        <>
            <button
                onClick={() => setIsModalOpen(true)}
                className="bg-gradient-to-r from-amber-500 to-orange-600 px-6 py-2.5 rounded-xl font-semibold text-sm shadow-lg shadow-orange-900/20 hover:scale-105 transition-all text-white flex items-center gap-2"
            >
                <CalendarDays className="w-4 h-4" />
                Nueva Reserva
            </button>

            <CreateReservationDialog
                open={isModalOpen}
                onOpenChange={setIsModalOpen}
                userProfile={userProfile}
            />
        </>
    )
}
