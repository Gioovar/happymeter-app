
import Link from 'next/link'
import { ArrowRight, Sparkles, Wallet } from 'lucide-react'

export default function AffiliateHero() {
    return (
        <section className="relative pt-32 pb-20 overflow-hidden bg-[#050505]">
            {/* Background Effects */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-7xl pointer-events-none">
                <div className="absolute top-20 right-20 w-72 h-72 bg-green-600/20 rounded-full blur-[100px]" />
                <div className="absolute bottom-20 left-20 w-96 h-96 bg-violet-600/20 rounded-full blur-[100px]" />
            </div>

            <div className="max-w-7xl mx-auto px-6 relative z-10 text-center">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-sm font-medium text-green-400 mb-8 animate-fade-in">
                    <Wallet className="w-4 h-4" />
                    <span>Programa de Partners Oficial</span>
                </div>

                <h1 className="text-5xl md:text-7xl font-bold bg-clip-text text-transparent bg-gradient-to-b from-white to-gray-400 tracking-tight mb-6 max-w-4xl mx-auto leading-tight">
                    Gana hasta el <span className="text-green-500">40%</span> de cada suscripción recurrente
                </h1>

                <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed">
                    Únete a HappyCreators. Recomienda la herramienta #1 de feedback y construye un ingreso pasivo real. Te damos las herramientas, tú pones la audiencia.
                </p>

                {/* Role Selection Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto mt-12 mb-16">
                    {/* Creators Card */}
                    <div className="group relative p-8 rounded-3xl bg-[#111] border border-white/5 hover:border-violet-500/50 transition-all duration-300 hover:-translate-y-1">
                        <div className="absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-violet-500 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="w-12 h-12 bg-violet-500/10 rounded-xl flex items-center justify-center mb-6 mx-auto group-hover:bg-violet-500/20 transition-colors">
                            <Sparkles className="w-6 h-6 text-violet-400" />
                        </div>
                        <h3 className="text-2xl font-bold text-white mb-2">Para Creadores</h3>
                        <p className="text-gray-400 text-sm mb-6 h-12">
                            Ideal para influencers, bloggers y expertos en marketing digital.
                        </p>
                        <ul className="text-left space-y-3 mb-8 text-gray-300 text-sm">
                            <li className="flex items-center gap-2"><span className="text-green-400">✓</span> 40% Comisiones Recurrentes</li>
                            <li className="flex items-center gap-2"><span className="text-green-400">✓</span> Links de Referido y Cupones</li>
                            <li className="flex items-center gap-2"><span className="text-green-400">✓</span> Pagos Mensuales</li>
                        </ul>
                        <Link href="/sign-up?intent=creator" className="block">
                            <button className="w-full py-3 rounded-xl bg-white text-black font-bold hover:bg-gray-200 transition">
                                Unirme como Creador
                            </button>
                        </Link>
                    </div>

                    {/* Ambassadors Card */}
                    <div className="group relative p-8 rounded-3xl bg-[#111] border border-white/5 hover:border-blue-500/50 transition-all duration-300 hover:-translate-y-1">
                        <div className="absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-blue-500 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center mb-6 mx-auto group-hover:bg-blue-500/20 transition-colors">
                            <Wallet className="w-6 h-6 text-blue-400" />
                        </div>
                        <h3 className="text-2xl font-bold text-white mb-2">Para Embajadores</h3>
                        <p className="text-gray-400 text-sm mb-6 h-12">
                            Ideal para vendedores directos, networking y venta B2B de campo.
                        </p>
                        <ul className="text-left space-y-3 mb-8 text-gray-300 text-sm">
                            <li className="flex items-center gap-2"><span className="text-green-400">✓</span> Comisiones por Venta Directa</li>
                            <li className="flex items-center gap-2"><span className="text-green-400">✓</span> CRM y Mapa de Prospección</li>
                            <li className="flex items-center gap-2"><span className="text-green-400">✓</span> Exclusividad Territorial</li>
                        </ul>
                        <Link href="/sign-up?intent=seller" className="block">
                            <button className="w-full py-3 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 transition">
                                Unirme como Embajador
                            </button>
                        </Link>
                    </div>
                </div>

                {/* Dashboard Preview Mockup */}
                <div className="mt-20 relative mx-auto max-w-5xl">
                    <div className="absolute -inset-1 bg-gradient-to-r from-green-600 to-violet-600 rounded-2xl blur opacity-30" />
                    <div className="relative bg-[#0a0a0a] border border-white/10 rounded-2xl overflow-hidden shadow-2xl p-4 md:p-8">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
                            <div className="p-6 rounded-2xl bg-[#111] border border-white/5">
                                <p className="text-gray-400 text-sm mb-2">Tus Ganancias (Este mes)</p>
                                <h3 className="text-3xl font-bold text-white">$1,240.50</h3>
                            </div>
                            <div className="p-6 rounded-2xl bg-[#111] border border-white/5">
                                <p className="text-gray-400 text-sm mb-2">Clics Referidos</p>
                                <h3 className="text-3xl font-bold text-white">8,420</h3>
                            </div>
                            <div className="p-6 rounded-2xl bg-[#111] border border-white/5">
                                <p className="text-gray-400 text-sm mb-2">Conversión</p>
                                <h3 className="text-3xl font-bold text-green-400">4.8%</h3>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}
