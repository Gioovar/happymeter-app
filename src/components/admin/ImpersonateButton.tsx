'use client'

import { useState } from 'react'
import { LogIn, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface ImpersonateButtonProps {
    userId: string
    name: string
    type?: 'tenant' | 'creator'
}

export default function ImpersonateButton({ userId, name, type = 'tenant' }: ImpersonateButtonProps) {
    const [isLoading, setIsLoading] = useState(false)

    const handleImpersonate = async () => {
        try {
            setIsLoading(true)

            const targetPath = type === 'creator' ? '/creators/dashboard' : '/dashboard'
            const response = await fetch(`/api/admin/users/${userId}/impersonate?redirect_url=${encodeURIComponent(targetPath)}`, {
                method: 'POST'
            })

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}))
                if (response.status === 403) throw new Error('No tienes permisos de Super Admin')
                throw new Error(errorData.error || 'Error al generar token de acceso')
            }

            const data = await response.json()

            toast.success(`Entrando al dashboard de ${name}...`)

            // Redirect to the magic link
            window.location.href = data.url

        } catch (error) {
            console.error(error)
            toast.error(error instanceof Error ? error.message : 'Error desconocido')
            setIsLoading(false)
        }
    }

    return (
        <button
            onClick={handleImpersonate}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-red-600 to-red-800 hover:from-red-500 hover:to-red-700 text-white text-xs font-bold rounded-xl transition-all shadow-lg shadow-red-900/20 disabled:opacity-50 disabled:cursor-not-allowed"
        >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogIn className="w-4 h-4" />}
            {type === 'creator' ? 'Admin Panel Creator' : 'God Mode (Dashboard)'}
        </button>
    )
}
