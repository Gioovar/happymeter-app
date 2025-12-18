
import AffiliateHero from '@/components/affiliate/AffiliateHero'
import Footer from '@/components/landing/Footer'
import Link from 'next/link'
import { Sparkles } from 'lucide-react'

export default function AffiliatePage() {
    return (
        <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-green-500/30">

            {/* Navbar */}
            <header className="fixed top-0 w-full z-50 bg-black/50 backdrop-blur-xl border-b border-white/5">
                <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-2 text-xl font-bold tracking-tight">
                        <Sparkles className="w-5 h-5 text-violet-500" />
                        Happy<span className="text-violet-500">Creators</span>
                    </Link>

                    <div className="flex items-center gap-6">
                        <Link href="/sign-in" className="text-sm font-medium text-white hover:text-gray-300 transition">
                            Log In
                        </Link>
                        <Link href="/sign-up?intent=creator">
                            <button className="px-5 py-2.5 rounded-full bg-white text-black text-sm font-bold hover:bg-gray-200 transition">
                                Unirme al Programa
                            </button>
                        </Link>
                    </div>
                </div>
            </header>

            <main>
                <AffiliateHero />

                {/* Simple Benefits Section */}
                <section className="py-20 bg-black">
                    <div className="max-w-7xl mx-auto px-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            <div className="p-8 rounded-3xl bg-[#111] border border-white/5">
                                <h3 className="text-xl font-bold text-white mb-4">Comisiones Recurrentes</h3>
                                <p className="text-gray-400">Gana el 40% todos los meses mientras tu referido mantenga su suscripción activa.</p>
                            </div>
                            <div className="p-8 rounded-3xl bg-[#111] border border-white/5">
                                <h3 className="text-xl font-bold text-white mb-4">Pagos Rápidos</h3>
                                <p className="text-gray-400">Recibe tus ganancias directamente en tu cuenta bancaria o PayPal cada mes.</p>
                            </div>
                            <div className="p-8 rounded-3xl bg-[#111] border border-white/5">
                                <h3 className="text-xl font-bold text-white mb-4">Recursos de Marketing</h3>
                                <p className="text-gray-400">Accede a banners, copys y una IA entrenada para ayudarte a crear contenido viral.</p>
                            </div>
                        </div>
                    </div>
                </section>
            </main>

            <Footer />
        </div>
    )
}
