'use client'

import { useRef } from 'react'
import Image from 'next/image'
import { Plus, X, Info, Upload } from 'lucide-react'

interface BottleSettingsProps {
    actions: string[]
    onChange: (actions: string[]) => void
    logoUrl: string | null
    onLogoChange: (url: string | null) => void
}

export default function BottleSettings({ actions, onChange, logoUrl, onLogoChange }: BottleSettingsProps) {
    const fileInputRef = useRef<HTMLInputElement>(null)

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            const reader = new FileReader()
            reader.onloadend = () => {
                onLogoChange(reader.result as string)
            }
            reader.readAsDataURL(file)
        }
    }

    const triggerUpload = () => {
        fileInputRef.current?.click()
    }

    const addAction = () => {
        onChange([...actions, "Nuevo Reto/Castigo"])
    }

    const removeAction = (index: number) => {
        const newActions = actions.filter((_, i) => i !== index)
        onChange(newActions)
    }

    const updateAction = (index: number, value: string) => {
        const newActions = [...actions]
        newActions[index] = value
        onChange(newActions)
    }

    return (
        <div className="space-y-6">
            {/* Custom Bottle Image */}
            <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                    <Upload className="w-4 h-4 text-violet-400" /> Diseño de la Botella
                </h3>

                <div className="flex items-center gap-4">
                    <div
                        onClick={triggerUpload}
                        className="w-16 h-16 rounded-lg bg-black/40 border-2 border-dashed border-white/20 flex items-center justify-center cursor-pointer hover:border-violet-500 hover:bg-violet-500/10 transition overflow-hidden relative"
                    >
                        {logoUrl ? (
                            <Image src={logoUrl} alt="Bottle" fill className="object-contain p-1" />
                        ) : (
                            <Upload className="w-5 h-5 text-gray-500" />
                        )}
                    </div>
                    <div>
                        <button
                            onClick={triggerUpload}
                            className="text-xs font-bold text-violet-400 hover:text-violet-300 underline mb-1"
                        >
                            Subir Logo / Imagen
                        </button>
                        <p className="text-[10px] text-gray-500">
                            Reemplaza la botella por tu bebida o logo.
                        </p>
                    </div>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleFileChange}
                    />
                </div>
            </div>

            <div>
                <h3 className="font-bold text-white flex items-center gap-2">
                    <span className="p-2 rounded-lg bg-violet-500/10 text-violet-500"><Info className="w-5 h-5" /></span>
                    Configuración de Retos
                </h3>
                <p className="text-sm text-gray-400 mt-2 leading-relaxed">
                    Personaliza los castigos, retos o preguntas que aparecerán cuando la botella señale a alguien.
                </p>
            </div>

            <div className="space-y-3 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
                {actions.map((action, idx) => (
                    <div key={idx} className="flex gap-2 items-center">
                        <div className="p-2 bg-white/5 rounded-lg text-violet-400 font-bold text-xs">{idx + 1}</div>
                        <input
                            type="text"
                            value={action}
                            onChange={(e) => updateAction(idx, e.target.value)}
                            className="flex-1 bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-violet-500 outline-none"
                            placeholder="Escribe un reto..."
                        />
                        <button
                            onClick={() => removeAction(idx)}
                            className="p-2 hover:bg-red-500/20 hover:text-red-400 text-gray-600 rounded-lg transition"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                ))}
            </div>

            <button
                onClick={addAction}
                className="w-full py-2 border border-dashed border-white/20 rounded-xl text-sm text-gray-400 hover:text-white hover:border-white/40 transition flex items-center justify-center gap-2"
            >
                <Plus className="w-4 h-4" /> Agregar Nuevo Reto
            </button>
        </div>
    )
}
