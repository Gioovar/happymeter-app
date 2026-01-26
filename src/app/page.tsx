
import Hero from '@/components/landing/Hero'
import BrandLogo from '@/components/BrandLogo'
import Features from '@/components/landing/Features'
import FAQ from '@/components/landing/FAQ'
import Footer from '@/components/landing/Footer'
import Link from 'next/link'
import HowItWorks from '@/components/landing/HowItWorks'
import IntroSplash from '@/components/IntroSplash'
import Navbar from '@/components/landing/Navbar'

import LinkTracker from '@/components/landing/LinkTracker'
import SocialProof from '@/components/landing/SocialProof'
import PainPointSection from '@/components/landing/PainPointSection'
import PricingTeaser from '@/components/landing/PricingTeaser'

import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'

export default async function LandingPage() {
  const { userId } = await auth()

  if (userId) {
    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-violet-500/30">
      <LinkTracker />
      <IntroSplash />

      {/* Navbar */}
      {/* Navbar */}
      <Navbar />

      <main>
        <Hero />
        <SocialProof />
        <PainPointSection />
        <HowItWorks />
        <Features />
        <PricingTeaser />
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
