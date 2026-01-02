"use client"

import { useState, useEffect } from "react"
import { CustomerLoyaltyCard } from "./CustomerLoyaltyCard"
import { addLoyaltyReward, updateLoyaltyReward, deleteLoyaltyReward } from "@/actions/loyalty"
import { toast } from "sonner"
import { ArrowRight, Save, Trash2, CheckCircle2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { PromotionsSlider } from "./PromotionsSlider"
import { getPromotions } from "@/actions/loyalty"

interface VisitsLoyaltyViewProps {
    userId: string
    program: any
    onBack: () => void
}

export function VisitsLoyaltyView({ userId, program, onBack }: VisitsLoyaltyViewProps) {
    const router = useRouter()
    const [savingId, setSavingId] = useState<number | null>(null)
    const [previewVisits, setPreviewVisits] = useState(5)
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

    // Helper to get reward for a specific visit count
    const getRewardForVisit = (count: number) => {
        return program.rewards?.find((r: any) => r.costInVisits === count)
    }

    const handleSaveReward = async (visitCount: number, name: string) => {
        if (!name.trim()) {
            // If empty, try to delete if exists
            const existing = getRewardForVisit(visitCount)
            if (existing) {
                setSavingId(visitCount)
                await deleteLoyaltyReward(program.id, existing.id)
                setSavingId(null)
                router.refresh()
            }
            return
        }

        const existing = getRewardForVisit(visitCount)

        // If no change, do nothing
        if (existing && existing.name === name) return

        setSavingId(visitCount)
        try {
            if (existing) {
                await updateLoyaltyReward(program.id, existing.id, {
                    name,
                    costInVisits: visitCount,
                    description: existing.description
                })
            } else {
                await addLoyaltyReward(program.id, {
                    name,
                    costInVisits: visitCount,
                    description: `Recompensa por visita #${visitCount}`
                })
            }
            router.refresh()
            toast.success("Guardado", { position: "bottom-center", duration: 1000 })
        } catch (error) {
            toast.error("Error al guardar")
        } finally {
            setSavingId(null)
        }
    }

    // Generate slots 1 to 10
    const slots = Array.from({ length: 10 }, (_, i) => i + 1)

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
                    <h1 className="text-xl sm:text-2xl font-bold text-white leading-tight">Configurar Lealtad por Visitas</h1>
                    <p className="text-gray-400 text-sm">Define qué premio das en cada visita.</p>
                </div>
            </div>

            <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-8 min-h-0 pb-20 lg:pb-0">

                {/* LEFT: CONFIGURATION */}
                <div className="bg-[#111] border border-white/10 rounded-3xl p-6 lg:p-8 h-fit lg:h-auto lg:overflow-y-auto custom-scrollbar order-2 lg:order-1">
                    <h3 className="text-lg font-bold text-white mb-6 sticky top-0 bg-[#111] z-10 py-2 border-b border-white/5">
                        Escalera de Premios
                    </h3>

                    <div className="space-y-4">
                        {slots.map((count) => {
                            const reward = getRewardForVisit(count)
                            const isSaving = savingId === count

                            return (
                                <div key={count} className="flex items-center gap-4 group">
                                    <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center border border-white/5 text-gray-500 font-bold shrink-0">
                                        #{count}
                                    </div>
                                    <div className="flex-1 relative">
                                        <input
                                            defaultValue={reward?.name || ""}
                                            placeholder="Sin premio"
                                            onBlur={(e) => handleSaveReward(count, e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                    e.currentTarget.blur()
                                                }
                                            }}
                                            className="w-full bg-[#1A1A1A] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 focus:bg-white/5 transition-all placeholder:text-gray-700"
                                        />
                                        {isSaving && (
                                            <div className="absolute right-3 top-3.5 animate-spin w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full" />
                                        )}
                                        {!isSaving && reward && (
                                            <div className="absolute right-3 top-3.5 text-green-500">
                                                <CheckCircle2 className="w-4 h-4" />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>

                {/* RIGHT: PREVIEW */}
                <div className="order-1 lg:order-2">
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
                            <div className="bg-black/60 backdrop-blur-md p-2 rounded-xl border border-white/10 text-center">
                                <label className="text-[10px] text-gray-400 uppercase font-bold mb-1 block">Simular Visitas</label>
                                <input
                                    type="range"
                                    min="0"
                                    max="10"
                                    value={previewVisits}
                                    onChange={(e) => setPreviewVisits(parseInt(e.target.value))}
                                    className="w-32 accent-blue-500"
                                />
                                <div className="text-white font-bold text-xs">{previewVisits} Visitas</div>
                            </div>
                        </div>

                        <div className="flex-1 bg-black relative overflow-y-auto custom-scrollbar pb-6">
                            <CustomerLoyaltyCard
                                filterType="visits"
                                customer={{
                                    id: "preview-user",
                                    firstName: "Vista Previa",
                                    visits: previewVisits,
                                    currentVisits: previewVisits,
                                    magicToken: "DEMO-1234",
                                    redemptions: [],
                                    program: program,
                                    tier: program.tiers?.slice().reverse().find((t: any) =>
                                        (t.requiredVisits >= 0 && previewVisits >= t.requiredVisits)
                                    )
                                }}
                            >
                                <div className="mt-2">
                                    <PromotionsSlider promotions={promotions} />
                                </div>
                            </CustomerLoyaltyCard>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    )
}
