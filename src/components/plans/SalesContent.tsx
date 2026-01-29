'use client'

import React, { useState } from 'react'
import { Sparkles, Check, Info, Store } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { CountdownTimer } from './CountdownTimer'

const ADDONS = {
    LOYALTY: {
        id: 'loyalty',
        name: 'Lealtad',
        monthly: 699,
        annual: 599,
        realPrice: 1800,
        features: ['App de Lealtad', 'Menú Digital', 'Tarjeta Digital']
    },
    PROCESSES: {
        id: 'processes',
        name: 'Procesos',
        monthly: 799,
        annual: 699,
        realPrice: 1800,
        features: ['Flujos y Tareas', 'Supervisión IA', 'Evidencia Video']
    },
    RESERVATIONS: {
        id: 'reservations',
        name: 'Reservaciones',
        monthly: 699,
        annual: 599,
        realPrice: 1800,
        features: ['Mapa de Mesas', 'Hostess App', 'Motor de Reservas']
    }
}

interface SalesContentProps {
    defaultPlan?: 'GROWTH' | 'POWER'
    showHeader?: boolean
}

export function SalesContent({ defaultPlan = 'GROWTH', showHeader = true }: SalesContentProps) {
    const [plan, setPlan] = useState<'GROWTH' | 'POWER'>(defaultPlan)
    const [isAnnual, setIsAnnual] = useState(true)
    const [quantity, setQuantity] = useState(1)
    const [selectedAddons, setSelectedAddons] = useState<string[]>([])
    const [isLoading, setIsLoading] = useState(false)

    // Prices
    const BASE_GROWTH_PRICE = isAnnual ? 399 : 450
    const BASE_GROWTH_REAL_PRICE = 1500

    // Addon Prices (Only for Power)
    const calculateAddonPrice = () => {
        if (plan !== 'POWER') return 0
        let total = 0
        selectedAddons.forEach(id => {
            const addon = Object.values(ADDONS).find(a => a.id === id)
            if (addon) total += isAnnual ? addon.annual : addon.monthly
        })
        return total
    }

    // Real Price Calculation
    const calculateRealPrice = () => {
        if (plan === 'GROWTH') return 1200 // Static real price for Growth as per Pricing Page

        let total = BASE_GROWTH_REAL_PRICE
        selectedAddons.forEach(id => {
            const addon = Object.values(ADDONS).find(a => a.id === id)
            if (addon) total += addon.realPrice
        })
        return total
    }

    // Discounts
    const calculateDiscount = (addonTotal: number) => {
        if (plan !== 'POWER') return 0
        if (selectedAddons.length === 2) return addonTotal * 0.15
        if (selectedAddons.length === 3) return addonTotal * 0.20
        return 0
    }

    const addonTotalRaw = calculateAddonPrice()
    const discount = calculateDiscount(addonTotalRaw)
    const unitPrice = BASE_GROWTH_PRICE + (addonTotalRaw - discount)
    const finalTotal = unitPrice * quantity

    // Calculate Total Real Price (for comparison)
    const unitRealPrice = calculateRealPrice()
    const finalRealTotal = unitRealPrice * quantity

    const toggleAddon = (id: string) => {
        setSelectedAddons(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
    }

    const handleCheckout = async () => {
        setIsLoading(true)
        try {
            const payload = {
                plan: plan === 'GROWTH' ? 'GROWTH' : 'custom',
                interval: isAnnual ? 'year' : 'month',
                addons: plan === 'POWER' ? selectedAddons : [],
                quantity: quantity
            }

            const response = await fetch('/api/checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            })

            if (!response.ok) {
                const errorText = await response.text()
                throw new Error(errorText || 'Error en el servidor')
            }

            const data = await response.json()
            if (data.url) {
                window.location.href = data.url
            } else {
                throw new Error('No se recibió URL de redirección')
            }
        } catch (error: any) {
            console.error('Checkout error:', error)
            toast.error(`Error: ${error.message}`)
            setIsLoading(false)
        }
    }

    return (
        <div className="flex flex-col h-full bg-[#0a0a0a]">
            {showHeader && (
                <div className="p-6 border-b border-white/10 flex justify-between items-center bg-[#111]">
                    <div className="flex-1">
                        <h2 className="text-xl font-bold text-white mb-1">Activar Sistema HappyMeter</h2>
                        <p className="text-gray-400 text-sm">Selecciona el plan ideal y el número de sucursales a activar.</p>
                    </div>
                    {/* Countdown in Header */}
                    <div className="hidden md:block">
                        <CountdownTimer />
                    </div>
                </div>
            )}

            <div className="flex-1 overflow-y-auto p-6 md:p-8 grid md:grid-cols-2 gap-8">

                {/* Left Column: Configuration */}
                <div className="space-y-8">

                    {/* Mobile Countdown */}
                    <div className="md:hidden flex justify-center">
                        <CountdownTimer />
                    </div>

                    {/* 1. Select Plan */}
                    <div>
                        <h3 className="text-sm font-bold text-gray-500 uppercase mb-3 tracking-wider">1. Elige tu Plan</h3>
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                onClick={() => setPlan('GROWTH')}
                                className={cn(
                                    "p-4 rounded-xl border text-left transition-all relative overflow-hidden",
                                    plan === 'GROWTH' ? "bg-violet-600/10 border-violet-500" : "bg-white/5 border-white/10 hover:bg-white/10"
                                )}
                            >
                                {/* Launch Offer Badge */}
                                <div className="absolute top-0 right-0 px-2 py-0.5 bg-gradient-to-r from-red-600 to-orange-600 text-[9px] font-bold text-white rounded-bl-lg shadow-sm z-10">
                                    OFERTA
                                </div>

                                <div className="flex items-center justify-between mb-2">
                                    <h4 className="font-bold text-white">Growth 1K</h4>
                                    {plan === 'GROWTH' && <div className="w-4 h-4 bg-violet-500 rounded-full flex items-center justify-center"><Check className="w-3 h-3 text-white" /></div>}
                                </div>
                                <p className="text-xs text-gray-400">Ideal para operar activamente.</p>
                            </button>

                            <button
                                onClick={() => setPlan('POWER')}
                                className={cn(
                                    "p-4 rounded-xl border text-left transition-all relative overflow-hidden",
                                    plan === 'POWER' ? "bg-blue-600/10 border-blue-500" : "bg-white/5 border-white/10 hover:bg-white/10"
                                )}
                            >
                                {/* Tag */}
                                <div className="absolute top-0 right-0 px-2 py-0.5 bg-gradient-to-r from-blue-600 to-cyan-500 text-[9px] font-bold text-white rounded-bl-lg z-10">
                                    Recomendado
                                </div>

                                <div className="flex items-center justify-between mb-2">
                                    <h4 className="font-bold text-white">Power 3X</h4>
                                    {plan === 'POWER' && <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center"><Check className="w-3 h-3 text-white" /></div>}
                                </div>
                                <p className="text-gray-400 text-xs mt-1">Elige tus herramientas.</p>
                            </button>
                        </div>
                    </div>

                    {/* 2. Configure Modules (If Power) */}
                    {plan === 'POWER' && (
                        <div className="animate-in slide-in-from-top-4 fade-in duration-300">
                            <h3 className="text-sm font-bold text-gray-500 uppercase mb-3 tracking-wider">2. Agrega Módulos</h3>
                            <div className="space-y-2">
                                {Object.values(ADDONS).map((addon) => {
                                    const isSelected = selectedAddons.includes(addon.id)
                                    return (
                                        <div
                                            key={addon.id}
                                            onClick={() => toggleAddon(addon.id)}
                                            className={cn(
                                                "cursor-pointer p-3 rounded-xl border transition-all flex items-center justify-between group",
                                                isSelected ? "bg-blue-500/10 border-blue-500/50" : "bg-white/5 border-white/10 hover:border-white/20"
                                            )}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className={cn("w-5 h-5 rounded border flex items-center justify-center transition-colors", isSelected ? "bg-blue-500 border-blue-500" : "border-gray-600")}>
                                                    {isSelected && <Check className="w-3 h-3 text-white" />}
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <span className={cn("font-medium text-sm block", isSelected ? "text-white" : "text-gray-400")}>{addon.name}</span>
                                                        <div className="px-2 py-0.5 rounded-full bg-violet-500/10 border border-violet-500/20 text-[10px] font-bold text-violet-300 flex items-center gap-1">
                                                            <Info className="w-3 h-3" />
                                                            BENEFICIOS
                                                        </div>
                                                    </div>
                                                    <span className="text-[10px] text-gray-500 hidden group-hover:block transition-all">{addon.features[0]}</span>
                                                </div>
                                            </div>
                                            <span className="text-xs font-mono text-gray-400">${isAnnual ? addon.annual : addon.monthly}</span>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    )}

                    {/* 3. Quantity & Interval */}
                    <div>
                        <h3 className="text-sm font-bold text-gray-500 uppercase mb-3 tracking-wider">Configuración Final</h3>

                        {/* Annual Toggle */}
                        <div className="flex items-center gap-3 bg-white/5 p-3 rounded-lg border border-white/10 mb-4">
                            <button
                                onClick={() => setIsAnnual(!isAnnual)}
                                className={cn(
                                    "w-10 h-6 rounded-full p-1 transition-colors relative",
                                    isAnnual ? "bg-green-500" : "bg-gray-600"
                                )}
                            >
                                <div className={cn("w-4 h-4 bg-white rounded-full transition-transform shadow-sm", isAnnual ? "translate-x-4" : "translate-x-0")} />
                            </button>
                            <span className="text-sm text-gray-300 font-medium">Pago Anual <span className="text-green-400 text-xs ml-1">(Hasta 20% OFF)</span></span>
                        </div>

                        {/* Quantity Input */}
                        <div className="flex items-center justify-between bg-white/5 p-4 rounded-xl border border-white/10">
                            <div>
                                <h4 className="text-white font-bold flex items-center gap-2">
                                    <Store className="w-4 h-4 text-gray-400" />
                                    Cantidad de Sucursales
                                </h4>
                                <p className="text-xs text-gray-500 mt-1">Se cobrará por cada unidad.</p>
                            </div>
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                    className="w-8 h-8 rounded-lg bg-white/10 text-white hover:bg-white/20 flex items-center justify-center font-bold"
                                >
                                    -
                                </button>
                                <span className="text-xl font-bold text-white w-8 text-center">{quantity}</span>
                                <button
                                    onClick={() => setQuantity(quantity + 1)}
                                    className="w-8 h-8 rounded-lg bg-white/10 text-white hover:bg-white/20 flex items-center justify-center font-bold"
                                >
                                    +
                                </button>
                            </div>
                        </div>
                    </div>

                </div>

                {/* Right Column: Summary */}
                <div className="bg-[#111] border border-white/10 rounded-2xl p-6 flex flex-col h-fit sticky top-0">
                    <h3 className="text-lg font-bold text-white mb-6">Resumen de Compra</h3>

                    <div className="space-y-3 mb-6 flex-1">
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-400">Plan Base ({plan === 'GROWTH' ? 'Growth 1K' : 'Power 3X'})</span>
                            <span className="text-white font-mono">${BASE_GROWTH_PRICE}</span>
                        </div>

                        {plan === 'POWER' && selectedAddons.length > 0 && (
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-400">Módulos Extra ({selectedAddons.length})</span>
                                <span className="text-white font-mono">+${addonTotalRaw}</span>
                            </div>
                        )}

                        {discount > 0 && (
                            <div className="flex justify-between text-sm text-green-400">
                                <span>Descuento Multimódulo</span>
                                <span className="font-mono">-${discount.toFixed(0)}</span>
                            </div>
                        )}

                        <div className="h-px bg-white/10 my-2" />

                        <div className="flex justify-between text-sm">
                            <span className="text-gray-300">Precio Unitario</span>
                            <span className="text-white font-mono font-bold">${unitPrice.toFixed(0)} / mes</span>
                        </div>

                        <div className="flex justify-between text-sm items-center">
                            <span className="text-gray-300">Multiplicador</span>
                            <span className="px-2 py-0.5 rounded bg-white/10 text-white font-mono text-xs">x{quantity} Sucursales</span>
                        </div>
                    </div>

                    {/* Real Price Comparison */}
                    <div className="border-t border-white/10 pt-4 mb-2">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-gray-500 line-through text-xs md:text-sm font-medium">Precio real: ${finalRealTotal.toLocaleString()}</span>
                            <span className="text-xs bg-[#3f1515] text-[#ff8080] px-3 py-1 rounded-full border border-red-500/30 font-bold tracking-wide shadow-sm">AHORRAS 70%</span>
                        </div>

                        <div className="flex justify-between items-end">
                            <span className="text-sm font-bold text-gray-400 mb-1">Total a Pagar ({isAnnual ? 'Anual' : 'Mensual'})</span>
                            <span className="text-4xl font-bold text-white tracking-tight">${finalTotal.toFixed(0)}</span>
                        </div>
                        <p className="text-xs text-gray-500 text-right mt-1">USD aprox: ${(finalTotal / 20).toFixed(0)}</p>
                    </div>

                    <button
                        onClick={handleCheckout}
                        disabled={isLoading}
                        className={cn(
                            "w-full py-4 rounded-xl font-bold text-lg shadow-xl transition-all flex items-center justify-center gap-2",
                            plan === 'GROWTH'
                                ? "bg-violet-600 hover:bg-violet-500 text-white shadow-violet-600/20"
                                : "bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/20",
                            isLoading && "opacity-50 cursor-not-allowed"
                        )}
                    >
                        {isLoading ? 'Procesando...' : (
                            <>
                                <Sparkles className="w-5 h-5 fill-current" />
                                Activar Plan {plan === 'GROWTH' ? 'Growth' : 'Power'}
                            </>
                        )}
                    </button>

                    <p className="text-sm text-gray-500 text-center mt-4">
                        Al hacer clic, serás redirigido a Stripe para completar tu pago de forma segura.
                    </p>

                </div>

            </div>
        </div>
    )
}
