'use client'

import React from 'react'
import { Check, Sparkles, Users, Info, X } from 'lucide-react'
import Link from 'next/link'

const ADDONS = {
    LOYALTY: {
        id: 'loyalty',
        name: 'Lealtad',
        monthly: 699,
        annual: 599,
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
    const [isAnnual, setIsAnnual] = React.useState(true)
    const [selectedAddons, setSelectedAddons] = React.useState<string[]>([])
    const [viewingAddon, setViewingAddon] = React.useState<string | null>(null)
    const [showComparison, setShowComparison] = React.useState(false)

    const toggleAddon = (id: string) => {
        setSelectedAddons(prev =>
            prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
        )
    }

    // Pricing Calculation
    const basePrice = isAnnual ? 399 : 450
    const addonPriceRaw = selectedAddons.reduce((acc, id) => {
        const addon = Object.values(ADDONS).find(a => a.id === id)
        return acc + (isAnnual ? addon!.annual : addon!.monthly)
    }, 0)

    let discountRate = 0
    if (selectedAddons.length === 2) discountRate = 0.15
    if (selectedAddons.length === 3) discountRate = 0.20

    const discountAmount = addonPriceRaw * discountRate
    const addonPriceFinal = addonPriceRaw - discountAmount
    const totalPrice = basePrice + addonPriceFinal

    const viewingAddonData = viewingAddon ? Object.values(ADDONS).find(a => a.id === viewingAddon) : null

    const [isLoading, setIsLoading] = React.useState(false)

    const handleCheckout = async () => {
        setIsLoading(true)
        try {
            const response = await fetch('/api/checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    plan: 'custom',
                    base: 'GROWTH',
                    addons: selectedAddons,
                    interval: isAnnual ? 'year' : 'month'
                })
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
            alert(`Error: ${error.message}`)
            setIsLoading(false)
        }
    }

    return (
        <section className="py-24 bg-[#0a0a0a] border-t border-white/5 relative">
            {/* Module Detail Modal */}
            {viewingAddonData && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setViewingAddon(null)}>
                    <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl p-6 max-w-md w-full shadow-2xl relative" onClick={e => e.stopPropagation()}>
                        <button
                            onClick={() => setViewingAddon(null)}
                            className="absolute top-4 right-4 text-gray-400 hover:text-white transition"
                        >
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
                            <button
                                onClick={() => {
                                    if (!selectedAddons.includes(viewingAddonData.id)) {
                                        toggleAddon(viewingAddonData.id)
                                    }
                                    setViewingAddon(null)
                                }}
                                className="w-full py-3 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-500 transition"
                            >
                                {selectedAddons.includes(viewingAddonData.id) ? 'Cerrar' : 'Agregar al Plan'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Comparison Table Modal */}
            {showComparison && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-200" onClick={() => setShowComparison(false)}>
                    <div className="bg-[#0a0a0a] border border-blue-500/20 rounded-3xl p-8 max-w-6xl w-full max-h-[90vh] overflow-y-auto shadow-2xl shadow-blue-500/20 relative" onClick={e => e.stopPropagation()}>
                        <button
                            onClick={() => setShowComparison(false)}
                            className="absolute top-6 right-6 p-2 rounded-full bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition"
                        >
                            <X className="w-6 h-6" />
                        </button>

                        <div className="text-center mb-10">
                            <h3 className="text-3xl font-bold text-white mb-4">Tabla de Funciones Power 3X</h3>
                            <p className="text-gray-400">Detalle completo de cada módulo disponible para agregar a tu plan.</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            {/* Base Module: Encuestas */}
                            <div className="bg-white/5 rounded-2xl p-6 border border-white/5 hover:border-violet-500/50 hover:shadow-lg hover:shadow-violet-500/20 transition duration-300 group relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition">
                                    <Sparkles className="w-24 h-24 text-violet-500" />
                                </div>
                                <div className="flex items-center gap-3 mb-6 relative">
                                    <h4 className="text-xl font-bold text-white group-hover:text-violet-400 transition">Encuestas</h4>
                                    <span className="text-[10px] font-bold px-2 py-1 rounded bg-violet-500/20 text-violet-400 uppercase tracking-wide">Base</span>
                                </div>
                                <ul className="space-y-4 relative">
                                    {[
                                        'Asistente de IA (Acceso Completo)',
                                        'Encuestas, Buzón y Feedback',
                                        'Gestión de Equipo y Accesos',
                                        'Analítica y Reportes',
                                        'Campañas (Meta / WhatsApp)'
                                    ].map((feature, idx) => (
                                        <li key={idx} className="flex items-start gap-3 text-sm text-gray-300">
                                            <div className="min-w-[4px] h-[4px] bg-gray-500 rounded-full mt-2 group-hover:bg-violet-500 transition" />
                                            {feature}
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            {/* Add-ons */}
                            {Object.values(ADDONS).map((addon) => (
                                <div key={addon.id} className="bg-white/5 rounded-2xl p-6 border border-white/5 hover:border-blue-500/50 hover:shadow-lg hover:shadow-blue-500/20 transition duration-300 group">
                                    <div className="flex items-center gap-3 mb-6">
                                        <h4 className="text-xl font-bold text-white group-hover:text-blue-400 transition">{addon.name}</h4>
                                        <span className="text-[10px] font-bold px-2 py-1 rounded bg-blue-500/20 text-blue-400 uppercase tracking-wide">Módulo</span>
                                    </div>
                                    <ul className="space-y-4">
                                        {addon.fullFeatures.map((feature, idx) => (
                                            <li key={idx} className="flex items-start gap-3 text-sm text-gray-300">
                                                <div className="min-w-[4px] h-[4px] bg-gray-500 rounded-full mt-2 group-hover:bg-blue-500 transition" />
                                                {feature}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            ))}
                        </div>

                        <div className="mt-12 text-center">
                            <button
                                onClick={() => setShowComparison(false)}
                                className="px-8 py-3 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-500 transition shadow-lg shadow-blue-600/20"
                            >
                                Entendido
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="max-w-7xl mx-auto px-6">
                <div className="text-center mb-12">
                    <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">Inversión transparente</h2>
                    <p className="text-gray-400 text-lg mb-8">Sin contratos forzosos. Cancela cuando quieras.</p>

                    {/* Toggle */}
                    <div className="flex items-center justify-center gap-4">
                        <span className={`text-sm font-medium ${!isAnnual ? 'text-white' : 'text-gray-500'}`}>Mensual</span>
                        <button
                            onClick={() => setIsAnnual(!isAnnual)}
                            className="relative w-14 h-8 bg-white/10 rounded-full p-1 transition-colors hover:bg-white/20"
                        >
                            <div className={`w-6 h-6 bg-violet-600 rounded-full shadow-lg transform transition-transform ${isAnnual ? 'translate-x-6' : 'translate-x-0'}`} />
                        </button>
                        <span className={`text-sm font-medium ${isAnnual ? 'text-white' : 'text-gray-500'}`}>Anual</span>
                        {isAnnual && <span className="ml-2 text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded-full animate-pulse">Ahorra hasta 20%</span>}
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto items-start">

                    {/* Starter Tier */}
                    <div className="p-8 rounded-3xl bg-[#111] border border-white/5 flex flex-col hover:border-white/10 transition duration-300">
                        <div className="mb-6">
                            <h3 className="text-xl font-bold text-white mb-2">Starter Test</h3>
                            <div className="flex items-baseline gap-1">
                                <span className="text-4xl font-bold text-white">$0</span>
                            </div>
                            <p className="text-gray-500 text-sm mt-2">Prueba el poder de HappyMeter por 7 días.</p>
                        </div>
                        <p className="text-violet-400 text-xs font-bold uppercase mb-4 tracking-wide">Incluye IA y herramientas clave:</p>
                        <ul className="space-y-4 mb-8 flex-1">
                            <li className="flex flex-col gap-1 text-gray-300 text-sm">
                                <span className="flex items-center gap-3 font-bold text-white"><Sparkles className="w-4 h-4 text-violet-500" /> Encuestas con IA</span>
                                <span className="ml-7 text-xs text-gray-400">IA propia, Satisfacción y Staff (Max 50 respuestas c/u)</span>
                            </li>
                            <li className="flex flex-col gap-1 text-gray-300 text-sm">
                                <span className="flex items-center gap-3 font-bold text-white"><Check className="w-4 h-4 text-violet-500" /> Programa de Lealtad</span>
                                <span className="ml-7 text-xs text-gray-400">1 programa activo para fidelizar clientes</span>
                            </li>
                            <li className="flex flex-col gap-1 text-gray-300 text-sm">
                                <span className="flex items-center gap-3 font-bold text-white"><Check className="w-4 h-4 text-violet-500" /> Supervisión y Procesos</span>
                                <span className="ml-7 text-xs text-gray-400">1 flujo de supervisión, 1 tarea asignada</span>
                            </li>
                            <li className="flex flex-col gap-1 text-gray-300 text-sm">
                                <span className="flex items-center gap-3 font-bold text-white"><Check className="w-4 h-4 text-violet-500" /> Sistema de Reservaciones</span>
                                <span className="ml-7 text-xs text-gray-400">Acceso completo por 7 días (Bloqueo automático)</span>
                            </li>
                        </ul>
                        <Link href="/sign-up">
                            <button className="w-full py-3 rounded-xl bg-white/5 text-white font-bold hover:bg-white/10 transition border border-white/10">
                                Comenzar Prueba
                            </button>
                        </Link>
                    </div>

                    {/* Growth Tier */}
                    <div className="p-8 rounded-3xl bg-[#1a1a1a] border border-violet-500/30 flex flex-col hover:border-violet-500/50 transition duration-300">
                        <div className="mb-6">
                            <h3 className="text-xl font-bold text-white mb-2">Growth 1K</h3>
                            <div className="flex items-baseline gap-1">
                                <span className="text-5xl font-bold text-white tracking-tight">
                                    {isAnnual ? '$399' : '$450'}
                                </span>
                                <span className="text-gray-400 text-sm">MXN/mes</span>
                            </div>
                            {isAnnual ? (
                                <p className="text-green-400 text-xs mt-1 font-medium transform">Ahorra $51 al mes pagando anual</p>
                            ) : (
                                <p className="text-gray-500 text-xs mt-1 font-medium">Pago mensual sin plazo forzoso</p>
                            )}
                            <p className="text-gray-400 text-sm mt-4">Para negocios que quieren operar de forma activa y continua.</p>
                        </div>
                        <ul className="space-y-4 mb-8 flex-1">
                            <li className="flex items-center gap-3 text-white font-medium text-sm">
                                <div className="p-1 rounded-full bg-violet-500/20 text-violet-400 shrink-0"><Sparkles className="w-3 h-3" /></div>
                                Asistente de IA (Acceso Completo)
                            </li>
                            <li className="flex items-center gap-3 text-white font-medium text-sm">
                                <div className="p-1 rounded-full bg-violet-500/20 text-violet-400 shrink-0"><Check className="w-3 h-3" /></div>
                                Encuestas, Buzón y Feedback
                            </li>
                            <li className="flex items-center gap-3 text-white font-medium text-sm">
                                <div className="p-1 rounded-full bg-violet-500/20 text-violet-400 shrink-0"><Users className="w-3 h-3" /></div>
                                Gestión de Equipo y Accesos
                            </li>
                            <li className="flex items-center gap-3 text-white font-medium text-sm">
                                <div className="p-1 rounded-full bg-violet-500/20 text-violet-400 shrink-0"><Check className="w-3 h-3" /></div>
                                Analítica y Reportes
                            </li>
                            <li className="flex items-center gap-3 text-white font-medium text-sm">
                                <div className="p-1 rounded-full bg-violet-500/20 text-violet-400 shrink-0"><Check className="w-3 h-3" /></div>
                                Campañas (Meta / WhatsApp)
                            </li>
                            <li className="flex items-center gap-3 text-white font-medium text-sm">
                                <div className="p-1 rounded-full bg-violet-500/20 text-violet-400 shrink-0"><Check className="w-3 h-3" /></div>
                                Acceso Academia HappyMeter
                            </li>
                        </ul>
                        <Link href={`/pricing?checkout=true&plan=GROWTH&interval=${isAnnual ? 'year' : 'month'}`}>
                            <button className="w-full py-3.5 rounded-xl bg-violet-600 text-white font-bold hover:bg-violet-500 transition shadow-lg shadow-violet-600/20">
                                👉 Activar Growth 1K
                            </button>
                        </Link>
                    </div>

                    {/* Power 3X Tier (Modular) */}
                    <div className="relative p-8 rounded-3xl bg-[#111] border border-blue-500 flex flex-col shadow-2xl shadow-blue-500/10 z-10">
                        <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-blue-600 text-white px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wider shadow-lg">
                            Plan Inteligente
                        </div>
                        <div className="mb-6">
                            <h3 className="text-xl font-bold text-white mb-2">Power 3X</h3>
                            <p className="text-sm text-gray-400 mb-4">Arma tu propio sistema. Incluye todo lo de <strong>Growth 1K</strong> + Módulos:</p>
                        </div>

                        {/* Module Toggles */}
                        <div className="space-y-3 mb-8">
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
                                                    Beneficios
                                                </button>
                                            </div>
                                            <div className="text-right">
                                                <span className={`block font-bold ${isSelected ? 'text-white' : 'text-gray-500'}`}>${price}</span>
                                            </div>
                                        </div>
                                        {/* Mini Features */}
                                        {isSelected && (
                                            <div className="mt-2 text-xs text-gray-400 pl-8">
                                                {addon.features.join(', ')}
                                            </div>
                                        )}
                                    </div>
                                )
                            })}
                        </div>

                        {/* Dynamic Summary */}
                        <div className="mt-auto bg-[#000]/50 p-4 rounded-xl space-y-2 border border-white/5 mb-6">
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
                            <div className="border-t border-white/10 mt-2 pt-2 flex justify-between items-baseline">
                                <span className="text-white font-bold">Total Mensual</span>
                                <span className="text-3xl font-bold text-white">${totalPrice.toFixed(0)}</span>
                            </div>
                        </div>

                        <button
                            onClick={handleCheckout}
                            disabled={isLoading}
                            className="w-full py-3.5 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-500 transition shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2"
                        >
                            {isLoading ? 'Cargando...' : '👉 Armar Plan Power'}
                        </button>
                    </div>

                </div>

                <div className="mt-12 text-center">
                    <button
                        onClick={() => setShowComparison(true)}
                        className="text-violet-400 hover:text-white transition underline text-sm"
                    >
                        Ver tabla detallada de funciones por módulo
                    </button>
                </div>
            </div>
        </section>
    )
}
