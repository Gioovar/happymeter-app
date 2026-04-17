"use client"

import { useFormStatus } from "react-dom"
import { CheckCircle2, XCircle, Loader2 } from "lucide-react"

interface ValidationButtonsProps {
    variant?: "ops" | "dashboard"
}

export function ValidationButtons({ variant = "ops" }: ValidationButtonsProps) {
    const { pending } = useFormStatus()

    if (variant === "dashboard") {
        return (
            <div className="flex gap-4">
                <button
                    type="submit"
                    name="status"
                    value="APPROVED"
                    disabled={pending}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                    {pending ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
                    Aprobar Tarea
                </button>
                <button
                    type="submit"
                    name="status"
                    value="REJECTED"
                    disabled={pending}
                    className="flex-1 bg-red-600 hover:bg-red-500 text-white py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                    {pending ? <Loader2 className="w-5 h-5 animate-spin" /> : <XCircle className="w-5 h-5" />}
                    Rechazar
                </button>
            </div>
        )
    }

    return (
        <div className="flex gap-3">
            <button
                type="submit"
                name="status"
                value="REJECTED"
                disabled={pending}
                className="flex-1 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-400 py-3.5 rounded-2xl font-bold transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed disabled:active:scale-100"
            >
                {pending ? <Loader2 className="w-5 h-5 animate-spin" /> : <XCircle className="w-5 h-5" />}
                Rechazar
            </button>
            <button
                type="submit"
                name="status"
                value="APPROVED"
                disabled={pending}
                className="flex-1 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-400 py-3.5 rounded-2xl font-bold transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed disabled:active:scale-100"
            >
                {pending ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
                Aprobar
            </button>
        </div>
    )
}
