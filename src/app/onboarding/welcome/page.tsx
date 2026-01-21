'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowRight, Sparkles, Building2, Store, Rocket } from 'lucide-react'
import BrandLogo from '@/components/BrandLogo'
import { Button } from '@/components/ui/button'

export default function WelcomePage() {
    const router = useRouter()
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col items-center justify-center relative overflow-hidden p-6">

            {/* Background Effects */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-violet-600/20 blur-[120px] rounded-full mix-blend-screen animate-pulse" />
                <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-fuchsia-600/20 blur-[120px] rounded-full mix-blend-screen animate-pulse delay-1000" />
            </div>

            <div className={`max-w-2xl w-full text-center z-10 space-y-8 transition-all duration-1000 transform ${mounted ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>

                <div className="flex justify-center mb-8">
                    <BrandLogo size="xl" />
                </div>

                <div className="space-y-4">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-sm font-medium text-violet-300">
                        <Sparkles className="w-4 h-4" />
                        <span>¡Bienvenido a la revolución!</span>
                    </div>

                    <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
                        Vamos a configurar tu <br />
                        <span className="bg-clip-text text-transparent bg-gradient-to-r from-violet-500 via-fuchsia-500 to-white">
                            Negocio Exitoso
                        </span>
                    </h1>

                    <p className="text-lg md:text-xl text-gray-400 max-w-xl mx-auto leading-relaxed">
                        Estás a unos pasos de transformar la experiencia de tus clientes.
                        Configura tu perfil comercial para activar todas las herramientas.
                    </p>
                </div>

                {/* Features Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left mt-8">
                    <div className="bg-[#111] p-6 rounded-2xl border border-white/5 hover:border-violet-500/30 transition-colors group">
                        <div className="w-10 h-10 rounded-full bg-violet-500/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                            <Store className="w-5 h-5 text-violet-400" />
                        </div>
                        <h3 className="font-bold mb-1">Identidad</h3>
                        <p className="text-xs text-gray-500">Personaliza tu marca para que tus clientes te reconozcan.</p>
                    </div>
                    <div className="bg-[#111] p-6 rounded-2xl border border-white/5 hover:border-violet-500/30 transition-colors group">
                        <div className="w-10 h-10 rounded-full bg-fuchsia-500/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                            <Rocket className="w-5 h-5 text-fuchsia-400" />
                        </div>
                        <h3 className="font-bold mb-1">Activación</h3>
                        <p className="text-xs text-gray-500">Habilita encuestas, recompensas y herramientas IA.</p>
                    </div>
                    <div className="bg-[#111] p-6 rounded-2xl border border-white/5 hover:border-violet-500/30 transition-colors group">
                        <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                            <Building2 className="w-5 h-5 text-green-400" />
                        </div>
                        <h3 className="font-bold mb-1">Crecimiento</h3>
                        <p className="text-xs text-gray-500">Empieza a medir y mejorar tus resultados hoy mismo.</p>
                    </div>
                </div>

                <div className="pt-8">
                    <Button
                        size="lg"
                        className="bg-white text-black hover:bg-gray-200 text-lg font-bold px-8 py-6 h-auto rounded-full shadow-[0_0_20px_rgba(255,255,255,0.3)] hover:shadow-[0_0_30px_rgba(255,255,255,0.5)] transition-all group"
                        onClick={() => router.push('/onboarding/create')}
                    >
                        Configurar mi Negocio
                        <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                    </Button>
                    <p className="text-xs text-gray-600 mt-4">
                        Solo tomará 2 minutos
                    </p>
                </div>

            </div>
        </div>
    )
}
