'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@clerk/nextjs'
import { Check, Sparkles, Zap, Building2, ArrowLeft, Loader2, Globe, BarChart, ShieldCheck } from 'lucide-react'
import { PRICING } from '@/lib/plans'
import { toast } from 'sonner'


export default function PricingPage() {
    const searchParams = useSearchParams()
    const [loadingPlan, setLoadingPlan] = useState<string | null>(null)
    const [interval, setInterval] = useState<'month' | 'year'>('month') // Default to Month for better conversion
    const router = useRouter()

    const { userId } = useAuth() // Get auth state

    useEffect(() => {
        const paramInterval = searchParams.get('interval')
        if (paramInterval === 'year' || paramInterval === 'month') {
            setInterval(paramInterval)
        }
    }, [searchParams])

    const handleCheckout = async (planKey: string) => {
        // 1. Auth Check: If not logged in, redirect to Sign Up
        if (!userId) {
            toast.error('Necesitas crear una cuenta para suscribirte.')
            router.push('/sign-up')
            return
        }

        if (planKey === 'FREE') {
            router.push('/dashboard')
            return
        }
        if (planKey === 'ENTERPRISE') {
            window.location.href = 'mailto:ventas@happymeter.com'
            return
        }

        try {
            setLoadingPlan(planKey)
            toast.loading('Contactando servidor...', { id: 'checkout-toast' })

            const res = await fetch('/api/checkout', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    plan: planKey,
                    interval: interval
                }),
            })

            if (!res.ok) {
                // Determine if it is a 401 to handle gracefully (though client check catches most)
                if (res.status === 401) {
                    toast.error('Sesión expirada. Por favor inicia sesión nuevamente.')
                    router.push('/sign-in')
                    return
                }
                const errData = await res.text()
                throw new Error(errData || 'Error al iniciar pago')
            }

            const { url } = await res.json()
            toast.success('Redirigiendo a Stripe...', { id: 'checkout-toast' })
            window.location.href = url
        } catch (error: any) {
            console.error(error)
            toast.error(error.message || 'Error desconocido', { id: 'checkout-toast', duration: 5000 })
            setLoadingPlan(null)
        }
    }

    const plans = [
        {
            key: 'FREE',
            name: 'Starter Test',
            price: '$0',
            billingText: 'Sin costo. Sin tarjeta.',
            description: 'Prueba el poder de HappyMeter por 7 días.',
            features: [
                '1 Encuesta de prueba (7 días)',
                'Max 50 respuestas',
                'Visualización básica de feedback',
                'Microjuego Básico (Sin premios)', // Added hook
                'Sin branding personalizado'
            ],
            cta: 'Comenzar Prueba',
            popular: false,
            gradient: 'from-gray-800 to-gray-900',
            border: 'border-white/10'
        },
        {
            key: 'GROWTH',
            name: 'Growth 1K',
            price: interval === 'month' ? `$${PRICING.GROWTH.monthly}` : `$${Math.round(PRICING.GROWTH.yearly / 12)}`,
            billingText: interval === 'year' ? `Facturado $${PRICING.GROWTH.yearly} anual` : 'Facturado mensualmente',
            description: 'Para negocios individuales que quieren vender más.',
            features: [
                '1 Encuesta Activa',
                '1,000 Respuestas/mes',
                'Contacto Directo con 1 Clic (WhatsApp)',
                'Generación de Base de Datos Propia',
                'Recuperación Auto. de Clientes Insatisfechos',
                'Alertas de Staff (Crisis en Tiempo Real)', // New
                'Análisis de Sentimiento con IA (Básico)', // New
                'Marketing con Base de Datos (Meta Ads)',
                'Reportes Detallados y Exportación',
                'Microjuegos para Clientes (Premios)',
                'QR Personalizable con Logo'
            ],
            cta: 'Elegir Growth',
            popular: true,
            gradient: 'from-violet-600 to-fuchsia-600',
            border: 'border-violet-500'
        },
        {
            key: 'POWER',
            name: 'Power 3X',
            price: interval === 'month' ? `$${PRICING.POWER.monthly}` : `$${Math.round(PRICING.POWER.yearly / 12)}`,
            billingText: interval === 'year' ? `Facturado $${PRICING.POWER.yearly} anual` : 'Facturado mensualmente',
            description: 'Automatización total para PyMEs en expansión.',
            features: [
                '3 Encuestas Activas',
                'Respuestas Ilimitadas',
                'Chat con Analista de Negocio (IA)', // New
                'Campañas de WhatsApp Masivas', // New
                'Segmentación Inteligente para Meta Ads',
                'CRM: Base de Datos de Clientes',
                'Reportes con IA (Sentimiento y Tendencias)',
                'Microjuegos Premium (Ruleta/Raspa y Gana)',
                'Marca Blanca (Sin logo HappyMeter)',
                'Acceso Multi-usuario (3 Asientos)',
                'Soporte Prioritario por Chat'
            ],
            cta: 'Elegir Power',
            popular: false,
            gradient: 'from-blue-600 to-cyan-600',
            border: 'border-blue-500'
        },
        // Row 2
        {
            key: 'CHAIN',
            name: 'Chain Master',
            price: interval === 'month' ? `$${PRICING.CHAIN.monthly}` : `$${Math.round(PRICING.CHAIN.yearly / 12)}`,
            billingText: interval === 'year' ? `Facturado $${PRICING.CHAIN.yearly} anual` : 'Facturado mensualmente',
            description: 'Control centralizado para cadenas y franquicias.',
            features: [
                'Hasta 100 Encuestas Activas',
                'Dashboard Comparativo Multi-Sucursal',
                'IA Analista Corporativo (Comparativo)', // New
                'Campañas WhatsApp Centralizadas',
                'Microjuegos Personalizados por Sucursal',
                'API para Integración CRM/POS',
                'Reportes Ejecutivos Automated',
                'Gestión de Roles y Permisos',
                'SLA Garantizado 99.9%',
                'Auditoría de Cambios (Logs)'
            ],
            cta: 'Elegir Chain',
            popular: false,
            gradient: 'from-emerald-600 to-teal-600',
            border: 'border-emerald-500'
        },
        {
            key: 'ENTERPRISE',
            name: 'Infinity',
            price: 'Custom',
            billingText: 'Contactar para cotización',
            description: 'Infraestructura dedicada a tu medida.',
            features: [
                'Todo lo de Chain Master Ilimitado',
                'Gamificación y Microjuegos a Medida', // Added
                'Desarrollo de Integraciones a Medida',
                'Soporte Técnico Dedicado 24/7',
                'Onboarding Personalizado y Capacitación',
                'Infraestructura Cloud Dedicada'
            ],
            cta: 'Contactar Ventas',
            popular: false,
            gradient: 'from-gray-900 to-black',
            border: 'border-white/20'
        }
    ]

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-white selection:bg-violet-500/30 font-sans pb-20">
            {/* Background Effects */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-violet-600/10 blur-[120px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-blue-600/10 blur-[120px]" />
            </div>

            <div className="relative z-10 max-w-7xl mx-auto px-6 py-24">
                <Link href="/dashboard" className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-8 transition">
                    <ArrowLeft className="w-4 h-4" /> Volver al Dashboard
                </Link>

                <div className="text-center max-w-3xl mx-auto mb-10">
                    <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-white via-gray-200 to-gray-400">
                        Elige tu nivel de <br />
                        <span className="text-violet-400">crecimiento</span>
                    </h1>
                    <p className="text-xl text-gray-400 mb-8">
                        Desde pilotos rápidos hasta operaciones globales.
                    </p>

                    {/* Toggle */}
                    <div className="flex items-center justify-center gap-4 mb-12">
                        <span className={`text-sm font-bold ${interval === 'month' ? 'text-white' : 'text-gray-500'}`}>Mensual</span>
                        <div
                            onClick={() => setInterval(interval === 'month' ? 'year' : 'month')}
                            className="w-16 h-8 rounded-full bg-white/10 border border-white/10 p-1 cursor-pointer transition-colors hover:bg-white/20 relative"
                        >
                            <div className={`w-6 h-6 rounded-full bg-violet-500 shadow-lg transform transition-transform duration-300 ${interval === 'year' ? 'translate-x-8' : 'translate-x-0'}`} />
                        </div>
                        <span className={`text-sm font-bold flex items-center gap-2 ${interval === 'year' ? 'text-white' : 'text-gray-500'}`}>
                            Anual
                            <span className="text-[10px] bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full border border-green-500/20">AHORRA 2 meses</span>
                        </span>
                    </div>
                </div>

                {/* Plans Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                    {/* First 3 Plans */}
                    {plans.slice(0, 3).map((plan) => (
                        <PlanCard key={plan.key} plan={plan} interval={interval} loading={loadingPlan === plan.key} onSelect={() => handleCheckout(plan.key)} />
                    ))}
                </div>

                {/* Additional Tier Headline */}
                <div className="text-center mb-8 mt-16">
                    <h2 className="text-2xl font-bold text-white mb-2">Para Operaciones Masivas</h2>
                    <p className="text-gray-400">Escala a cientos de sucursales con control total.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
                    {/* Remaining Plans */}
                    {plans.slice(3).map((plan) => (
                        <PlanCard key={plan.key} plan={plan} interval={interval} loading={loadingPlan === plan.key} onSelect={() => handleCheckout(plan.key)} />
                    ))}
                </div>

                <div className="mt-24 mb-16 text-center max-w-4xl mx-auto px-4">
                    <h2 className="text-3xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-violet-400 via-white to-fuchsia-400 leading-tight">
                        "Todo lo que tú no ves y no te reportan, <br className="hidden md:block" />
                        HappyMeter te lo dice."
                    </h2>
                </div>

                <div className="mt-12 text-center">
                    <p className="text-gray-500 text-sm">
                        ¿Dudas sobre qué plan elegir? <a href="#" className="text-violet-400 hover:underline">Habla con un experto</a>
                    </p>
                </div>
            </div>
        </div>
    )
}

function PlanCard({ plan, interval, loading, onSelect }: any) {
    return (
        <div className={`relative p-8 rounded-3xl border ${plan.border} bg-black/40 backdrop-blur-xl flex flex-col transition duration-300 hover:transform hover:-translate-y-2 hover:shadow-2xl hover:shadow-violet-500/10 h-full`}>
            {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 text-xs font-bold uppercase tracking-wider shadow-lg z-10">
                    Recomendado
                </div>
            )}

            <div className="mb-6">
                <h3 className="text-xl font-bold mb-2 text-white">{plan.name}</h3>
                <div className="flex items-baseline gap-1 mb-1">
                    <span className="text-4xl font-bold text-white">{plan.price}</span>
                    {plan.price !== 'Custom' && plan.price !== '$0' && (
                        <span className="text-gray-400 text-sm">/mes</span>
                    )}
                </div>
                {/* Billing Text Subtitle */}
                <p className="text-xs text-gray-500 mb-2 h-[20px]">{plan.billingText}</p>

                <p className="text-gray-400 text-sm min-h-[40px] border-t border-white/5 pt-4 mt-2">{plan.description}</p>
            </div>

            <div className="flex-1 mb-8 space-y-3">
                {plan.features.map((feature: string, fIdx: number) => (
                    <div key={fIdx} className="flex items-start gap-3 text-sm text-gray-300">
                        <div className={`mt-0.5 p-0.5 rounded-full ${plan.popular ? 'bg-violet-500/20 text-violet-400' : 'bg-white/10 text-gray-400'}`}>
                            <Check className="w-3 h-3" />
                        </div>
                        {feature}
                    </div>
                ))}
            </div>

            <button
                onClick={onSelect}
                disabled={loading}
                className={`w-full py-4 rounded-xl font-bold transition flex items-center justify-center gap-2 ${plan.popular
                    ? 'bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:opacity-90 text-white shadow-lg shadow-violet-500/25'
                    : 'bg-white/10 hover:bg-white/20 text-white'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}>
                {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                    <>
                        {plan.cta}
                        {plan.popular && <Sparkles className="w-4 h-4" />}
                    </>
                )}
            </button>
        </div>
    )
}
