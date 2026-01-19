'use client'

import { Check, Sparkles } from 'lucide-react'
import Link from 'next/link'

export default function PricingTeaser() {
    return (
        <section className="py-24 bg-[#0a0a0a] border-t border-white/5">
            <div className="max-w-7xl mx-auto px-6">
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">Inversión transparente</h2>
                    <p className="text-gray-400 text-lg">Sin contratos forzosos. Cancela cuando quieras.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">

                    {/* Starter Tier */}
                    <div className="p-8 rounded-3xl bg-[#111] border border-white/5 flex flex-col hover:border-white/10 transition duration-300">
                        <div className="mb-6">
                            <h3 className="text-xl font-bold text-white mb-2">Starter Test</h3>
                            <div className="flex items-baseline gap-1">
                                <span className="text-4xl font-bold text-white">$0</span>
                            </div>
                            <p className="text-gray-500 text-sm mt-2">Prueba el poder de HappyMeter por 7 días.</p>
                        </div>
                        <p className="text-violet-400 text-xs font-bold uppercase mb-4 tracking-wide">Incluye todo lo de Growth:</p>
                        <ul className="space-y-4 mb-8 flex-1">
                            <li className="flex items-center gap-3 text-gray-300 text-sm">
                                <Check className="w-4 h-4 text-violet-500 flex-shrink-0" /> Acceso Total (7 días)
                            </li>
                            <li className="flex items-center gap-3 text-gray-300 text-sm">
                                <Check className="w-4 h-4 text-violet-500 flex-shrink-0" /> Max 50 respuestas
                            </li>
                            <li className="flex items-center gap-3 text-gray-300 text-sm">
                                <Check className="w-4 h-4 text-violet-500 flex-shrink-0" /> 1 Programa de Lealtad
                            </li>
                            <li className="flex items-center gap-3 text-gray-300 text-sm">
                                <Check className="w-4 h-4 text-violet-500 flex-shrink-0" /> 1 Flujo de Supervisión
                            </li>
                            <li className="flex items-center gap-3 text-gray-300 text-sm">
                                <Check className="w-4 h-4 text-violet-500 flex-shrink-0" /> Catálogo de Juegos
                            </li>
                            <li className="flex items-center gap-3 text-gray-300 text-sm">
                                <Check className="w-4 h-4 text-violet-500 flex-shrink-0" /> Alertas en Vivo
                            </li>
                        </ul>
                        <Link href="/sign-up">
                            <button className="w-full py-3 rounded-xl bg-white/5 text-white font-bold hover:bg-white/10 transition border border-white/10">
                                Comenzar Prueba
                            </button>
                        </Link>
                    </div>

                    {/* Growth Tier (Highlighted) */}
                    <div className="relative p-8 rounded-3xl bg-[#1a1a1a] border border-violet-500 flex flex-col shadow-2xl shadow-violet-500/10 scale-105 z-10">
                        <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wider shadow-lg">
                            Recomendado
                        </div>
                        <div className="mb-6">
                            <h3 className="text-xl font-bold text-white mb-2">Growth 1K</h3>
                            <div className="flex items-baseline gap-1">
                                <span className="text-5xl font-bold text-white tracking-tight">$24</span>
                                <span className="text-gray-400 text-sm">/mes</span>
                            </div>
                            <p className="text-violet-300 text-xs mt-1 font-medium">Facturado $290 anual</p>
                            <p className="text-gray-400 text-sm mt-4">Para negocios individuales que quieren vender más.</p>
                        </div>
                        <ul className="space-y-4 mb-8 flex-1">
                            <li className="flex items-center gap-3 text-white font-medium text-sm">
                                <div className="p-1 rounded-full bg-violet-500/20 text-violet-400 shrink-0"><Check className="w-3 h-3" /></div>
                                1 Encuesta Activa
                            </li>
                            <li className="flex items-center gap-3 text-white font-medium text-sm">
                                <div className="p-1 rounded-full bg-violet-500/20 text-violet-400 shrink-0"><Check className="w-3 h-3" /></div>
                                1,000 Respuestas/mes
                            </li>
                            <li className="flex items-center gap-3 text-white font-medium text-sm">
                                <div className="p-1 rounded-full bg-violet-500/20 text-violet-400 shrink-0"><Sparkles className="w-3 h-3" /></div>
                                Recuperación de Clientes (IA)
                            </li>
                            <li className="flex items-center gap-3 text-white font-medium text-sm">
                                <div className="p-1 rounded-full bg-violet-500/20 text-violet-400 shrink-0"><Check className="w-3 h-3" /></div>
                                Alertas Crisis Staff
                            </li>
                            <li className="flex items-center gap-3 text-white font-medium text-sm">
                                <div className="p-1 rounded-full bg-violet-500/20 text-violet-400 shrink-0"><Check className="w-3 h-3" /></div>
                                Catálogo de Juegos (Dados/Cartas)
                            </li>
                        </ul>
                        <Link href="/pricing?checkout=true&plan=GROWTH&interval=month">
                            <button className="w-full py-3.5 rounded-xl bg-violet-600 text-white font-bold hover:bg-violet-500 transition shadow-lg shadow-violet-600/20">
                                Elegir Growth
                            </button>
                        </Link>
                    </div>

                    {/* Power Tier */}
                    <div className="p-8 rounded-3xl bg-[#111] border border-blue-500/30 flex flex-col hover:border-blue-500/50 transition duration-300">
                        <div className="mb-6">
                            <h3 className="text-xl font-bold text-white mb-2">Power 3X</h3>
                            <div className="flex items-baseline gap-1">
                                <span className="text-4xl font-bold text-white">$66</span>
                                <span className="text-gray-500 text-sm">/mes</span>
                            </div>
                            <p className="text-blue-400 text-xs mt-1 font-medium">Facturado $790 anual</p>
                            <p className="text-gray-500 text-sm mt-4">Automatización total para PyMEs en expansión.</p>
                        </div>
                        <ul className="space-y-4 mb-8 flex-1">
                            <li className="flex items-center gap-3 text-gray-300 text-sm">
                                <Check className="w-4 h-4 text-blue-500 flex-shrink-0" /> 3 Encuestas Activas
                            </li>
                            <li className="flex items-center gap-3 text-gray-300 text-sm">
                                <Check className="w-4 h-4 text-blue-500 flex-shrink-0" /> Respuestas Ilimitadas
                            </li>
                            <li className="flex items-center gap-3 text-gray-300 text-sm">
                                <Check className="w-4 h-4 text-blue-500 flex-shrink-0" /> Chat con Analista IA
                            </li>
                            <li className="flex items-center gap-3 text-gray-300 text-sm">
                                <Check className="w-4 h-4 text-blue-500 flex-shrink-0" /> Campañas WhatsApp
                            </li>
                            <li className="flex items-center gap-3 text-gray-300 text-sm">
                                <Check className="w-4 h-4 text-blue-500 flex-shrink-0" /> Juegos Premium (Ruleta/Raspa)
                            </li>
                        </ul>
                        <Link href="/pricing?checkout=true&plan=POWER&interval=month">
                            <button className="w-full py-3 rounded-xl bg-white/5 text-white font-bold hover:bg-white/10 transition border border-white/10">
                                Elegir Power
                            </button>
                        </Link>
                    </div>

                </div>

                <div className="mt-12 text-center">
                    <Link href="/pricing" className="text-violet-400 hover:text-white transition underline text-sm">
                        Ver comparación detallada de planes
                    </Link>
                </div>
            </div>
        </section>
    )
}
