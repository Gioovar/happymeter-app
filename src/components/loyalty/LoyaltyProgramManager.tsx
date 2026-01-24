"use client"

import { useState } from "react"
import { createLoyaltyProgram, addLoyaltyReward } from "@/actions/loyalty"
import { toast } from "sonner"
import { Plus, Save, Gift, Trophy, QrCode } from "lucide-react"

interface LoyaltyProgramManagerProps {
    userId: string
    existingProgram: any // Type from Prisma
}

export function LoyaltyProgramManager({ userId, existingProgram }: LoyaltyProgramManagerProps) {
    const [program, setProgram] = useState(existingProgram)

    // Create Form State
    const [businessName, setBusinessName] = useState(existingProgram?.businessName || "")
    const [description, setDescription] = useState(existingProgram?.description || "")
    const [color, setColor] = useState(existingProgram?.themeColor || "#8b5cf6")

    // Reward Form State
    const [isAddingReward, setIsAddingReward] = useState(false)
    const [rewardName, setRewardName] = useState("")
    const [rewardCost, setRewardCost] = useState(5)

    const handleCreateProgram = async () => {
        const res = await createLoyaltyProgram({
            userId,
            businessName,
            description,
            themeColor: color
        })
        if (res.success) {
            setProgram(res.program)
            toast.success("Programa de lealtad creado!")
        } else {
            toast.error("Error al crear el programa")
        }
    }

    const handleAddReward = async () => {
        if (!program) return
        const res = await addLoyaltyReward(program.id, {
            name: rewardName,
            costInVisits: rewardCost
        })
        if (res.success) {
            toast.success("Premio agregado")
            setIsAddingReward(false)
            setRewardName("")
            // Ideally re-fetch or update local state manually if not using router refresh
            // Assuming parent/page handles refresh or we just updated list locally?
            // Since the action calls revalidatePath, a router.refresh() in parent would be good, 
            // or we can blindly append to local state for UX if we knew the shape perfectly.
            // For simplicity, let's reload or assume the page rehydrates.
            window.location.reload()
        } else {
            toast.error("Error al agregar premio")
        }
    }

    if (!program) {
        return (
            <div className="p-8 bg-white rounded-2xl shadow-sm border border-slate-200 text-center">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Trophy className="w-8 h-8 text-purple-600" />
                </div>
                <h2 className="text-2xl font-bold text-slate-800 mb-2">Comienza tu Programa de Lealtad</h2>
                <p className="text-slate-500 mb-6 max-w-md mx-auto">
                    Premia a tus clientes frecuentes con visitas y recompensas. Aumenta la retención y crea una comunidad fiel.
                </p>

                <div className="max-w-sm mx-auto space-y-4 text-left">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Nombre del Negocio</label>
                        <input
                            type="text"
                            value={businessName}
                            onChange={(e) => setBusinessName(e.target.value)}
                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                            placeholder="Ej. Café Central"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Descripción corta</label>
                        <input
                            type="text"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                            placeholder="Ej. Junta 10 visitas y gana un café"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Color del Tema</label>
                        <input
                            type="color"
                            value={color}
                            onChange={(e) => setColor(e.target.value)}
                            className="w-full h-10 p-1 rounded cursor-pointer"
                        />
                    </div>

                    <button
                        onClick={handleCreateProgram}
                        disabled={!businessName}
                        className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl transition-all disabled:opacity-50"
                    >
                        Crear Programa
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-8">
            {/* Header Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                    <div className="text-sm text-slate-500">Miembros Activos</div>
                    <div className="text-2xl font-bold text-slate-900">{program._count?.customers || 0}</div>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                    <div className="text-sm text-slate-500">Visitas Totales</div>
                    <div className="text-2xl font-bold text-slate-900">{program._count?.visits || 0}</div>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                    <div className="text-sm text-slate-500">Premios Canjeados</div>
                    <div className="text-2xl font-bold text-slate-900">{program._count?.redemptions || 0}</div>
                </div>
            </div>

            {/* Configuration & Link */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <h3 className="text-lg font-bold text-slate-800">Configuración</h3>
                        <p className="text-sm text-slate-500">Personaliza tu tarjeta de lealtad</p>
                    </div>

                    <button
                        onClick={() => window.open(`/loyalty/${program.id}`, '_blank')}
                        className="px-4 py-2 bg-indigo-50 text-indigo-600 rounded-lg text-sm font-medium hover:bg-indigo-100 flex items-center gap-2"
                    >
                        <QrCode className="w-4 h-4" /> Ver QR de Registro
                    </button>
                </div>

                {/* Rewards List */}
                <div className="mt-8">
                    <div className="flex justify-between items-center mb-4">
                        <h4 className="font-semibold text-slate-800 flex items-center gap-2">
                            <Gift className="w-5 h-5 text-pink-500" /> Niveles de Premios
                        </h4>
                        <button
                            onClick={() => setIsAddingReward(true)}
                            className="bg-slate-900 text-white px-3 py-1.5 rounded-lg text-sm flex items-center gap-1 hover:bg-slate-800"
                        >
                            <Plus className="w-4 h-4" /> Agregar Premio
                        </button>
                    </div>

                    <div className="space-y-3">
                        {program.rewards?.map((reward: any) => (
                            <div key={reward.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center border border-slate-200 font-bold text-slate-600 shadow-sm">
                                        {reward.costInVisits}
                                    </div>
                                    <div>
                                        <div className="font-medium text-slate-900">{reward.name}</div>
                                        <div className="text-xs text-slate-500">visitas requeridas</div>
                                    </div>
                                </div>
                                <span className="text-xs font-medium px-2 py-1 bg-green-100 text-green-700 rounded-full">Activo</span>
                            </div>
                        ))}

                        {program.rewards?.length === 0 && (
                            <div className="text-center py-8 text-slate-400 text-sm">
                                No tienes premios configurados aún. ¡Agrega el primero!
                            </div>
                        )}
                    </div>

                    {/* Add Reward Form */}
                    {isAddingReward && (
                        <div className="mt-4 p-4 bg-slate-50 rounded-lg border border-slate-200 animate-in fade-in slide-in-from-top-2">
                            <h5 className="font-medium text-slate-800 mb-3 text-sm">Nuevo Premio</h5>
                            <div className="flex gap-3 mb-3">
                                <div className="flex-1">
                                    <input
                                        placeholder="Nombre del premio (ej. Postre Gratis)"
                                        className="w-full px-3 py-2 text-sm border rounded-md"
                                        value={rewardName}
                                        onChange={e => setRewardName(e.target.value)}
                                    />
                                </div>
                                <div className="w-24">
                                    <input
                                        type="number"
                                        placeholder="Visitas"
                                        className="w-full px-3 py-2 text-sm border rounded-md"
                                        value={rewardCost}
                                        onChange={e => setRewardCost(parseInt(e.target.value))}
                                    />
                                </div>
                            </div>
                            <div className="flex gap-2 justify-end">
                                <button
                                    onClick={() => setIsAddingReward(false)}
                                    className="px-3 py-1.5 text-sm text-slate-500 hover:text-slate-800"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleAddReward}
                                    className="px-3 py-1.5 text-sm bg-slate-900 text-white rounded-md hover:bg-slate-800"
                                >
                                    Guardar
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
