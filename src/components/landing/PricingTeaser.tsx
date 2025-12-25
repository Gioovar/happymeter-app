'use client'

import { Check } from 'lucide-react'
import Link from 'next/link'

export default function PricingTeaser() {
    return (
        <section className="py-24 bg-[#0a0a0a] border-t border-white/5">
            <div className="max-w-7xl mx-auto px-6">
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">Inversión transparente</h2>
                    <p className="text-gray-400 text-lg">Sin contratos forzosos. Cancela cuando quieras.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">

                    {/* Free Tier */}
                    <div className="p-8 rounded-3xl bg-[#111] border border-white/5 flex flex-col hover:border-white/10 transition duration-300">
                        <div className="mb-6">
                            <h3 className="text-xl font-bold text-white mb-2">Starter</h3>
                            <div className="flex items-baseline gap-1">
                                <span className="text-4xl font-bold text-white">$0</span>
                                <span className="text-gray-500">/mes</span>
                            </div>
                            <p className="text-gray-500 text-sm mt-2">Para pequeños negocios que empiezan.</p>
                        </div>
                        <ul className="space-y-4 mb-8 flex-1">
                            <li className="flex items-center gap-3 text-gray-300">
                                <Check className="w-4 h-4 text-violet-500" /> 50 Feedbacks/mes
                            </li>
                            <li className="flex items-center gap-3 text-gray-300">
                                <Check className="w-4 h-4 text-violet-500" /> Reportes Básicos
                            </li>
                            <li className="flex items-center gap-3 text-gray-300">
                                <Check className="w-4 h-4 text-violet-500" /> 1 Sede
                            </li>
                        </ul>
                        <Link href="/sign-up">
                            <button className="w-full py-3 rounded-xl bg-white/5 text-white font-bold hover:bg-white/10 transition border border-white/10">
                                Empezar Gratis
                            </button>
                        </Link>
                    </div>

                    {/* Pro Tier (Highlighted) */}
                    <div className="relative p-8 rounded-3xl bg-[#1a1a1a] border border-violet-500/30 flex flex-col shadow-2xl scale-105 z-10">
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-violet-500 text-white px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                            Más Popular
                        </div>
                        <div className="mb-6">
                            <h3 className="text-xl font-bold text-white mb-2">Pro Growth</h3>
                            <div className="flex items-baseline gap-1">
                                <span className="text-4xl font-bold text-white">$29</span>
                                <span className="text-gray-500">/mes</span>
                            </div>
                            <p className="text-violet-300 text-sm mt-2">Para negocios que quieren escalar.</p>
                        </div>
                        <ul className="space-y-4 mb-8 flex-1">
                            <li className="flex items-center gap-3 text-white font-medium">
                                <div className="p-1 rounded-full bg-violet-500/20 text-violet-400"><Check className="w-3 h-3" /></div>
                                Feedbacks Ilimitados
                            </li>
                            <li className="flex items-center gap-3 text-white font-medium">
                                <div className="p-1 rounded-full bg-violet-500/20 text-violet-400"><Check className="w-3 h-3" /></div>
                                Análisis de Sentimiento IA
                            </li>
                            <li className="flex items-center gap-3 text-white font-medium">
                                <div className="p-1 rounded-full bg-violet-500/20 text-violet-400"><Check className="w-3 h-3" /></div>
                                Alertas WhatsApp
                            </li>
                            <li className="flex items-center gap-3 text-white font-medium">
                                <div className="p-1 rounded-full bg-violet-500/20 text-violet-400"><Check className="w-3 h-3" /></div>
                                Ranking de Empleados
                            </li>
                        </ul>
                        <Link href="/sign-up?plan=pro">
                            <button className="w-full py-3 rounded-xl bg-violet-600 text-white font-bold hover:bg-violet-500 transition shadow-lg shadow-violet-500/20">
                                Probar 14 días Gratis
                            </button>
                        </Link>
                    </div>

                    {/* Enterprise Tier */}
                    <div className="p-8 rounded-3xl bg-[#111] border border-white/5 flex flex-col hover:border-white/10 transition duration-300">
                        <div className="mb-6">
                            <h3 className="text-xl font-bold text-white mb-2">Enterprise</h3>
                            <div className="flex items-baseline gap-1">
                                <span className="text-4xl font-bold text-white">Custom</span>
                            </div>
                            <p className="text-gray-500 text-sm mt-2">Para franquicias y cadenas.</p>
                        </div>
                        <ul className="space-y-4 mb-8 flex-1">
                            <li className="flex items-center gap-3 text-gray-300">
                                <Check className="w-4 h-4 text-violet-500" /> Sedes Ilimitadas
                            </li>
                            <li className="flex items-center gap-3 text-gray-300">
                                <Check className="w-4 h-4 text-violet-500" /> API Access
                            </li>
                            <li className="flex items-center gap-3 text-gray-300">
                                <Check className="w-4 h-4 text-violet-500" /> Soporte Dedicado 24/7
                            </li>
                        </ul>
                        <Link href="mailto:ventas@happymeter.com">
                            <button className="w-full py-3 rounded-xl bg-white/5 text-white font-bold hover:bg-white/10 transition border border-white/10">
                                Contactar Ventas
                            </button>
                        </Link>
                    </div>

                </div>
            </div>
        </section>
    )
}
