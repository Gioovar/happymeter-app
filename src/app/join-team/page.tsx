"use client"

import { useEffect, useState, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { acceptInvitation } from "@/actions/team"
import { Loader2 } from "lucide-react"
import { useAuth } from "@clerk/nextjs" // Client side auth check

function JoinTeamContent() {
    const searchParams = useSearchParams()
    const router = useRouter()
    const { isLoaded, userId, isSignedIn } = useAuth()
    const token = searchParams.get("token")
    const [status, setStatus] = useState("loading") // loading, error, success
    const [error, setError] = useState("")

    useEffect(() => {
        if (!isLoaded) return

        if (!isSignedIn) {
            // Redirect to sign in, return here
            const currentUrl = encodeURIComponent(window.location.href)
            router.push(`/sign-in?redirect_url=${currentUrl}`)
            return
        }

        if (!token) {
            setStatus("error")
            setError("Token de invitación no encontrado.")
            return
        }

        const processInvite = async () => {
            try {
                const res = await acceptInvitation(token)
                if (res.success) {
                    setStatus("success")
                    // Redirect based on role
                    if (res.role === 'OPERATOR') {
                        router.push("/ops/profile-setup") // Force profile setup first
                    } else {
                        router.push("/dashboard")
                    }
                } else {
                    setStatus("error")
                    setError(res.error || "Error al procesar la invitación.")
                }
            } catch (err) {
                setStatus("error")
                setError("Error de red o servidor.")
            }
        }

        processInvite()
    }, [isLoaded, isSignedIn, token, router])

    if (status === "loading") {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
                    <p className="text-slate-400">Procesando invitación...</p>
                </div>
            </div>
        )
    }

    if (status === "error") {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white p-4">
                <div className="bg-slate-900 border border-slate-800 p-8 rounded-2xl max-w-md text-center">
                    <h1 className="text-xl font-bold text-red-500 mb-2">Error de Invitación</h1>
                    <p className="text-slate-400 mb-6">{error}</p>
                    <button
                        onClick={() => router.push("/")}
                        className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm transition-colors"
                    >
                        Volver al Inicio
                    </button>
                </div>
            </div>
        )
    }

    return null
}

export default function JoinTeamPage() {
    return (
        <Suspense>
            <JoinTeamContent />
        </Suspense>
    )
}
