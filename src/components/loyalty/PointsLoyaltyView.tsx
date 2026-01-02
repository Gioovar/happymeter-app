"use client"

import { useState, useEffect } from "react"
import { CustomerLoyaltyCard } from "./CustomerLoyaltyCard"
import { addLoyaltyReward, updateLoyaltyReward, deleteLoyaltyReward, updateLoyaltyProgram } from "@/actions/loyalty"
import { toast } from "sonner"
import { ArrowRight, Save, Trash2, CheckCircle2, TrendingUp, DollarSign } from "lucide-react"
import { useRouter } from "next/navigation"
import { PromotionsSlider } from "./PromotionsSlider"
import { getPromotions } from "@/actions/loyalty"

interface PointsLoyaltyViewProps {
    userId: string
    program: any
    onBack: () => void
}

export function PointsLoyaltyView({ userId, program, onBack }: PointsLoyaltyViewProps) {
    const router = useRouter()

    // -- CONFIG STATE --
    const [pointsPercentage, setPointsPercentage] = useState(program.pointsPercentage || 5.0)
    const [isSavingSettings, setIsSavingSettings] = useState(false)

    // -- REWARD STATE --
    const [rewards] = useState(program.rewards || [])
    // We'll just manage the list loosely or re-fetch. 
    // Ideally we pass `program.rewards` directly, but for optimistic updates we might need local state if complex.
    // For MVP, we rely on router.refresh() like VisitsLoyaltyView

    // -- PREVIEW STATE --
    const [previewSpend, setPreviewSpend] = useState(100)
    const [previewPoints, setPreviewPoints] = useState(0)
    const [promotions, setPromotions] = useState<any[]>([])

    useEffect(() => {
        const loadPromos = async () => {
            if (program?.id) {
                const res = await getPromotions(program.id)
                if (res.success) setPromotions(res.promotions || [])
            }
        }
        loadPromos()
    }, [program?.id])

    // Calculate preview points whenever spend changes
    const calculatedPoints = Math.floor(previewSpend * (pointsPercentage / 100))

    // -- HANDLERS --

    const handleSavePercentage = async () => {
        setIsSavingSettings(true)
        try {
            await updateLoyaltyProgram(program.id, { pointsPercentage: parseFloat(pointsPercentage) })
            toast.success("Porcentaje actualizado")
            router.refresh()
        } catch (e) {
            toast.error("Error al guardar")
        } finally {
            setIsSavingSettings(false)
        }
    }

    const [newReward, setNewReward] = useState({ name: "", cost: 100 })
    const [isAddingReward, setIsAddingReward] = useState(false)

    const handleAddReward = async () => {
        if (!newReward.name) return
        setIsAddingReward(true)
        try {
            await addLoyaltyReward(program.id, {
                name: newReward.name,
                costInPoints: newReward.cost,
                costInVisits: 0, // 0 means points based
                description: `Cuesta ${newReward.cost} puntos`
            })
            setNewReward({ name: "", cost: 100 })
            toast.success("Recompensa agregada")
            router.refresh()
        } catch (e) {
            toast.error("Error al crear")
        } finally {
            setIsAddingReward(false)
        }
    }

    const handleDeleteReward = async (id: string) => {
        if (!confirm("Eliminar premio?")) return
        await deleteLoyaltyReward(program.id, id)
        router.refresh()
        toast.success("Eliminado")
    }

    // Filter only points rewards or mixed? 
    // We assume if costInPoints > 0 it's for this view.
    const pointsRewards = (program.rewards || []).filter((r: any) => r.costInPoints > 0).sort((a: any, b: any) => a.costInPoints - b.costInPoints)


    return (
        <div className="min-h-screen bg-[#0a0a0f] p-4 lg:p-6 font-sans flex flex-col h-auto lg:h-screen overflow-y-auto lg:overflow-hidden">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-8 shrink-0">
                <button
                    onClick={onBack}
                    className="p-2 bg-white/5 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors"
                >
                    <ArrowRight className="w-5 h-5 rotate-180" />
                </button>
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-white leading-tight">Configurar Lealtad por Puntos</h1>
                    <p className="text-gray-400 text-sm">Convierte el gasto de tus clientes en puntos.</p>
                </div>
            </div>

            <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-8 min-h-0 pb-20 lg:pb-0">

                {/* LEFT: CONFIGURATION */}
                <div className="bg-[#111] border border-white/10 rounded-3xl p-6 lg:p-8 flex flex-col gap-8 h-fit lg:h-auto lg:overflow-y-auto custom-scrollbar">
                    {/* PERCENTAGE SETTING */}
                    <div className="bg-blue-900/10 border border-blue-500/20 p-5 rounded-2xl">
                        <div className="flex flex-col sm:flex-row items-start gap-4">
                            <div className="p-3 bg-blue-500/20 rounded-xl hidden sm:block">
                                <TrendingUp className="w-6 h-6 text-blue-400" />
                            </div>
                            <div className="flex-1 w-full">
                                <h3 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
                                    <TrendingUp className="w-5 h-5 text-blue-400 sm:hidden" />
                                    Regla de Conversión
                                </h3>
                                <p className="text-gray-400 text-sm mb-4">
                                    ¿Qué porcentaje de la cuenta se convierte en puntos?
                                </p>
                                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                                    <div className="relative w-full sm:w-32">
                                        <input
                                            type="number"
                                            value={pointsPercentage}
                                            onChange={(e) => setPointsPercentage(parseFloat(e.target.value))}
                                            className="w-full bg-[#050505] border border-white/10 rounded-xl px-4 py-3 text-white font-bold text-xl focus:border-blue-500 outline-none pr-8"
                                            step="0.1"
                                        />
                                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold">%</span>
                                    </div>
                                    <button
                                        onClick={handleSavePercentage}
                                        disabled={isSavingSettings}
                                        className="w-full sm:w-auto bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-xl font-bold text-sm transition-colors"
                                    >
                                        {isSavingSettings ? "Guardando..." : "Guardar Regla"}
                                    </button>
                                </div>
                                <p className="text-xs text-gray-500 mt-3">
                                    Ejemplo: Si la cuenta es de <span className="text-white">$100</span>, recibes <span className="text-blue-400 font-bold">{Math.floor(100 * (pointsPercentage / 100))} Puntos</span>.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* REWARDS LIST */}
                    <div>
                        <h3 className="text-lg font-bold text-white mb-4">Catálogo de Premios</h3>
                        <div className="space-y-3 mb-4">
                            {pointsRewards.map((reward: any) => (
                                <div key={reward.id} className="flex items-center justify-between bg-white/5 p-4 rounded-xl border border-white/5">
                                    <div>
                                        <div className="font-bold text-white text-sm sm:text-base">{reward.name}</div>
                                        <div className="text-xs text-blue-400 font-bold">{reward.costInPoints} Puntos</div>
                                    </div>
                                    <button
                                        onClick={() => handleDeleteReward(reward.id)}
                                        className="p-2 hover:bg-white/10 rounded-lg text-gray-500 hover:text-red-400 transition-colors"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                            {pointsRewards.length === 0 && (
                                <div className="text-center py-6 text-gray-500 text-sm">
                                    No hay premios por puntos configurados.
                                </div>
                            )}
                        </div>

                        {/* ADD NEW REWARD */}
                        <div className="bg-[#1A1A1A] p-4 rounded-xl border border-white/10">
                            <h4 className="text-xs font-bold text-gray-400 uppercase mb-3">Agregar Nuevo Premio</h4>
                            <div className="flex flex-col sm:flex-row gap-3">
                                <input
                                    placeholder="Nombre (Ej. Pizza)"
                                    className="flex-1 bg-black/30 border border-white/10 rounded-lg px-3 py-3 sm:py-2 text-white text-sm focus:border-blue-500 outline-none"
                                    value={newReward.name}
                                    onChange={(e) => setNewReward({ ...newReward, name: e.target.value })}
                                />
                                <div className="flex gap-2">
                                    <div className="w-24 relative flex-1 sm:flex-none">
                                        <input
                                            type="number"
                                            placeholder="Costo"
                                            className="w-full bg-black/30 border border-white/10 rounded-lg pl-3 pr-1 py-3 sm:py-2 text-white text-sm focus:border-blue-500 outline-none"
                                            value={newReward.cost}
                                            onChange={(e) => setNewReward({ ...newReward, cost: parseInt(e.target.value) })}
                                        />
                                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-500">Pts</span>
                                    </div>
                                    <button
                                        onClick={handleAddReward}
                                        disabled={isAddingReward}
                                        className="bg-white text-black px-4 rounded-lg font-bold text-sm hover:bg-gray-200 transition-colors flex items-center justify-center min-w-[3rem]"
                                    >
                                        <ArrowRight className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* RIGHT: PREVIEW */}
                <div>
                    <div className="bg-[#050505] rounded-[40px] border-[8px] border-[#222] shadow-2xl relative overflow-hidden flex flex-col max-w-[340px] sm:max-w-[400px] mx-auto w-full h-[600px] lg:h-full">
                        {/* Fake Status Bar */}
                        <div className="h-12 bg-black flex justify-between items-center px-6 text-white text-xs font-medium shrink-0 z-20">
                            <span>9:41</span>
                            <div className="flex gap-1.5">
                                <div className="w-4 h-2.5 bg-white rounded-[1px]" />
                            </div>
                        </div>

                        {/* Controls Overlay */}
                        <div className="absolute bottom-6 right-6 z-50 flex flex-col gap-2">
                            <div className="bg-black/80 backdrop-blur-md p-3 rounded-xl border border-white/10 text-center w-40">
                                <label className="text-[10px] text-gray-400 uppercase font-bold mb-1 block">Simular Gasto ($)</label>
                                <input
                                    type="number"
                                    value={previewSpend}
                                    onChange={(e) => setPreviewSpend(parseFloat(e.target.value))}
                                    className="w-full bg-white/10 border border-white/10 rounded-lg px-2 py-1 text-center font-bold text-white mb-2"
                                />
                                <div className="text-blue-400 font-bold text-xs flex items-center justify-center gap-1">
                                    +{calculatedPoints} Puntos
                                </div>
                            </div>
                        </div>

                        <div className="flex-1 bg-black relative overflow-y-auto custom-scrollbar pb-6">
                            <CustomerLoyaltyCard
                                filterType="points"
                                customer={{
                                    id: "preview-user",
                                    firstName: "Vista Previa",
                                    visits: [],
                                    currentVisits: 0,
                                    totalPoints: calculatedPoints,
                                    currentPoints: calculatedPoints,
                                    magicToken: "DEMO-POINTS",
                                    redemptions: [],
                                    program: program,
                                    tier: program.tiers?.slice().reverse().find((t: any) =>
                                        (t.requiredPoints >= 0 && calculatedPoints >= t.requiredPoints)
                                    )
                                }}
                            >
                                <div className="mt-2">
                                    <PromotionsSlider promotions={promotions} />
                                </div>
                            </CustomerLoyaltyCard>
                        </div>
                    </div>
                    {/* Mobile Only Label */}
                    <p className="text-center text-xs text-gray-500 mt-4 lg:hidden">
                        Así verán tus clientes su tarjeta digital.
                    </p>
                </div>

            </div>
        </div>
    )
}
