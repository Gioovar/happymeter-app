'use client'

import { useState } from 'react'
import { X, Loader2, Zap, Check, Store, Info, Sparkles } from 'lucide-react'
import { updateTenantSubscription } from '@/actions/admin'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

import ImpersonateButton from './ImpersonateButton'

interface GodModeModalProps {
    isOpen: boolean
    onClose: () => void
    tenant: {
        userId: string
        businessName: string | null
        plan: string
        maxBranches?: number
        extraSurveys?: number
    }
}

const ADDONS = {
    LOYALTY: {
        id: 'loyalty',
        name: 'Lealtad',
        features: ['App de Lealtad', 'Menú Digital', 'Tarjeta Digital']
    },
    PROCESSES: {
        id: 'processes',
        name: 'Procesos',
        features: ['Flujos y Tareas', 'Supervisión IA', 'Evidencia Video']
    },
    RESERVATIONS: {
        id: 'reservations',
        name: 'Reservaciones',
        features: ['Mapa de Mesas', 'Hostess App', 'Motor de Reservas']
    }
}

export default function GodModeModal({ isOpen, onClose, tenant }: GodModeModalProps) {
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(false)

    // UI State mimicking SalesContent
    const [plan, setPlan] = useState<'GROWTH' | 'POWER' | 'CHAIN' | 'ENTERPRISE'>(
        (tenant.plan === 'GROWTH' || tenant.plan === 'POWER' || tenant.plan === 'CHAIN' || tenant.plan === 'ENTERPRISE')
            ? tenant.plan
            : 'GROWTH'
    )
    const [quantity, setQuantity] = useState(tenant.maxBranches || 1)
    const [selectedAddons, setSelectedAddons] = useState<string[]>([])
    // We keep extra surveys separate as a bonus override
    const [extraSurveys, setExtraSurveys] = useState(tenant.extraSurveys || 0)

    if (!isOpen) return null

    const toggleAddon = (id: string) => {
        setSelectedAddons(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
    }

    const handleGrant = async () => {
        setIsLoading(true)
        try {
            await updateTenantSubscription(tenant.userId, {
                plan: plan,
                maxBranches: quantity,
                extraSurveys: extraSurveys
            })
            toast.success(`Plan ${plan} asignado a ${tenant.businessName || 'Usuario'}`)
            router.refresh()
            onClose()
        } catch (error) {
            toast.error('Error al asignar plan')
            console.error(error)
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="bg-[#111] border border-orange-500/30 w-full max-w-4xl rounded-2xl shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="p-6 border-b border-white/10 flex justify-between items-center bg-[#0a0a0a] relative z-10">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-orange-500/20 flex items-center justify-center">
                            <Zap className="w-5 h-5 text-orange-500" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white">God Mode: Asignación Manual</h2>
                            <p className="text-xs text-orange-400 font-mono">LIBERAR ACCESO (SIN COBRO)</p>
                        </div>
                    </div>

                    <button onClick={onClose} className="text-gray-500 hover:text-white transition">
                        <X className="w-6 h-6" />
                    </button>

                    {/* Background Effects */}
                    <div className="absolute top-0 right-0 w-full h-1 bg-gradient-to-r from-orange-500 via-red-500 to-yellow-500" />
                </div>

                <div className="flex-1 overflow-y-auto p-6 flex flex-col md:flex-row gap-8 bg-[#0a0a0a]">

                    {/* Left Column: Configuration */}
                    <div className="flex-1 space-y-8 min-w-0">

                        {/* 1. Plan Selection */}
                        <div>
                            <h3 className="text-sm font-bold text-gray-500 uppercase mb-3 tracking-wider">1. Elige el Plan a Regalar</h3>
                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    onClick={() => setPlan('GROWTH')}
                                    className={cn(
                                        "p-4 rounded-xl border text-left transition-all relative overflow-hidden",
                                        plan === 'GROWTH' ? "bg-violet-600/10 border-violet-500" : "bg-white/5 border-white/10 hover:bg-white/10"
                                    )}
                                >
                                    <div className="flex items-center justify-between mb-2">
                                        <h4 className="font-bold text-white">Growth 1K</h4>
                                        {plan === 'GROWTH' && <Check className="w-4 h-4 text-violet-500" />}
                                    </div>
                                    <p className="text-xs text-gray-400">Todo incluido (Estándar)</p>
                                </button>

                                <button
                                    onClick={() => setPlan('POWER')}
                                    className={cn(
                                        "p-4 rounded-xl border text-left transition-all relative overflow-hidden",
                                        plan === 'POWER' ? "bg-blue-600/10 border-blue-500" : "bg-white/5 border-white/10 hover:bg-white/10"
                                    )}
                                >
                                    <div className="flex items-center justify-between mb-2">
                                        <h4 className="font-bold text-white">Power 3X</h4>
                                        {plan === 'POWER' && <Check className="w-4 h-4 text-blue-500" />}
                                    </div>
                                    <p className="text-xs text-gray-400">Modular / Avanzado</p>
                                </button>

                                <button
                                    onClick={() => setPlan('CHAIN')}
                                    className={cn(
                                        "p-4 rounded-xl border text-left transition-all relative overflow-hidden",
                                        plan === 'CHAIN' ? "bg-amber-600/10 border-amber-500" : "bg-white/5 border-white/10 hover:bg-white/10"
                                    )}
                                >
                                    <div className="flex items-center justify-between mb-2">
                                        <h4 className="font-bold text-white">Chain</h4>
                                        {plan === 'CHAIN' && <Check className="w-4 h-4 text-amber-500" />}
                                    </div>
                                    <p className="text-xs text-gray-400">Multi-sucursal</p>
                                </button>

                                <button
                                    onClick={() => setPlan('ENTERPRISE')}
                                    className={cn(
                                        "p-4 rounded-xl border text-left transition-all relative overflow-hidden",
                                        plan === 'ENTERPRISE' ? "bg-red-600/10 border-red-500" : "bg-white/5 border-white/10 hover:bg-white/10"
                                    )}
                                >
                                    <div className="flex items-center justify-between mb-2">
                                        <h4 className="font-bold text-white">Enterprise</h4>
                                        {plan === 'ENTERPRISE' && <Check className="w-4 h-4 text-red-500" />}
                                    </div>
                                    <p className="text-xs text-gray-400">Custom</p>
                                </button>
                            </div>
                        </div>

                        {/* 2. Configure Modules (Visual only for now as Plan grants all, but good for admin to see) */}
                        {plan === 'POWER' && (
                            <div className="animate-in slide-in-from-top-4 fade-in duration-300">
                                <h3 className="text-sm font-bold text-gray-500 uppercase mb-3 tracking-wider">2. Módulos Incluidos (Referencia)</h3>
                                <div className="space-y-2 opacity-75">
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
                                                        <span className={cn("font-medium text-sm block", isSelected ? "text-white" : "text-gray-400")}>{addon.name}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        )
                                    })}
                                    <p className="text-[10px] text-gray-500 italic mt-1">* Nota: Al asignar POWER desde God Mode, técnicamente se habilita todo, pero puedes marcar esto para registro visual.</p>
                                </div>
                            </div>
                        )}

                        {/* 3. Quantity & Extras */}
                        <div>
                            <h3 className="text-sm font-bold text-gray-500 uppercase mb-3 tracking-wider">3. Capacidad y Extras</h3>

                            <div className="space-y-4">
                                {/* Max Branches */}
                                <div className="flex items-center justify-between bg-white/5 p-4 rounded-xl border border-white/10">
                                    <div>
                                        <h4 className="text-white font-bold flex items-center gap-2">
                                            <Store className="w-4 h-4 text-gray-400" />
                                            Sucursales Permitidas
                                        </h4>
                                        <p className="text-xs text-gray-500 mt-1">Límite de locales para este usuario.</p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="w-8 h-8 rounded-lg bg-white/10 text-white hover:bg-white/20 flex items-center justify-center font-bold">-</button>
                                        <input
                                            type="number"
                                            value={quantity}
                                            onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                                            className="bg-transparent text-xl font-bold text-white w-12 text-center outline-none"
                                        />
                                        <button onClick={() => setQuantity(quantity + 1)} className="w-8 h-8 rounded-lg bg-white/10 text-white hover:bg-white/20 flex items-center justify-center font-bold">+</button>
                                    </div>
                                </div>

                                {/* Extra Surveys */}
                                <div className="flex items-center justify-between bg-white/5 p-4 rounded-xl border border-white/10">
                                    <div>
                                        <h4 className="text-white font-bold flex items-center gap-2">
                                            <Store className="w-4 h-4 text-gray-400" />
                                            Encuestas Extra
                                        </h4>
                                        <p className="text-xs text-gray-500 mt-1">Paquetes adicionales de encuestas.</p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <button onClick={() => setExtraSurveys(Math.max(0, extraSurveys - 1))} className="w-8 h-8 rounded-lg bg-white/10 text-white hover:bg-white/20 flex items-center justify-center font-bold">-</button>
                                        <input
                                            type="number"
                                            value={extraSurveys}
                                            onChange={(e) => setExtraSurveys(Math.max(0, parseInt(e.target.value) || 0))}
                                            className="bg-transparent text-xl font-bold text-white w-12 text-center outline-none"
                                        />
                                        <button onClick={() => setExtraSurveys(extraSurveys + 1)} className="w-8 h-8 rounded-lg bg-white/10 text-white hover:bg-white/20 flex items-center justify-center font-bold">+</button>
                                    </div>
                                </div>
                            </div>
                        </div>

                    </div>

                    {/* Right Column: Confirmation */}
                    <div className="w-full md:w-80 shrink-0 bg-[#111] border border-white/10 rounded-2xl p-6 flex flex-col h-fit sticky top-0">
                        <div className="mb-6 pb-4 border-b border-white/10">
                            <h3 className="text-xs font-bold text-gray-500 uppercase mb-3 tracking-wider flex items-center gap-2">
                                <Sparkles className="w-3 h-3 text-yellow-500" /> Acciones Rápidas
                            </h3>
                            <div className="flex justify-center">
                                <ImpersonateButton userId={tenant.userId} name={tenant.businessName || 'Usuario'} />
                            </div>
                            <p className="text-[10px] text-gray-500 text-center mt-2">
                                Entra como el usuario para configurar su cuenta.
                            </p>
                        </div>

                        <h3 className="text-lg font-bold text-white mb-6">Resumen de Asignación</h3>

                        <div className="space-y-4 mb-6 flex-1">
                            <div className="p-4 bg-orange-500/10 border border-orange-500/20 rounded-lg">
                                <p className="text-orange-200 text-xs font-mono mb-1">USUARIO DESTINO:</p>
                                <p className="text-white font-bold text-lg">{tenant.businessName || tenant.userId}</p>
                            </div>

                            <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-400">Nuevo Plan</span>
                                    <span className="text-white font-bold">{plan}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-400">Sucursales (Max)</span>
                                    <span className="text-white font-bold">{quantity}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-400">Extra Surveys</span>
                                    <span className="text-white font-bold">{extraSurveys}</span>
                                </div>
                            </div>
                        </div>

                        <div className="border-t border-white/10 pt-4 mt-auto">
                            <button
                                onClick={handleGrant}
                                disabled={isLoading}
                                className="w-full py-4 rounded-xl font-bold text-lg shadow-xl transition-all flex items-center justify-center gap-2 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 text-white shadow-orange-900/20"
                            >
                                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                                    <>
                                        <Zap className="w-5 h-5 fill-current" />
                                        LIBERAR ACCESO AHORA
                                    </>
                                )}
                            </button>
                            <p className="text-xs text-center text-gray-500 mt-3">
                                Esta acción actualiza la base de datos inmediatamente. No genera cobros.
                            </p>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    )
}
