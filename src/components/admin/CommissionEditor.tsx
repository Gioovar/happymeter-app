'use client'

import { useState } from 'react'
import { CheckCircle, XCircle, Pencil, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface CommissionEditorProps {
    creatorId: string
    currentRate: number
}

export default function CommissionEditor({ creatorId, currentRate }: CommissionEditorProps) {
    const [isEditing, setIsEditing] = useState(false)
    const [rate, setRate] = useState(currentRate.toString())
    const [isSaving, setIsSaving] = useState(false)
    const router = useRouter()

    const handleSave = async () => {
        const numRate = parseFloat(rate)
        if (isNaN(numRate) || numRate < 0 || numRate > 100) {
            alert('Por favor ingresa un porcentaje válido (0-100)')
            return
        }

        setIsSaving(true)
        try {
            // Dynamic import to avoid server action issues in some contexts
            const { updateCreatorCommission } = await import('@/actions/admin')
            await updateCreatorCommission(creatorId, numRate)
            setIsEditing(false)
            router.refresh()
        } catch (error) {
            console.error('Failed to update commission', error)
            alert('Error al actualizar la comisión')
        } finally {
            setIsSaving(false)
        }
    }

    if (!isEditing) {
        return (
            <div className="flex items-center gap-2 group">
                <div className="flex flex-col">
                    <span className="text-gray-400 text-xs uppercase font-bold tracking-wider">Comisión Actual</span>
                    <div className="flex items-center gap-2">
                        <span className="text-3xl font-bold text-white">{currentRate}%</span>
                        <button
                            onClick={() => setIsEditing(true)}
                            className="p-1.5 rounded-full bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition opacity-0 group-hover:opacity-100"
                            title="Editar porcentaje"
                        >
                            <Pencil className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="flex flex-col gap-2">
            <span className="text-gray-400 text-xs uppercase font-bold tracking-wider">Editar Comisión %</span>
            <div className="flex items-center gap-2">
                <div className="relative">
                    <input
                        type="number"
                        value={rate}
                        onChange={(e) => setRate(e.target.value)}
                        className="w-24 bg-black border border-violet-500 rounded-lg px-3 py-2 text-xl font-bold text-white outline-none focus:ring-2 focus:ring-violet-500/50"
                        autoFocus
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 font-bold">%</span>
                </div>

                <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="p-2 bg-green-600 hover:bg-green-500 text-white rounded-lg disabled:opacity-50 transition"
                >
                    {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle className="w-5 h-5" />}
                </button>
                <button
                    onClick={() => {
                        setIsEditing(false)
                        setRate(currentRate.toString())
                    }}
                    disabled={isSaving}
                    className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-lg disabled:opacity-50 transition"
                >
                    <XCircle className="w-5 h-5" />
                </button>
            </div>
        </div>
    )
}
