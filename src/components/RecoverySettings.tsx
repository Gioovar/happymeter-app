'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Gift, Sparkles, Wand2, Loader2 } from 'lucide-react'

interface RecoveryConfig {
    enabled: boolean
    offer: string
    code: string
    activeDays: number
}

export default function RecoverySettings({ initialConfig, onSave }: { initialConfig: RecoveryConfig | null, onSave: (config: RecoveryConfig) => Promise<void> }) {
    const [config, setConfig] = useState<RecoveryConfig>(initialConfig || {
        enabled: false,
        offer: 'Un Postre Gratis',
        code: `PERDON-${new Date().getFullYear()}`,
        activeDays: 30
    })
    const [isSaving, setIsSaving] = useState(false)

    const handleSave = async () => {
        setIsSaving(true)
        await onSave(config)
        setIsSaving(false)
    }

    return (
        <div className="bg-[#1a2021] border border-white/5 rounded-2xl p-6 space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-pink-500/20 flex items-center justify-center">
                        <Gift className="w-5 h-5 text-pink-400" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-white flex items-center gap-2">
                            Recuperación Inteligente <span className="text-xs bg-pink-500 text-white px-2 py-0.5 rounded-full">Pro</span>
                        </h3>
                        <p className="text-sm text-gray-400">Genera cupones automáticos para clientes insatisfechos.</p>
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
                        className="space-y-4 overflow-hidden"
                    >
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-400">Oferta de Disculpa</label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={config.offer}
                                        onChange={(e) => setConfig({ ...config, offer: e.target.value })}
                                        className="w-full bg-[#0f1516] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-pink-500/50"
                                        placeholder="Ej: Un Postre Gratis"
                                    />
                                    <Sparkles className="absolute right-3 top-3 w-5 h-5 text-pink-500 opacity-50" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-400">Código del Cupón</label>
                                <input
                                    type="text"
                                    value={config.code}
                                    onChange={(e) => setConfig({ ...config, code: e.target.value.toUpperCase() })}
                                    className="w-full bg-[#0f1516] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-pink-500/50"
                                    placeholder="Ej: DISCULPA2024"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-400">Vista Previa del Mensaje (WhatsApp)</label>
                            <div className="bg-[#0f1516] border border-green-500/20 rounded-xl p-4 text-sm text-gray-300 relative">
                                <p>
                                    Hola [Cliente], sentimos tu mala experiencia. Queremos arreglarlo:
                                    <br />
                                    Vuelve y muestra este código <strong>{config.code}</strong> para <strong>{config.offer}</strong>.
                                </p>
                                <div className="absolute top-2 right-2 text-green-500/40 text-[10px]">VISTA PREVIA</div>
                            </div>
                        </div>

                        <div className="flex justify-end pt-2">
                            <button
                                onClick={handleSave}
                                disabled={isSaving}
                                className="px-6 py-2 bg-pink-600 hover:bg-pink-500 text-white rounded-xl font-bold transition flex items-center gap-2"
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
