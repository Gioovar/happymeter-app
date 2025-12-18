'use client'

import { RouletteOutcome, RouletteRule } from '@/types/game-roulette'
import { Trash2, Plus, Info } from 'lucide-react'

interface RouletteSettingsProps {
    outcomes: RouletteOutcome[]
    onChange: (newOutcomes: RouletteOutcome[]) => void
}

export default function RouletteSettings({ outcomes, onChange }: RouletteSettingsProps) {

    const updateOutcome = (index: number, field: keyof RouletteOutcome, value: any) => {
        const newOutcomes = [...outcomes]
        newOutcomes[index] = { ...newOutcomes[index], [field]: value }
        onChange(newOutcomes)
    }

    return (
        <div className="space-y-6">
            <div>
                <h3 className="font-bold text-white flex items-center gap-2">
                    <span className="p-2 rounded-lg bg-violet-500/10 text-violet-500"><Info className="w-5 h-5" /></span>
                    Configuración de Premios
                </h3>
                <p className="text-sm text-gray-400 mt-2 leading-relaxed">
                    Aquí defines qué premios quieres dar. Cambia el nombre, el texto de la rueda y qué tan seguido salen.
                </p>
            </div>

            {/* Common Prizes */}
            <div>
                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Premios Comunes (Suerte)</h4>
                <div className="space-y-3">
                    {outcomes.map((outcome, idx) => {
                        if (outcome.rule !== 'common') return null
                        return (
                            <div key={idx} className="p-3 bg-black/20 rounded-lg border border-white/5 space-y-2">
                                <div className="flex gap-2 items-center">
                                    <div className="w-5 h-5 rounded-full" style={{ backgroundColor: outcome.color }} />
                                    <input
                                        type="text"
                                        value={outcome.label}
                                        onChange={(e) => updateOutcome(idx, 'label', e.target.value)}
                                        className="bg-transparent border-b border-white/10 text-sm font-bold text-white w-full focus:outline-none focus:border-violet-500"
                                    />
                                </div>
                                <div className="flex justify-between items-center text-xs">
                                    <span className="text-gray-500">Probabilidad: {Math.round(outcome.probability * 100)}%</span>
                                    <div className="flex flex-col items-end gap-1">
                                        <span className="text-[10px] text-gray-600 font-bold uppercase">En la Ruleta</span>
                                        <input
                                            type="text"
                                            value={outcome.short}
                                            onChange={(e) => updateOutcome(idx, 'short', e.target.value)}
                                            className="bg-transparent border-b border-white/10 text-gray-300 w-28 text-right focus:outline-none focus:border-violet-500 transition-colors"
                                            placeholder="Texto Corto"
                                            maxLength={10}
                                        />
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>

            {/* Special Rules */}
            <div>
                <h4 className="text-xs font-bold text-amber-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                    Eventos Programados <span className="bg-amber-500/20 px-2 py-0.5 rounded text-[10px]">Jackpots</span>
                </h4>
                <p className="text-xs text-gray-500 mb-3">Estos eventos ocurren automáticamente después de cierto número de giros.</p>

                <div className="space-y-3">
                    {outcomes.map((outcome, idx) => {
                        if (outcome.rule !== 'fixed_interval') return null
                        return (
                            <div key={idx} className="p-3 bg-amber-500/5 rounded-lg border border-amber-500/20 space-y-2 relative overflow-hidden">
                                <div className="flex gap-2 items-center relative z-10">
                                    <div className="w-5 h-5 rounded-full flex items-center justify-center bg-amber-500 text-black font-bold text-[10px]">!</div>
                                    <input
                                        type="text"
                                        value={outcome.label}
                                        onChange={(e) => updateOutcome(idx, 'label', e.target.value)}
                                        className="bg-transparent border-b border-amber-500/30 text-sm font-bold text-amber-100 w-full focus:outline-none focus:border-amber-500"
                                    />
                                </div>
                                <div className="flex items-center gap-2 text-xs text-amber-200/70 relative z-10">
                                    <span>Sale cada</span>
                                    <input
                                        type="number"
                                        value={outcome.interval}
                                        onChange={(e) => updateOutcome(idx, 'interval', parseInt(e.target.value))}
                                        className="bg-black/30 w-12 text-center rounded border border-amber-500/30"
                                    />
                                    <span>giros (Programado)</span>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>
        </div>
    )
}
