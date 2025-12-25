'use client'

import Link from 'next/link'
import { ArrowRight, CheckCircle2 } from 'lucide-react'
import ParticleBackground from './ParticleBackground'
import LandingAIChat from './LandingAIChat'

export default function Hero() {
    return (
        <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
            {/* Antigravity Background */}
            <div className="absolute inset-0 z-0">
                <ParticleBackground />
            </div>

            <div className="max-w-7xl mx-auto px-6 relative z-10 text-center pt-20">

                {/* Badge */}
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-sm font-medium text-violet-300 mb-8 backdrop-blur-sm animate-fade-in">
                    <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-violet-500"></span>
                    </span>
                    <span>La herramienta #1 para Feedback de Clientes</span>
                </div>

                {/* Main Headline */}
                <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold text-white tracking-tight mb-8 leading-tight">
                    Convierte Opiniones <br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-fuchsia-400">
                        en Crecimiento
                    </span>
                </h1>

                {/* Subheadline */}
                <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed">
                    HappyMeter te ayuda a recolectar feedback, analizar sentimientos con IA y retener clientes automáticamente. Sin código. Sin fricción.
                </p>

                {/* CTA Buttons */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
                    <Link href="/sign-up">
                        <button className="px-8 py-4 rounded-full bg-white text-black font-bold text-lg hover:scale-105 transition duration-300 flex items-center gap-2 shadow-[0_0_40px_-10px_rgba(255,255,255,0.3)]">
                            Empezar Gratis Ahora
                            <ArrowRight className="w-5 h-5" />
                        </button>
                    </Link>

                    <LandingAIChat />
                </div>

                {/* Social Proof / Trust Badges - HIDDEN until logos are provided
                <div className="flex flex-col items-center gap-4 text-sm text-gray-500">
                    <p>Más de 1,000 negocios confían en nosotros</p>
                    <div className="flex items-center gap-6 opacity-50 grayscale hover:grayscale-0 transition duration-500">
                        <span className="font-bold text-xl">ACME Corp</span>
                        <span className="font-bold text-xl">Stark Ind</span>
                        <span className="font-bold text-xl">Wayne Ent</span>
                        <span className="font-bold text-xl">Cyberdyne</span>
                    </div>
                </div>
                */}

                {/* Dashboard Preview (Floating) */}
                <div className="mt-20 relative mx-auto max-w-6xl perspective-1000">
                    {/* Glow Effect */}
                    <div className="absolute -inset-4 bg-gradient-to-r from-violet-600 to-fuchsia-600 rounded-3xl blur-3xl opacity-20" />

                    {/* Gradient Border & 3D Container */}
                    <div className="relative p-[1px] rounded-2xl bg-gradient-to-r from-violet-500 via-white/20 to-fuchsia-500 transform rotate-x-12 hover:rotate-x-0 transition duration-1000 ease-out shadow-2xl">
                        <div className="relative bg-[#0a0a0a] rounded-2xl overflow-hidden">
                            <img
                                src="/dashboard-real.png"
                                alt="HappyMeter Dashboard Real"
                                className="w-full h-auto"
                                onError={(e) => e.currentTarget.src = 'https://placehold.co/1200x800/111/444?text=Dashboard+Preview'}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}
