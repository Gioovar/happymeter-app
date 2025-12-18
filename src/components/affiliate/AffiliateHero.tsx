
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
                    Gana el <span className="text-green-500">40%</span> de cada suscripción recurrente
                </h1>

                <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed">
                    Únete a HappyCreators. Recomienda la herramienta #1 de feedback y construye un ingreso pasivo real. Te damos las herramientas, tú pones la audiencia.
                </p>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                    <Link href="/sign-up?intent=creator">
                        <button className="px-8 py-4 rounded-full bg-white text-black font-bold text-lg hover:scale-105 transition duration-300 flex items-center gap-2 shadow-xl shadow-white/10">
                            Convertirme en Partner
                            <ArrowRight className="w-5 h-5" />
                        </button>
                    </Link>
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
