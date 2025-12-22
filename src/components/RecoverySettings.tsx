'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Gift, Sparkles, Wand2, Loader2, AlertCircle, Meh, Smile } from 'lucide-react'

// Single tier config
interface RewardTier {
    enabled: boolean
    offer: string
    code: string
}

// Full config structure
interface RecoveryConfig {
    enabled: boolean // Master switch
    bad: RewardTier
    neutral: RewardTier
    good: RewardTier
    activeDays: number
}

export default function RecoverySettings({ initialConfig, onSave }: { initialConfig: any | null, onSave: (config: RecoveryConfig) => Promise<void> }) {
    // Migration Logic: if old config exists, map it to 'bad' tier (recuperation) and set defaults for others
    const migrateConfig = (old: any): RecoveryConfig => {
        if (!old) return {
            enabled: false,
            bad: { enabled: true, offer: 'Un Postre Gratis', code: `PERDON-${new Date().getFullYear()}` },
            neutral: { enabled: true, offer: '10% de Descuento', code: `VUELVE-${new Date().getFullYear()}` },
            good: { enabled: true, offer: '2x1 en Bebidas', code: `VIP-${new Date().getFullYear()}` },
            activeDays: 30
        }

        // If it already has tiers, return it
        if (old.bad && old.neutral && old.good) return old as RecoveryConfig

        // If it's the old flat structure, migrate it to 'bad' tier
        return {
            enabled: old.enabled || false,
            bad: { enabled: true, offer: old.offer || 'Un Postre Gratis', code: old.code || `PERDON-${new Date().getFullYear()}` },
            // Default new tiers
            neutral: { enabled: false, offer: '10% de Descuento', code: `VUELVE-${new Date().getFullYear()}` },
            good: { enabled: false, offer: '2x1 en Bebidas', code: `VIP-${new Date().getFullYear()}` },
            activeDays: old.activeDays || 30
        }
    }

    const [config, setConfig] = useState<RecoveryConfig>(migrateConfig(initialConfig))
    const [activeTab, setActiveTab] = useState<'bad' | 'neutral' | 'good'>('bad')
    const [isSaving, setIsSaving] = useState(false)

    const handleSave = async () => {
        setIsSaving(true)
        await onSave(config)
        setIsSaving(false)
    }

    const updateTier = (tier: 'bad' | 'neutral' | 'good', field: keyof RewardTier, value: any) => {
        setConfig(prev => ({
            ...prev,
            [tier]: {
                ...prev[tier],
                [field]: value
            }
        }))
    }

    const tabs = [
        { id: 'bad', label: 'Insatisfecho (1-2 ⭐)', icon: AlertCircle, color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20' },
        { id: 'neutral', label: 'Regular (3 ⭐)', icon: Meh, color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/20' },
        { id: 'good', label: 'Satisfecho (4-5 ⭐)', icon: Smile, color: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/20' }
    ]

    const currentTier = config[activeTab]

    return (
        <div className="bg-[#1a2021] border border-white/5 rounded-2xl p-6 space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-pink-500/20 flex items-center justify-center">
                        <Gift className="w-5 h-5 text-pink-400" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-white flex items-center gap-2">
                            Sistema de Recompensas <span className="text-xs bg-pink-500 text-white px-2 py-0.5 rounded-full">Pro</span>
                        </h3>
                        <p className="text-sm text-gray-400">Configura regalos automáticos según la calificación del cliente.</p>
                    </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" checked={config.enabled} onChange={(e) => setConfig({ ...config, enabled: e.target.checked })} className="sr-only peer" />
                    <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-pink-500"></div>
                </label>
            </div>

            <AnimatePresence>
                {config.enabled && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="space-y-6 overflow-hidden"
                    >
                        {/* Tabs */}
                        <div className="flex bg-[#0f1516] p-1 rounded-xl">
                            {tabs.map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id as any)}
                                    className={`flex-1 py-2 px-3 rounded-lg text-sm font-bold transition flex items-center justify-center gap-2 ${activeTab === tab.id ? `${tab.bg} ${tab.color} shadow-sm border ${tab.border}` : 'text-gray-500 hover:text-white'}`}
                                >
                                    <tab.icon className="w-4 h-4" />
                                    <span className="hidden md:inline">{tab.label}</span>
                                </button>
                            ))}
                        </div>

                        {/* Config Area */}
                        <div className="bg-[#0f1516] border border-white/5 rounded-xl p-6 relative">
                            <div className="flex justify-between items-center mb-6">
                                <h4 className={`text-sm font-bold flex items-center gap-2 ${tabs.find(t => t.id === activeTab)?.color}`}>
                                    Configuración para Cliente {tabs.find(t => t.id === activeTab)?.label}
                                </h4>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <span className="mr-2 text-xs text-gray-400">Activar Nivel</span>
                                    <input
                                        type="checkbox"
                                        checked={currentTier.enabled}
                                        onChange={(e) => updateTier(activeTab, 'enabled', e.target.checked)}
                                        className="sr-only peer"
                                    />
                                    <div className="w-9 h-5 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-violet-500"></div>
                                </label>
                            </div>

                            {currentTier.enabled ? (
                                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-xs font-medium text-gray-400">Regalo / Oferta</label>
                                            <div className="relative">
                                                <input
                                                    type="text"
                                                    value={currentTier.offer}
                                                    onChange={(e) => updateTier(activeTab, 'offer', e.target.value)}
                                                    className="w-full bg-[#1a2021] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-pink-500/50 text-sm"
                                                    placeholder="Ej: Postre Gratis"
                                                />
                                                <Sparkles className="absolute right-3 top-3 w-4 h-4 text-pink-500 opacity-50" />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-medium text-gray-400">Código del Cupón</label>
                                            <input
                                                type="text"
                                                value={currentTier.code}
                                                onChange={(e) => updateTier(activeTab, 'code', e.target.value.toUpperCase())}
                                                className="w-full bg-[#1a2021] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-pink-500/50 text-sm font-mono"
                                                placeholder="Ej: PROMO2025"
                                            />
                                        </div>
                                    </div>

                                    <div className="bg-[#1a2021] border border-white/5 rounded-xl p-4 flex gap-3 items-start">
                                        <div className="p-2 bg-green-500/10 rounded-lg shrink-0">
                                            <Wand2 className="w-4 h-4 text-green-400" />
                                        </div>
                                        <div>
                                            <h5 className="text-xs font-bold text-gray-300 mb-1">Así se verá en WhatsApp:</h5>
                                            <p className="text-xs text-gray-500 italic">
                                                "...Hola [Cliente], {activeTab === 'bad' ? 'sentimos tu mala experiencia' : activeTab === 'neutral' ? 'gracias por tus comentarios' : 'nos alegra que te haya gustado'}.
                                                Te regalamos este código <strong>{currentTier.code}</strong> para <strong>{currentTier.offer}</strong>..."
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="py-8 text-center text-gray-500 text-sm italic">
                                    Este nivel de recompensa está desactivado.
                                </div>
                            )}
                        </div>

                        <div className="flex justify-end pt-2">
                            <button
                                onClick={handleSave}
                                disabled={isSaving}
                                className="px-6 py-2 bg-pink-600 hover:bg-pink-500 text-white rounded-xl font-bold transition flex items-center gap-2 shadow-lg shadow-pink-600/20"
                            >
                                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
                                Guardar Configuración
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
