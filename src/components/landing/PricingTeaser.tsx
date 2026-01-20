'use client'

import React, { useState } from 'react'
import { Check, Sparkles, Building2, ShieldCheck, Info, X, Loader2, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@clerk/nextjs'
import { toast } from 'sonner'

const ADDONS = {
    LOYALTY: {
        id: 'loyalty',
        name: 'Lealtad',
        monthly: 699,
        annual: 599,
        realPrice: 1800,
        features: ['App de Lealtad', 'Menú Digital', 'Tarjeta Digital', 'Niveles VIP'],
        fullFeatures: [
            'Programa de Lealtad por Visitas y Puntos',
            'Menú Digital Interactivo',
            'App para Staff (Gestión de Puntos)',
            'Escáner de Códigos QR',
            'Micrositio para Clientes',
            'Gestión de Reglas y Premios',
            'Historial de Clientes y Promociones',
            'Tarjeta Digital (Apple/Google Wallet)',
            'Niveles VIP y Recompensas',
            'Juegos para elevar ventas (Ruleta, Raspa y Gana)'
        ]
    },
    PROCESSES: {
        id: 'processes',
        name: 'Procesos',
        monthly: 799,
        annual: 699,
        realPrice: 1800,
        features: ['Flujos y Tareas', 'Supervisión IA', 'Evidencia Video', 'Reportes Staff'],
        fullFeatures: [
            'Gestión de Flujos de Trabajo e Incidencias',
            'Supervisión de Tareas con IA',
            'Captura de Evidencia en Video',
            'Notificaciones de Tareas Pendientes',
            'Reportes de Desempeño de Empleados',
            'Control de Órdenes y Cumplimiento',
            'Automatización de Procesos Operativos'
        ]
    },
    RESERVATIONS: {
        id: 'reservations',
        name: 'Reservaciones',
        monthly: 699,
        annual: 599,
        realPrice: 1800,
        features: ['Mapa de Mesas', 'Hostess App', 'Motor de Reservas', 'Recordatorios'],
        fullFeatures: [
            'Sistema de Reservaciones Inteligente',
            'Mapa Digital Exacto (Desde Foto)',
            'Asignación y Bloqueo de Mesas',
            'Cobro por Mesas VIP',
            'Lista de Reservas por Día',
            'Confirmación Automática (WhatsApp/SMS)',
            'App para Hostess',
            'Link y QR de Reservas',
            'Integración con Google Business y Calendar'
        ]
    }
}

export default function PricingTeaser() {
    const [isAnnual, setIsAnnual] = useState(true)
    const [loadingPlan, setLoadingPlan] = useState<string | null>(null)
    const router = useRouter()
    const { userId } = useAuth()

    const interval = isAnnual ? 'year' : 'month'

    const handleCheckout = async (planKey: string, customPrice?: number) => {
        if (!userId) {
            toast.error('Necesitas crear una cuenta para suscribirte.')
            document.cookie = `signup_intent=checkout; path=/; max-age=3600`
            document.cookie = `checkout_plan=${planKey}; path=/; max-age=3600`
            if (interval) {
                document.cookie = `checkout_interval=${interval}; path=/; max-age=3600`
            }

            const params = new URLSearchParams()
            params.set('intent', 'checkout')
            params.set('plan', planKey)
            params.set('interval', interval)
            router.push(`/sign-up?${params.toString()}`)
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
                    interval: interval,
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
    }

    const growthPlan = {
        key: 'GROWTH',
        name: 'Growth 1K',
        price: isAnnual ? `$399` : `$450`,
        billingText: isAnnual ? `Ahorra $51 al mes pagando anual` : 'Pago mensual sin plazo forzoso',
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
        popular: false,
        gradient: 'from-violet-600 to-fuchsia-600',
        border: 'border-violet-500'
    }

    const starterPlan = {
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
    }

    return (
        <section className="py-24 bg-[#0a0a0a] border-t border-white/5 relative">
            <div className="max-w-7xl mx-auto px-6">
                <div className="text-center mb-12">
                    <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">Inversión transparente</h2>
                    <p className="text-gray-400 text-lg mb-8">Sin contratos forzosos. Cancela cuando quieras.</p>

                    {/* Toggle */}
                    <div className="flex items-center justify-center gap-4">
                        <span className={`text-sm font-medium ${!isAnnual ? 'text-white' : 'text-gray-500'}`}>Mensual</span>
                        <div
                            onClick={() => setIsAnnual(!isAnnual)}
                            className="w-16 h-8 rounded-full bg-white/10 border border-white/10 p-1 cursor-pointer transition-colors hover:bg-white/20 relative"
                        >
                            <div className={`w-6 h-6 rounded-full bg-violet-500 shadow-lg transform transition-transform duration-300 ${isAnnual ? 'translate-x-8' : 'translate-x-0'}`} />
                        </div>
                        <span className={`text-sm font-medium ${isAnnual ? 'text-white' : 'text-gray-500'}`}>Anual</span>
                        {isAnnual && <span className="ml-2 text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded-full animate-pulse">Ahorra hasta 20%</span>}
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto items-start">

                    {/* Starter Tier */}
                    <PlanCard
                        plan={starterPlan}
                        interval={interval}
                        loading={loadingPlan === 'FREE'}
                        onSelect={() => handleCheckout('FREE')}
                    />

                    {/* Growth Tier */}
                    <PlanCard
                        plan={growthPlan}
                        interval={interval}
                        loading={loadingPlan === 'GROWTH'}
                        onSelect={() => handleCheckout('GROWTH')}
                    />

                    {/* Power 3X Tier */}
                    <SmartPlanCard
                        interval={interval}
                        loading={loadingPlan === 'POWER'}
                        onSelect={() => handleCheckout('POWER')}
                    />

                </div>

                <div className="mt-12 text-center">
                    <Link href="/pricing" className="inline-flex items-center gap-2 text-violet-400 hover:text-white transition font-bold">
                        Ver comparación detallada <ArrowRight className="w-4 h-4" />
                    </Link>
                </div>
            </div>
        </section>
    )
}

// COPIED COMPONENTS FROM pricing/page.tsx

function SmartPlanCard({ interval, loading, onSelect }: { interval: 'month' | 'year', loading: boolean, onSelect: () => void }) {
    const [selectedAddons, setSelectedAddons] = useState<string[]>([])
    const [viewingAddon, setViewingAddon] = useState<string | null>(null)

    const isAnnual = interval === 'year'
    const basePrice = isAnnual ? 399 : 450
    const baseRealPrice = 1500

    const toggleAddon = (id: string) => {
        setSelectedAddons(prev =>
            prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
        )
    }

    const addonPriceRaw = selectedAddons.reduce((acc, id) => {
        const addon = Object.values(ADDONS).find(a => a.id === id)
        return acc + (isAnnual ? addon!.annual : addon!.monthly)
    }, 0)

    const addonRealPriceRaw = selectedAddons.reduce((acc, id) => {
        const addon = Object.values(ADDONS).find(a => a.id === id)
        return acc + (addon!.realPrice || 0)
    }, 0)

    const totalRealPrice = baseRealPrice + addonRealPriceRaw

    let discountRate = 0
    if (selectedAddons.length === 2) discountRate = 0.15
    if (selectedAddons.length === 3) discountRate = 0.20

    const discountAmount = addonPriceRaw * discountRate
    const addonPriceFinal = addonPriceRaw - discountAmount
    const totalPrice = basePrice + addonPriceFinal

    const viewingAddonData = viewingAddon ? Object.values(ADDONS).find(a => a.id === viewingAddon) : null

    return (
        <div className="relative z-10">
            {viewingAddonData && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setViewingAddon(null)}>
                    <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl p-6 max-w-md w-full shadow-2xl relative" onClick={e => e.stopPropagation()}>
                        <button onClick={() => setViewingAddon(null)} className="absolute top-4 right-4 text-gray-400 hover:text-white transition">
                            <X className="w-6 h-6" />
                        </button>
                        <h3 className="text-2xl font-bold text-white mb-2">{viewingAddonData.name}</h3>
                        <div className="h-1 w-12 bg-blue-500 rounded-full mb-6" />
                        <ul className="space-y-3">
                            {viewingAddonData.fullFeatures.map((feature, idx) => (
                                <li key={idx} className="flex items-start gap-3 text-gray-300 text-sm">
                                    <Check className="w-5 h-5 text-blue-500 shrink-0" />
                                    {feature}
                                </li>
                            ))}
                        </ul>
                        <div className="mt-8 pt-6 border-t border-white/10">
                            <button onClick={() => setViewingAddon(null)} className="w-full py-3 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-500 transition">
                                Cerrar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="relative p-1 rounded-3xl bg-gradient-to-b from-blue-600 to-transparent transition duration-300 hover:transform hover:-translate-y-2 hover:shadow-2xl hover:shadow-blue-500/20 h-full">
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 flex items-center gap-2 z-10 w-full justify-center">
                    <div className="px-6 py-1.5 rounded-full bg-[#1e40af] text-white text-xs font-bold uppercase tracking-wider shadow-lg border border-blue-400/30">
                        PLAN INTELIGENTE
                    </div>
                    <div className="px-4 py-1.5 rounded-full bg-gradient-to-r from-red-600 to-orange-600 text-white text-xs font-bold uppercase tracking-wider shadow-lg border border-white/20 whitespace-nowrap">
                        🔥 OFERTA
                    </div>
                </div>

                <div className="bg-[#050505] rounded-[22px] p-8 h-full flex flex-col relative overflow-hidden">
                    <div className="mb-6 relative z-10">
                        <h3 className="text-3xl font-bold mb-2 text-white">Power 3X</h3>
                        <p className="text-gray-400 text-sm leading-relaxed mb-4">
                            Arma tu propio sistema. Incluye todo lo de <strong className="text-white">Growth 1K</strong> + Módulos:
                        </p>
                    </div>

                    <div className="space-y-3 mb-8 flex-1">
                        {Object.values(ADDONS).map((addon) => {
                            const isSelected = selectedAddons.includes(addon.id)
                            const price = isAnnual ? addon.annual : addon.monthly
                            return (
                                <div
                                    key={addon.id}
                                    onClick={() => toggleAddon(addon.id)}
                                    className={`cursor-pointer p-4 rounded-xl border transition-all duration-200 ${isSelected ? 'bg-blue-500/10 border-blue-500' : 'bg-white/5 border-white/10 hover:border-white/20'}`}
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-5 h-5 rounded border flex items-center justify-center ${isSelected ? 'bg-blue-500 border-blue-500' : 'border-gray-500'}`}>
                                                {isSelected && <Check className="w-3 h-3 text-white" />}
                                            </div>
                                            <span className={`font-bold ${isSelected ? 'text-white' : 'text-gray-400'}`}>{addon.name}</span>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    setViewingAddon(addon.id)
                                                }}
                                                className="px-2 py-1 rounded-full bg-violet-500/10 border border-violet-500/30 hover:bg-violet-500/20 text-violet-300 text-[10px] font-bold uppercase tracking-wider transition flex items-center gap-1"
                                            >
                                                <Info className="w-3 h-3" />
                                                BENEFICIOS
                                            </button>
                                        </div>
                                        <div className="text-right">
                                            <span className={`block font-bold ${isSelected ? 'text-white' : 'text-gray-500'}`}>${price}</span>
                                        </div>
                                    </div>
                                    {isSelected && (
                                        <div className="mt-2 text-xs text-gray-400 pl-8">
                                            {addon.features.join(', ')}
                                        </div>
                                    )}
                                </div>
                            )
                        })}
                    </div>

                    <div className="bg-black/40 rounded-xl p-4 border border-white/10 space-y-3">
                        <div className="flex justify-between text-sm text-gray-400">
                            <span>Base (Growth 1K)</span>
                            <span>${basePrice}</span>
                        </div>
                        {selectedAddons.length > 0 && (
                            <div className="flex justify-between text-sm text-gray-400">
                                <span>Extra Módulos</span>
                                <span>${addonPriceRaw}</span>
                            </div>
                        )}
                        {discountAmount > 0 && (
                            <div className="flex justify-between text-sm text-green-400 font-bold">
                                <span>Descuento Multimodulo ({(discountRate * 100).toFixed(0)}%)</span>
                                <span>-${discountAmount.toFixed(0)}</span>
                            </div>
                        )}
                        <div className="border-t border-white/10 mt-2 pt-2">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-gray-400 line-through text-sm font-medium">Precio real: ${totalRealPrice.toLocaleString()}</span>
                                <span className="text-xs bg-red-500/20 text-red-400 px-3 py-1 rounded-full border border-red-500/30 font-bold shadow-lg shadow-red-500/10">AHORRAS 70%</span>
                            </div>

                            <div className="flex justify-between items-baseline">
                                <span className="text-white font-bold">Total Mensual</span>
                                <span className="text-3xl font-bold text-white">${totalPrice.toFixed(0)}</span>
                            </div>
                        </div>
                    </div>

                    <div className="mt-6">
                        <button
                            onClick={onSelect}
                            disabled={loading}
                            className="w-full py-4 rounded-xl font-bold transition flex items-center justify-center gap-2 bg-[#2563eb] hover:bg-[#1d4ed8] text-white shadow-lg shadow-blue-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : '👉 Armar Plan Power'}
                        </button>
                    </div>

                    <div className="mt-6 pt-4 border-t border-white/5 space-y-2">
                        <p className="flex items-center gap-2 text-[10px] text-gray-400">
                            <Building2 className="w-3 h-3 text-gray-500" />
                            💡 El precio mostrado es por lugar.
                        </p>
                        <p className="flex items-center gap-2 text-[10px] text-gray-400">
                            <ShieldCheck className="w-3 h-3 text-gray-500" />
                            💳 Cobro claro y transparente. Cancela cuando quieras.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}

function PlanCard({ plan, interval, loading, onSelect }: any) {
    return (
        <div className={`relative p-8 rounded-3xl border ${plan.border} bg-black/40 backdrop-blur-xl flex flex-col transition duration-300 hover:transform hover:-translate-y-2 hover:shadow-2xl hover:shadow-violet-500/10 h-full`}>
            {plan.key === 'GROWTH' && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-red-600 to-orange-600 text-white text-xs font-bold uppercase tracking-wider shadow-lg z-10 whitespace-nowrap border border-white/20">
                    🔥 OFERTA DE LANZAMIENTO
                </div>
            )}

            {plan.popular && plan.key !== 'GROWTH' && (
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

                <p className="text-xs text-gray-500 mb-2 h-[20px]">{plan.billingText}</p>

                {plan.key === 'GROWTH' ? (
                    <div className="space-y-2 mt-4 min-h-[40px] border-t border-white/5 pt-4">
                        <p className="text-gray-300 text-sm font-medium">
                            🎉 Precio especial por lanzamiento
                        </p>
                        <p className="text-gray-400 text-xs">
                            Aprovecha esta oferta exclusiva. Accede a herramientas premium diseñadas para hacer crecer tu negocio desde el día uno.
                        </p>
                    </div>
                ) : (
                    <p className="text-gray-400 text-sm min-h-[40px] border-t border-white/5 pt-4 mt-2">{plan.description}</p>
                )}
            </div>

            <div className="flex-1 mb-8 space-y-3">
                {plan.features.map((feature: string, fIdx: number) => (
                    <div key={fIdx} className="flex items-start gap-3 text-sm text-gray-300">
                        <div className={`mt-0.5 p-0.5 rounded-full ${plan.popular || plan.key === 'GROWTH' ? 'bg-violet-500/20 text-violet-400' : 'bg-white/10 text-gray-400'}`}>
                            <Check className="w-3 h-3" />
                        </div>
                        {feature}
                    </div>
                ))}
            </div>

            {plan.key === 'GROWTH' && (
                <div className="mb-0 pt-4 border-t border-white/5 space-y-2">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-gray-400 line-through text-sm font-medium">Precio real: $1,200</span>
                        <span className="text-xs bg-red-500/20 text-red-400 px-3 py-1 rounded-full border border-red-500/30 font-bold shadow-lg shadow-red-500/10">AHORRAS 70%</span>
                    </div>

                    <p className="flex items-center gap-2 text-[10px] text-gray-400">
                        <Building2 className="w-3 h-3 text-gray-500" />
                        💡 El precio mostrado es por lugar.
                    </p>
                    <p className="flex items-center gap-2 text-[10px] text-gray-400">
                        <ShieldCheck className="w-3 h-3 text-gray-500" />
                        💳 Cobro claro y transparente. Cancela cuando quieras.
                    </p>
                </div>
            )}

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
