
import Hero from '@/components/landing/Hero'
import BrandLogo from '@/components/BrandLogo'
import Features from '@/components/landing/Features'
import FAQ from '@/components/landing/FAQ'
import Footer from '@/components/landing/Footer'
import Link from 'next/link'
import HowItWorks from '@/components/landing/HowItWorks'
import IntroSplash from '@/components/IntroSplash'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-violet-500/30">
      <IntroSplash />

      {/* Navbar */}
      <header className="fixed top-0 w-full z-50 bg-black/50 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link href="/" className="hover:opacity-90 transition-opacity">
            <BrandLogo />
          </Link>

          <div className="flex items-center gap-6">
            <Link href="/creators" className="hidden md:block text-sm font-medium text-gray-400 hover:text-white transition">
              Para Creadores
            </Link>
            <Link href="/sign-in" className="text-sm font-medium text-white hover:text-violet-400 transition">
              Entrar
            </Link>
            <Link href="/sign-up">
              <button className="px-5 py-2.5 rounded-full bg-white text-black text-sm font-bold hover:bg-gray-200 transition">
                Crear Cuenta
              </button>
            </Link>
          </div>
        </div>
      </header>

      <main>
        <Hero />
        <HowItWorks />
        <Features />
        <FAQ />

        {/* Power Phrase Section */}
        <div className="py-24 text-center max-w-4xl mx-auto px-6">
          <h2 className="text-3xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-violet-400 via-white to-fuchsia-400 leading-tight">
            "Todo lo que tú no ves y no te reportan, <br className="hidden md:block" />
            HappyMeter te lo dice."
          </h2>
        </div>
      </main>

      <Footer />
    </div>
  )
}
