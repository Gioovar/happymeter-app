'use client'

import { useState } from 'react'
import { Loader2, CreditCard } from 'lucide-react'
import { toast } from 'sonner' // Assuming you have sonner or use your toast lib

export default function PortalButton() {
    const [isLoading, setIsLoading] = useState(false)

    const handlePortal = async () => {
        try {
            setIsLoading(true)
            const res = await fetch('/api/stripe/portal', {
                method: 'POST'
            })

            if (!res.ok) {
                // If 404, it means no subscription logic
                if (res.status === 404) {
                    toast.error('No tienes una suscripción activa para gestionar.')
                    return
                }
                throw new Error('Error connecting to portal')
            }

            const { url } = await res.json()
            window.location.href = url

        } catch (error) {
            console.error(error)
            toast.error('Error al abrir el portal de facturación.')
        } finally {
            setIsLoading(false)
        }
    }

    const handleSync = async () => {
        try {
            setIsLoading(true)
            const res = await fetch('/api/stripe/sync', { method: 'POST' })

            if (!res.ok) {
                const errMessage = await res.text()
                throw new Error(errMessage)
            }

            const data = await res.json()
            toast.success(`Suscripción sincronizada: ${data.plan}`)
            window.location.reload()
        } catch (error: any) {
            console.error(error)
            toast.error(`Error: ${error.message}`) // Show specific error
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="flex gap-2">
            <button
                onClick={handlePortal}
                disabled={isLoading}
                className="px-5 py-2.5 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl transition flex items-center gap-2 group border border-white/5"
            >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CreditCard className="w-4 h-4 text-violet-400 group-hover:text-white transition" />}
                Gestionar Pagos
            </button>

            <button
                onClick={handleSync}
                disabled={isLoading}
                className="px-5 py-2.5 bg-transparent hover:bg-white/5 text-gray-400 hover:text-white font-medium rounded-xl transition text-sm border border-white/10"
                title="Usar si el plan no se actualiza automáticamente"
            >
                ↻ Sincronizar
            </button>
        </div>
    )
}
