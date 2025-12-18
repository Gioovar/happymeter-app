'use client'

import { useEffect } from 'react'
import { AlertCircle, RefreshCw } from 'lucide-react'

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    useEffect(() => {
        // Log the error to an error reporting service
        console.error(error)
    }, [error])

    return (
        <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center p-4 relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-red-600/20 blur-[120px] rounded-full pointer-events-none" />

            <div className="relative z-10 text-center space-y-6 max-w-lg">
                <div className="mx-auto w-24 h-24 bg-red-500/10 border border-red-500/20 rounded-full flex items-center justify-center mb-6 animate-pulse">
                    <AlertCircle className="w-10 h-10 text-red-500" />
                </div>

                <h1 className="text-4xl font-black text-white tracking-tight">Ups, algo salió mal</h1>
                <p className="text-gray-500 text-lg leading-relaxed">
                    Hemos detectado un error inesperado en el sistema. Nuestro equipo ha sido notificado.
                </p>

                <div className="pt-6">
                    <button
                        onClick={reset}
                        className="inline-flex items-center gap-2 px-8 py-3 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl transition-colors shadow-lg shadow-red-600/20"
                    >
                        <RefreshCw className="w-4 h-4" />
                        <span>Intentar de nuevo</span>
                    </button>
                </div>

                {error.digest && (
                    <p className="text-xs text-gray-700 font-mono mt-8">Error ID: {error.digest}</p>
                )}
            </div>
        </div>
    )
}
