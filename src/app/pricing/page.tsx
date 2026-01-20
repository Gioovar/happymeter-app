'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@clerk/nextjs'
import { Check, Sparkles, Zap, Building2, ArrowLeft, Loader2, Globe, BarChart, ShieldCheck, Info } from 'lucide-react'
import { PRICING } from '@/lib/plans'
import { toast } from 'sonner'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'


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

    // Auto-checkout effect
    useEffect(() => {
        const checkoutPending = searchParams.get('checkout') === 'true'
        const planKey = searchParams.get('plan')
        const paramInterval = searchParams.get('interval') as 'month' | 'year' | null

        if (userId && checkoutPending && planKey) {
            handleCheckout(planKey, paramInterval || undefined)
        }
    }, [userId, searchParams])

    // eslint-disable-next-line react-hooks/exhaustive-deps
    const handleCheckout = useCallback(async (planKey: string, intervalParam?: 'month' | 'year', customPrice?: number) => {
        const selectedInterval = intervalParam || interval

        if (!userId) {
            toast.error('Necesitas crear una cuenta para suscribirte.')
            document.cookie = `signup_intent=checkout; path=/; max-age=3600`
            document.cookie = `checkout_plan=${planKey}; path=/; max-age=3600`
            if (selectedInterval) {
                document.cookie = `checkout_interval=${selectedInterval}; path=/; max-age=3600`
            }

            const params = new URLSearchParams()
            params.set('intent', 'checkout')
            params.set('plan', planKey)
            params.set('interval', selectedInterval)
            router.push(`/sign-up?${params.toString()}`)
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
                    interval: selectedInterval,
                    // If we were handling custom pricing backend-side, we'd pass modules here
                    // modules: ... 
                }),
            })

            if (!res.ok) {
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
    }, [userId, interval, router])

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
                'Microjuego Básico (Sin premios)',
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
                'Alertas de Staff (Crisis en Tiempo Real)',
                'Análisis de Sentimiento con IA (Básico)',
                'Marketing con Base de Datos (Meta Ads)',
                'Reportes Detallados y Exportación',
                'Microjuegos para Clientes (Premios)',
                'QR Personalizable con Logo'
            ],
            cta: 'Elegir Growth',
            popular: false, // Changed to false as New Power is likely the 'Smart' choice
            gradient: 'from-violet-600 to-fuchsia-600',
            border: 'border-violet-500'
        },
        // Power 3X & Chain Master removed/replaced
        {
            key: 'ENTERPRISE',
            name: 'Infinity',
            price: 'Custom',
            billingText: 'Contactar para cotización',
            description: 'Infraestructura dedicada a tu medida.',
            features: [
                'Todo lo de Chain Master Ilimitado',
                'Gamificación y Microjuegos a Medida',
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

    const visiblePlans = userId ? plans.filter(p => p.key !== 'FREE') : plans

    // Smart Plan Props
    const basePrice = 399

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
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8 items-start">

                    {/* Standard Plans (FREE & GROWTH) */}
                    {visiblePlans.filter(p => p.key !== 'ENTERPRISE').map((plan) => (
                        <PlanCard
                            key={plan.key}
                            plan={plan}
                            interval={interval}
                            loading={loadingPlan === plan.key}
                            onSelect={() => handleCheckout(plan.key)}
                        />
                    ))}

                    {/* Smart Power 3X Plan (Replaces Old Power & Chain) */}
                    <SmartPlanCard
                        basePrice={basePrice}
                        interval={interval}
                        loading={loadingPlan === 'POWER'}
                        onSelect={() => handleCheckout('POWER')}
                    />

                    {/* Enterprise - Moved to bottom or last slot depending on layout provided in prompt
                        The Prompt implied removing Power & Chain and putting the new one. 
                        Usually Enterprise sits at the end. 
                    */}
                    {visiblePlans.filter(p => p.key === 'ENTERPRISE').map((plan) => (
                        <PlanCard
                            key={plan.key}
                            plan={plan}
                            interval={interval}
                            loading={loadingPlan === plan.key}
                            onSelect={() => handleCheckout(plan.key)}
                        />
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

function SmartPlanCard({ basePrice, interval, loading, onSelect }: { basePrice: number, interval: 'month' | 'year', loading: boolean, onSelect: () => void }) {
    // State for Toggles
    const [modules, setModules] = useState({
        loyalty: false,
        processes: false,
        reservations: false
    })

    const MODULE_PRICES = {
        loyalty: 599,
        processes: 699,
        reservations: 599
    }

    const calculateTotal = () => {
        let total = basePrice
        if (modules.loyalty) total += MODULE_PRICES.loyalty
        if (modules.processes) total += MODULE_PRICES.processes
        if (modules.reservations) total += MODULE_PRICES.reservations

        // Annual Discount Logic: Pay 10 months, get 12
        // We display the monthly *equivalent*
        if (interval === 'year') {
            const annualTotal = total * 10
            return Math.round(annualTotal / 12)
        }

        return total
    }

    const currentTotal = calculateTotal()
    const annualBilled = interval === 'year' ? (currentTotal * 12) : null // Or strictly total * 10, which matches currentTotal * 12 roughly due to rounding

    const toggleModule = (key: keyof typeof modules) => {
        setModules(prev => ({ ...prev, [key]: !prev[key] }))
    }

    return (
        <div className="relative p-1 rounded-3xl bg-gradient-to-b from-blue-600 to-transparent transition duration-300 hover:transform hover:-translate-y-2 hover:shadow-2xl hover:shadow-blue-500/20 h-full">
            {/* Badge */}
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-6 py-1.5 rounded-full bg-[#1e40af] text-white text-xs font-bold uppercase tracking-wider shadow-lg z-10 border border-blue-400/30">
                PLAN INTELIGENTE
            </div>

            <div className="bg-[#050505] rounded-[22px] p-8 h-full flex flex-col relative overflow-hidden">
                <div className="mb-6 relative z-10">
                    <h3 className="text-3xl font-bold mb-2 text-white">Power 3X</h3>
                    <p className="text-gray-400 text-sm leading-relaxed mb-6">
                        Arma tu propio sistema. Incluye todo lo de <strong className="text-white">Growth 1K</strong> + Módulos:
                    </p>
                </div>

                {/* Modules Selection */}
                <div className="space-y-3 mb-8 flex-1">
                    {/* Module: Lealtad */}
                    <div
                        onClick={() => toggleModule('loyalty')}
                        className={`p-4 rounded-xl border cursor-pointer transition-all duration-200 flex items-center justify-between group ${modules.loyalty
                            ? 'bg-blue-600/10 border-blue-500'
                            : 'bg-[#111] border-white/10 hover:border-white/20'
                            }`}
                    >
                        <div className="flex items-center gap-3">
                            <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${modules.loyalty ? 'bg-blue-500 border-blue-500' : 'border-gray-600'
                                }`}>
                                {modules.loyalty && <Check className="w-3 h-3 text-white" />}
                            </div>
                            <span className="font-bold text-white">Lealtad</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <Popover>
                                <PopoverTrigger asChild>
                                    <button onClick={(e) => e.stopPropagation()} className="text-[10px] font-bold text-violet-400 bg-violet-500/10 px-2 py-1 rounded-full border border-violet-500/20 flex items-center gap-1 hover:bg-violet-500/20 transition-colors">
                                        <Info className="w-3 h-3" /> BENEFICIOS
                                    </button>
                                </PopoverTrigger>
                                <PopoverContent side="top" className="bg-[#111] border border-white/20 text-white p-4 w-60">
                                    <h4 className="font-bold text-violet-400 mb-2 flex items-center gap-2">
                                        <Sparkles className="w-4 h-4" /> Lealtad 3.0
                                    </h4>
                                    <ul className="space-y-2 text-xs text-gray-300">
                                        <li className="flex gap-2">
                                            <Check className="w-3 h-3 text-green-500 shrink-0" />
                                            Tarjeta Digital (Apple/Google Wallet)
                                        </li>
                                        <li className="flex gap-2">
                                            <Check className="w-3 h-3 text-green-500 shrink-0" />
                                            Niveles de Usuarios (Bronce/Plata/Oro)
                                        </li>
                                        <li className="flex gap-2">
                                            <Check className="w-3 h-3 text-green-500 shrink-0" />
                                            Seguimiento de Visitas y Puntos
                                        </li>
                                        <li className="flex gap-2">
                                            <Check className="w-3 h-3 text-green-500 shrink-0" />
                                            Premios Configurables
                                        </li>
                                    </ul>
                                </PopoverContent>
                            </Popover>
                            <span className="font-bold text-gray-400">${MODULE_PRICES.loyalty}</span>
                        </div>
                    </div>

                    {/* Module: Procesos */}
                    <div
                        onClick={() => toggleModule('processes')}
                        className={`p-4 rounded-xl border cursor-pointer transition-all duration-200 flex items-center justify-between group ${modules.processes
                            ? 'bg-blue-600/10 border-blue-500'
                            : 'bg-[#111] border-white/10 hover:border-white/20'
                            }`}
                    >
                        <div className="flex items-center gap-3">
                            <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${modules.processes ? 'bg-blue-500 border-blue-500' : 'border-gray-600'
                                }`}>
                                {modules.processes && <Check className="w-3 h-3 text-white" />}
                            </div>
                            <span className="font-bold text-white">Procesos</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <Popover>
                                <PopoverTrigger asChild>
                                    <button onClick={(e) => e.stopPropagation()} className="text-[10px] font-bold text-violet-400 bg-violet-500/10 px-2 py-1 rounded-full border border-violet-500/20 flex items-center gap-1 hover:bg-violet-500/20 transition-colors">
                                        <Info className="w-3 h-3" /> BENEFICIOS
                                    </button>
                                </PopoverTrigger>
                                <PopoverContent side="top" className="bg-[#111] border border-white/20 text-white p-4 w-60">
                                    <h4 className="font-bold text-blue-400 mb-2 flex items-center gap-2">
                                        <ShieldCheck className="w-4 h-4" /> Control Total
                                    </h4>
                                    <ul className="space-y-2 text-xs text-gray-300">
                                        <li className="flex gap-2">
                                            <Check className="w-3 h-3 text-green-500 shrink-0" />
                                            Checklists de Apertura y Cierre
                                        </li>
                                        <li className="flex gap-2">
                                            <Check className="w-3 h-3 text-green-500 shrink-0" />
                                            Evidencia Fotográfica Obligatoria
                                        </li>
                                        <li className="flex gap-2">
                                            <Check className="w-3 h-3 text-green-500 shrink-0" />
                                            Reporte de Incidentes
                                        </li>
                                        <li className="flex gap-2">
                                            <Check className="w-3 h-3 text-green-500 shrink-0" />
                                            Auditoría Remota
                                        </li>
                                    </ul>
                                </PopoverContent>
                            </Popover>
                            <span className="font-bold text-gray-400">${MODULE_PRICES.processes}</span>
                        </div>
                    </div>

                    {/* Module: Reservaciones */}
                    <div
                        onClick={() => toggleModule('reservations')}
                        className={`p-4 rounded-xl border cursor-pointer transition-all duration-200 flex items-center justify-between group ${modules.reservations
                            ? 'bg-blue-600/10 border-blue-500'
                            : 'bg-[#111] border-white/10 hover:border-white/20'
                            }`}
                    >
                        <div className="flex items-center gap-3">
                            <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${modules.reservations ? 'bg-blue-500 border-blue-500' : 'border-gray-600'
                                }`}>
                                {modules.reservations && <Check className="w-3 h-3 text-white" />}
                            </div>
                            <span className="font-bold text-white">Reservaciones</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <Popover>
                                <PopoverTrigger asChild>
                                    <button onClick={(e) => e.stopPropagation()} className="text-[10px] font-bold text-violet-400 bg-violet-500/10 px-2 py-1 rounded-full border border-violet-500/20 flex items-center gap-1 hover:bg-violet-500/20 transition-colors">
                                        <Info className="w-3 h-3" /> BENEFICIOS
                                    </button>
                                </PopoverTrigger>
                                <PopoverContent side="top" className="bg-[#111] border border-white/20 text-white p-4 w-60">
                                    <h4 className="font-bold text-fuchsia-400 mb-2 flex items-center gap-2">
                                        <Globe className="w-4 h-4" /> Motor de Reservas
                                    </h4>
                                    <ul className="space-y-2 text-xs text-gray-300">
                                        <li className="flex gap-2">
                                            <Check className="w-3 h-3 text-green-500 shrink-0" />
                                            Widget para Web y Redes
                                        </li>
                                        <li className="flex gap-2">
                                            <Check className="w-3 h-3 text-green-500 shrink-0" />
                                            Gestión Visual de Mesas
                                        </li>
                                        <li className="flex gap-2">
                                            <Check className="w-3 h-3 text-green-500 shrink-0" />
                                            Recordatorios por WhatsApp
                                        </li>
                                        <li className="flex gap-2">
                                            <Check className="w-3 h-3 text-green-500 shrink-0" />
                                            Cobro de No-Shows (Stripe)
                                        </li>
                                    </ul>
                                </PopoverContent>
                            </Popover>
                            <span className="font-bold text-gray-500">${MODULE_PRICES.reservations}</span>
                        </div>
                    </div>
                </div>

                {/* Summary & CTA */}
                <div className="bg-black/40 rounded-xl p-4 border border-white/10 space-y-3">
                    <div className="flex items-center justify-between text-sm text-gray-400 border-b border-white/5 pb-2">
                        <span>Base (Growth 1K)</span>
                        <span>${interval === 'year' ? Math.round((basePrice * 10) / 12) : basePrice}</span>
                    </div>
                    <div className="flex flex-col">
                        <div className="flex items-center justify-between text-white">
                            <span className="font-bold text-lg">Total Mensual</span>
                            <span className="text-3xl font-bold">${currentTotal}</span>
                        </div>
                        {interval === 'year' && (
                            <p className="text-xs text-green-400 text-right mt-1">
                                Facturado ${currentTotal * 12} anual
                            </p>
                        )}
                        {interval === 'month' && (
                            <p className="text-xs text-gray-500 text-right mt-1">
                                Facturado mensualmente
                            </p>
                        )}
                    </div>
                </div>

                <div className="mt-6">
                    <button
                        onClick={onSelect}
                        disabled={loading}
                        className="w-full py-4 rounded-xl font-bold transition flex items-center justify-center gap-2 bg-[#2563eb] hover:bg-[#1d4ed8] text-white shadow-lg shadow-blue-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <>
                                👉 Armar Plan Power
                            </>
                        )}
                    </button>
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
