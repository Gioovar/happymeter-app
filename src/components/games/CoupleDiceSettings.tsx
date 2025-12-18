'use client'

import { useState } from 'react'
import { Plus, Trash, RotateCcw, Flame, Skull } from 'lucide-react'
import { DiceItem, DEFAULT_STANDARD_ACTIONS, DEFAULT_STANDARD_BODY_PARTS, DEFAULT_EXTREME_ACTIONS, DEFAULT_EXTREME_BODY_PARTS } from '@/types/game-couple'

interface CoupleDiceSettingsProps {
    standardActions: DiceItem[]
    extremeActions: DiceItem[]
    standardBodyParts: DiceItem[]
    extremeBodyParts: DiceItem[]
    intensity: 'standard' | 'extreme'
    onUpdate: (
        sActions: DiceItem[],
        eActions: DiceItem[],
        sParts: DiceItem[],
        eParts: DiceItem[],
        intensity: 'standard' | 'extreme'
    ) => void
}

export default function CoupleDiceSettings({
    standardActions,
    extremeActions,
    standardBodyParts,
    extremeBodyParts,
    intensity,
    onUpdate
}: CoupleDiceSettingsProps) {

    const [activeTab, setActiveTab] = useState<'standard' | 'extreme'>('standard')

    // Helper to update a specific list
    const updateList = (
        listType: 'actions' | 'parts',
        mode: 'standard' | 'extreme',
        newList: DiceItem[]
    ) => {
        const sActions = mode === 'standard' && listType === 'actions' ? newList : standardActions
        const eActions = mode === 'extreme' && listType === 'actions' ? newList : extremeActions
        const sParts = mode === 'standard' && listType === 'parts' ? newList : standardBodyParts
        const eParts = mode === 'extreme' && listType === 'parts' ? newList : extremeBodyParts

        onUpdate(sActions, eActions, sParts, eParts, intensity)
    }

    const addItem = (listType: 'actions' | 'parts', mode: 'standard' | 'extreme') => {
        const list = mode === 'standard'
            ? (listType === 'actions' ? standardActions : standardBodyParts)
            : (listType === 'actions' ? extremeActions : extremeBodyParts)

        const newItem: DiceItem = { text: "Nuevo", icon: "✨", color: "text-white" }
        updateList(listType, mode, [...list, newItem])
    }

    const removeItem = (listType: 'actions' | 'parts', mode: 'standard' | 'extreme', index: number) => {
        const list = mode === 'standard'
            ? (listType === 'actions' ? standardActions : standardBodyParts)
            : (listType === 'actions' ? extremeActions : extremeBodyParts)

        if (list.length <= 2) return; // Minimum items

        const newList = [...list]
        newList.splice(index, 1)
        updateList(listType, mode, newList)
    }

    const editItem = (
        listType: 'actions' | 'parts',
        mode: 'standard' | 'extreme',
        index: number,
        field: keyof DiceItem,
        value: string
    ) => {
        const list = mode === 'standard'
            ? (listType === 'actions' ? standardActions : standardBodyParts)
            : (listType === 'actions' ? extremeActions : extremeBodyParts)

        const newList = [...list]
        newList[index] = { ...newList[index], [field]: value }
        updateList(listType, mode, newList)
    }

    return (
        <div className="bg-[#111] border border-white/10 rounded-2xl p-6 space-y-8">

            {/* Intensity Toggle */}
            <div>
                <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                    <Flame className="w-5 h-5 text-orange-500" />
                    Modo de Juego Principal
                </h3>
                <div className="flex p-1 bg-white/5 rounded-xl">
                    <button
                        onClick={() => onUpdate(standardActions, extremeActions, standardBodyParts, extremeBodyParts, 'standard')}
                        className={`flex-1 py-2 rounded-lg text-sm font-bold transition flex items-center justify-center gap-2 ${intensity === 'standard' ? 'bg-purple-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
                    >
                        <Flame className="w-4 h-4" /> Romántico (Standard)
                    </button>
                    <button
                        onClick={() => onUpdate(standardActions, extremeActions, standardBodyParts, extremeBodyParts, 'extreme')}
                        className={`flex-1 py-2 rounded-lg text-sm font-bold transition flex items-center justify-center gap-2 ${intensity === 'extreme' ? 'bg-red-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
                    >
                        <Skull className="w-4 h-4" /> Extremo (Hot)
                    </button>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                    Este es el modo que los clientes verán por defecto al escanear.
                </p>
            </div>

            <div className="w-full h-px bg-white/5" />

            {/* List Editor Tabs */}
            <div>
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-white font-bold">Personalizar Dados</h3>
                    <div className="flex gap-2 text-xs">
                        <button
                            onClick={() => setActiveTab('standard')}
                            className={`px-3 py-1 rounded-full border transition ${activeTab === 'standard' ? 'bg-purple-500/20 border-purple-500 text-purple-400' : 'border-transparent text-gray-500 hover:text-white hover:bg-white/5'}`}
                        >
                            Lista Standard
                        </button>
                        <button
                            onClick={() => setActiveTab('extreme')}
                            className={`px-3 py-1 rounded-full border transition ${activeTab === 'extreme' ? 'bg-red-500/20 border-red-500 text-red-400' : 'border-transparent text-gray-500 hover:text-white hover:bg-white/5'}`}
                        >
                            Lista Extrema
                        </button>
                    </div>
                </div>

                {/* Single Column Layout */}
                <div className="flex flex-col space-y-12">

                    {/* Actions Section */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-3 border-b border-white/10 pb-4">
                            <div className={`p-3 rounded-xl ${activeTab === 'extreme' ? 'bg-red-500/20 text-red-500' : 'bg-purple-500/20 text-purple-400'}`}>
                                <h2 className="text-2xl font-black">DADO 1</h2>
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-white">Acciones / Retos</h3>
                                <p className="text-zinc-500 text-sm">Lo que tendrán que hacer (ej. Besar, Beber).</p>
                            </div>
                        </div>

                        <ListEditor
                            items={activeTab === 'standard' ? standardActions : extremeActions}
                            onAdd={() => addItem('actions', activeTab)}
                            onRemove={(i) => removeItem('actions', activeTab, i)}
                            onEdit={(i, f, v) => editItem('actions', activeTab, i, f, v)}
                            accentColor={activeTab === 'extreme' ? 'text-red-500' : 'text-purple-400'}
                        />
                    </div>

                    {/* Body Parts Section */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-3 border-b border-white/10 pb-4">
                            <div className={`p-3 rounded-xl ${activeTab === 'extreme' ? 'bg-red-500/20 text-red-500' : 'bg-purple-500/20 text-purple-400'}`}>
                                <h2 className="text-2xl font-black">DADO 2</h2>
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-white">Lugares / Premios</h3>
                                <p className="text-zinc-500 text-sm">Dónde o con qué lo harán (ej. Cuello, 1 Shot).</p>
                            </div>
                        </div>

                        <ListEditor
                            items={activeTab === 'standard' ? standardBodyParts : extremeBodyParts}
                            onAdd={() => addItem('parts', activeTab)}
                            onRemove={(i) => removeItem('parts', activeTab, i)}
                            onEdit={(i, f, v) => editItem('parts', activeTab, i, f, v)}
                            accentColor={activeTab === 'extreme' ? 'text-red-500' : 'text-purple-400'}
                        />
                    </div>
                </div>
            </div>

        </div>
    )
}

// Subcomponent for editing a specific list
function ListEditor({
    items,
    onAdd,
    onRemove,
    onEdit,
    accentColor
}: {
    items: DiceItem[],
    onAdd: () => void,
    onRemove: (i: number) => void,
    onEdit: (i: number, f: keyof DiceItem, v: string) => void,
    accentColor: string
}) {
    // Extract base color class for background usage (e.g., text-red-500 -> bg-red-500)
    const bgClass = accentColor.includes('red') ? 'bg-red-500' : 'bg-purple-500'
    const textClass = accentColor.includes('red') ? 'text-red-500' : 'text-purple-400'

    return (
        <div className="bg-zinc-900 rounded-xl p-3 md:p-6 border border-zinc-800">

            <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1 custom-scrollbar">
                {items.map((item, idx) => (
                    <div key={idx} className="flex gap-3 md:gap-4 items-center bg-black/40 p-3 md:p-4 rounded-xl border border-white/5 hover:border-white/20 transition-all w-full">

                        {/* Icon Input */}
                        <div className={`relative w-12 h-12 md:w-14 md:h-14 rounded-full ${bgClass}/10 flex items-center justify-center border border-white/5 shrink-0`}>
                            <input
                                type="text"
                                value={item.icon}
                                onChange={(e) => onEdit(idx, 'icon', e.target.value)}
                                className={`bg-transparent w-full h-full text-center text-2xl md:text-3xl focus:outline-none p-0 m-0 ${textClass}`}
                                maxLength={2}
                            />
                        </div>

                        {/* Text Input */}
                        <div className="flex-1 min-w-0">
                            <input
                                type="text"
                                value={item.text}
                                onChange={(e) => onEdit(idx, 'text', e.target.value)}
                                className="bg-transparent w-full text-base font-medium text-white focus:outline-none placeholder-zinc-700 h-full py-2"
                                placeholder="Escribe aquí..."
                            />
                        </div>

                        {/* Delete */}
                        <button
                            onClick={() => onRemove(idx)}
                            className="w-10 h-10 flex items-center justify-center rounded-lg text-zinc-600 hover:text-red-400 hover:bg-white/5 transition-colors shrink-0"
                        >
                            <Trash className="w-5 h-5" />
                        </button>
                    </div>
                ))}
            </div>

            <button
                onClick={onAdd}
                className="w-full mt-6 py-4 rounded-xl border border-dashed border-zinc-700/50 text-zinc-400 font-bold hover:border-zinc-500 hover:text-white hover:bg-zinc-800 transition flex items-center justify-center gap-2"
            >
                <Plus className="w-5 h-5" />
                Agregar Opción
            </button>
        </div>
    )
}
