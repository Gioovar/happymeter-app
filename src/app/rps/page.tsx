'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowRight, Search, ShieldCheck, Sparkles, AlertCircle, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import Image from 'next/image'

export default function RpsLoginPortal() {
    const router = useRouter()
    const [slug, setSlug] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)

        const cleanSlug = slug.trim().toLowerCase().replace(/@/g, '')

        if (!cleanSlug) {
            setError("Por favor ingresa tu código de promotor.")
            return
        }

        setIsLoading(true)

        try {
            // Test if the portal exists
            const res = await fetch(`/api/promoters/${cleanSlug}/verify`)

            // Note: Since we don't have a direct "verify" API built specifically for this front-end yet,
            // we will simply redirect them and let the page itself handle the 404 naturally for now.
            router.push(`/rps/${cleanSlug}`)

        } catch (err: any) {
            console.error("Redirection error", err)
            setIsLoading(false)
            setError("Ocurrió un error de conexión.")
        }
    }

    return (
        <main className="min-h-screen bg-[#050505] text-white flex flex-col items-center justify-center p-6 relative overflow-hidden selection:bg-indigo-500/30">
            {/* Background Effects */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-indigo-500/10 blur-[120px] rounded-full pointer-events-none" />

            {/* Logo Header */}
            <div className="fixed top-8 left-8 flex items-center gap-2 z-50">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20 ring-1 ring-white/10">
                    <Sparkles className="w-4 h-4 text-white" />
                </div>
                <span className="font-black tracking-tight text-white hidden sm:block">Happy<span className="text-zinc-500">Meters</span> RPS</span>
            </div>

            <div className="w-full max-w-md relative z-10 space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
                {/* Hero section */}
                <div className="text-center space-y-4">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-medium text-zinc-300 mb-2 ring-1 ring-inset ring-white/5">
                        <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
                        Portal Exclusivo para Staff
                    </div>
                    <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-br from-white via-zinc-200 to-zinc-500">
                        Accede a tu panel
                    </h1>
                    <p className="text-zinc-500 text-sm sm:text-base max-w-[280px] mx-auto leading-relaxed">
                        Ingresa tu nombre de usuario para ver tus comisiones y descargar tu código QR personal.
                    </p>
                </div>

                {/* Form Card */}
                <Card className="bg-zinc-900/40 border-white/5 backdrop-blur-xl shadow-2xl relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <CardContent className="p-8 relative z-10">
                        <form onSubmit={handleSearch} className="space-y-6">

                            {error && (
                                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 animate-in fade-in zoom-in-95 duration-200">
                                    <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
                                    <p className="text-xs text-red-200 font-medium">{error}</p>
                                </div>
                            )}

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest ml-1">
                                    Código de Promotor
                                </label>
                                <div className="relative flex items-center">
                                    <div className="absolute left-4 text-zinc-500 font-bold select-none pointer-events-none">
                                        @
                                    </div>
                                    <Input
                                        type="text"
                                        placeholder="giovas"
                                        value={slug}
                                        onChange={(e) => setSlug(e.target.value)}
                                        className="h-14 pl-10 bg-black/50 border-white/10 text-white placeholder:text-zinc-600 focus:bg-black focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 rounded-2xl transition-all font-mono text-lg lowercase"
                                        autoComplete="off"
                                        spellCheck="false"
                                        disabled={isLoading}
                                    />
                                </div>
                            </div>

                            <Button
                                type="submit"
                                disabled={isLoading}
                                className="w-full h-14 bg-white hover:bg-zinc-200 text-black font-bold rounded-2xl text-[15px] shadow-[0_0_40px_rgba(255,255,255,0.1)] hover:shadow-[0_0_50px_rgba(255,255,255,0.2)] transition-all group/btn"
                            >
                                {isLoading ? (
                                    <div className="flex items-center gap-2">
                                        <div className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                                        <span>Buscando panel...</span>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2">
                                        <span>Ir a mi Panel</span>
                                        <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                                    </div>
                                )}
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                <div className="text-center">
                    <button className="text-xs text-zinc-500 hover:text-white transition-colors flex items-center justify-center gap-1 mx-auto underline decoration-zinc-800 underline-offset-4">
                        ¿Olvidaste tu código? Habla con soporte <ChevronRight className="w-3 h-3" />
                    </button>
                </div>
            </div>

            {/* Bottom branding */}
            <div className="absolute bottom-6 left-0 w-full text-center pointer-events-none">
                <p className="text-[10px] text-zinc-600 uppercase tracking-[0.2em] font-bold">
                    Powered by HappyMeter
                </p>
            </div>
        </main>
    )
}
