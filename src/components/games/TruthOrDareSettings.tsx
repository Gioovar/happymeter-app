import { useState } from 'react'
import { Plus, X, Type, Flame, Eye, Skull } from 'lucide-react'

interface TruthOrDareSettingsProps {
    truths: string[]
    dares: string[]
    extremeDares: string[]
    extremeInterval: number
    onChange: (truths: string[], dares: string[], extremeDares: string[], extremeInterval: number) => void
}

export default function TruthOrDareSettings({ truths, dares, extremeDares, extremeInterval, onChange }: TruthOrDareSettingsProps) {
    const [newTruth, setNewTruth] = useState('')
    const [newDare, setNewDare] = useState('')
    const [newExtreme, setNewExtreme] = useState('')
    const [activeTab, setActiveTab] = useState<'truth' | 'dare' | 'extreme'>('truth')

    const addTruth = () => {
        if (newTruth.trim()) {
            onChange([...truths, newTruth.trim()], dares, extremeDares, extremeInterval)
            setNewTruth('')
        }
    }

    const addDare = () => {
        if (newDare.trim()) {
            onChange(truths, [...dares, newDare.trim()], extremeDares, extremeInterval)
            setNewDare('')
        }
    }

    const addExtreme = () => {
        if (newExtreme.trim()) {
            onChange(truths, dares, [...extremeDares, newExtreme.trim()], extremeInterval)
            setNewExtreme('')
        }
    }

    const removeItem = (type: 'truth' | 'dare' | 'extreme', index: number) => {
        if (type === 'truth') {
            const updated = [...truths]
            updated.splice(index, 1)
            onChange(updated, dares, extremeDares, extremeInterval)
        } else if (type === 'dare') {
            const updated = [...dares]
            updated.splice(index, 1)
            onChange(truths, updated, extremeDares, extremeInterval)
        } else {
            const updated = [...extremeDares]
            updated.splice(index, 1)
            onChange(truths, dares, updated, extremeInterval)
        }
    }

    const currentList = activeTab === 'truth' ? truths : activeTab === 'dare' ? dares : extremeDares
    const currentInput = activeTab === 'truth' ? newTruth : activeTab === 'dare' ? newDare : newExtreme
    const setCurrentInput = activeTab === 'truth' ? setNewTruth : activeTab === 'dare' ? setNewDare : setNewExtreme
    const addItem = activeTab === 'truth' ? addTruth : activeTab === 'dare' ? addDare : addExtreme

    return (
        <div className="space-y-6 animate-in fade-in">
            {/* Header */}
            <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-indigo-500/10 rounded-lg">
                    <Type className="w-5 h-5 text-indigo-500" />
                </div>
                <div>
                    <h3 className="font-bold text-white">Configuración del Juego</h3>
                    <p className="text-sm text-gray-400">Personaliza preguntas, retos y eventos extremos.</p>
                </div>
            </div>

            {/* Extreme Settings Panel */}
            <div className="p-4 bg-orange-500/10 border border-orange-500/20 rounded-xl space-y-4">
                <div className="flex items-center gap-2 text-orange-400 mb-2">
                    <Skull className="w-5 h-5" />
                    <span className="font-bold text-sm uppercase tracking-wider">Configuración Extrema</span>
                </div>

                <div className="space-y-2">
                    <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-300">Frecuencia de Retos Extremos:</span>
                        <span className="font-bold text-orange-400">Cada {extremeInterval} turnos</span>
                    </div>
                    <input
                        type="range"
                        min="5"
                        max="20"
                        step="1"
                        value={extremeInterval}
                        onChange={(e) => onChange(truths, dares, extremeDares, parseInt(e.target.value))}
                        className="w-full accent-orange-500 cursor-pointer"
                    />
                    <p className="text-xs text-gray-500 italic">
                        Recomendado: Entre 8 y 15 turnos para no saturar a los jugadores.
                    </p>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex p-1 bg-white/5 rounded-xl gap-1">
                <button
                    onClick={() => setActiveTab('truth')}
                    className={`flex-1 py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition ${activeTab === 'truth' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                >
                    <Eye className="w-4 h-4" /> Verdades
                </button>
                <button
                    onClick={() => setActiveTab('dare')}
                    className={`flex-1 py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition ${activeTab === 'dare' ? 'bg-red-600 text-white shadow-lg' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                >
                    <Flame className="w-4 h-4" /> Retos
                </button>
                <button
                    onClick={() => setActiveTab('extreme')}
                    className={`flex-1 py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition ${activeTab === 'extreme' ? 'bg-orange-600 text-white shadow-lg' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                >
                    <Skull className="w-4 h-4" /> Extremo
                </button>
            </div>

            {/* Content Editor */}
            <div className="space-y-4">
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={currentInput}
                        onChange={(e) => setCurrentInput(e.target.value)}
                        placeholder={
                            activeTab === 'truth' ? "Escribe una verdad..." :
                                activeTab === 'dare' ? "Escribe un reto..." :
                                    "Escribe un reto extremo (¡🔥!)..."
                        }
                        className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-violet-500 transition"
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') addItem()
                        }}
                    />
                    <button
                        onClick={addItem}
                        disabled={!currentInput.trim()}
                        className={`p-3 rounded-xl text-white transition disabled:opacity-50 disabled:cursor-not-allowed ${activeTab === 'truth' ? 'bg-blue-600 hover:bg-blue-500' :
                                activeTab === 'dare' ? 'bg-red-600 hover:bg-red-500' :
                                    'bg-orange-600 hover:bg-orange-500'
                            }`}
                    >
                        <Plus className="w-6 h-6" />
                    </button>
                </div>

                <div className="max-h-[300px] overflow-y-auto custom-scrollbar space-y-2 pr-2">
                    {currentList.map((item, idx) => (
                        <div key={idx} className="group flex items-center justify-between p-3 bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl transition">
                            <span className="text-sm text-gray-300 font-medium">{item}</span>
                            <button
                                onClick={() => removeItem(activeTab, idx)}
                                className="text-gray-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition p-1"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    ))}
                    {currentList.length === 0 && (
                        <p className="text-center text-gray-600 text-sm py-8 italic">
                            No hay contenido personalizado en esta sección.
                        </p>
                    )}
                </div>
            </div>
        </div>
    )
}
