"use client"

import { useState, useEffect } from "react"
import { createLoyaltyProgram, addLoyaltyReward, createLoyaltyRule, updateLoyaltyRule, applyLoyaltyTemplate, updateLoyaltyReward, deleteLoyaltyReward, redeemReward, logCustomerVisit, updateLoyaltyProgram, getProgramCustomers } from "@/actions/loyalty"
import { inviteMember, getOperators, toggleMemberStatus } from "@/actions/team"
import { createPromotion, deletePromotion, getPromotions } from "@/actions/loyalty"
import { toast } from "sonner"
import MenuManager from "./MenuManager"
import { CustomerLoyaltyCard } from "./CustomerLoyaltyCard"
import { cn } from "@/lib/utils"
import { useRouter, useSearchParams, usePathname } from "next/navigation"
import { Zap, Users, BarChart3, ArrowRight, Utensils, QrCode, Trophy, X, Star, Camera, Loader2, Megaphone, Plus, Percent, Gift, History, Sparkles, Wine } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { StaffInviteForm } from "@/components/team/StaffInviteForm"
import { ProgramSharedQrModal } from "./ProgramSharedQrModal"
import { VisitsLoyaltyView } from "./VisitsLoyaltyView"
import { PointsLoyaltyView } from "./PointsLoyaltyView"

// Imported Components
import { RedemptionHistory } from "./RedemptionHistory"
import { CustomerList } from "./CustomerList"
import TiersManager from "./TiersManager"
import NotificationsManager from "./NotificationsManager"
import { PromotionsManager } from "./PromotionsManager"
import { PremiumTabs, WelcomeGiftCard, StaffManagementView, LoyaltyStatCard as StatCard } from "./LoyaltyComponents"

interface LoyaltyDashboardProps {
    userId: string
    program: any
}

export function LoyaltyDashboard({ userId, program }: LoyaltyDashboardProps) {
    const router = useRouter()
    const pathname = usePathname()
    const searchParams = useSearchParams()

    // Derive viewMode from URL to persist state across revalidations
    const tabParam = searchParams.get('tab')
    const viewParam = searchParams.get('view')

    let viewMode: 'hub' | 'advanced' | 'visits' | 'points' | 'menu' = 'hub'
    if (tabParam) {
        viewMode = 'advanced'
    } else if (viewParam) {
        viewMode = viewParam as any
    }

    const setViewMode = (mode: string) => {
        const params = new URLSearchParams(searchParams.toString())
        if (mode === 'hub') {
            params.delete('view')
            params.delete('tab') // Clear tab if going back to hub
        } else {
            params.set('view', mode)
        }
        router.push(`${pathname}?${params.toString()}`)
    }

    // Initialize/Sync Legacy Tab logic (Optional now, but keeps compatibility)
    // Removed old useEffect as derived state covers it.

    const [targetTab, setTargetTab] = useState('overview')
    const [isInviteModalOpen, setIsInviteModalOpen] = useState(false)
    const [showSharedQr, setShowSharedQr] = useState(false)
    const [qrProgramData, setQrProgramData] = useState<any>(null)
    const [isCreating, setIsCreating] = useState(false)

    if (!program) {
        return (
            <div className="min-h-[50vh] flex flex-col items-center justify-center p-8 text-center bg-[#111] rounded-3xl border border-white/10">
                <div className="w-20 h-20 bg-indigo-500/10 rounded-full flex items-center justify-center mb-6">
                    <Zap className="w-10 h-10 text-indigo-400" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">Comienza tu Programa de Lealtad</h2>
                <p className="text-gray-400 max-w-md mb-8">
                    Activa tu sistema de recompensas para fidelizar a tus clientes. Configura visitas, puntos y premios.
                </p>
                <Button
                    onClick={async () => {
                        setIsCreating(true)
                        try {
                            const res = await createLoyaltyProgram({
                                userId,
                                businessName: "Mi Negocio",
                                description: "Programa de Lealtad"
                            })

                            if (res.success) {
                                toast.success("Programa creado!")
                                window.location.reload()
                            } else {
                                toast.error(res.error || "Error al crear programa")
                            }
                        } catch (e) {
                            toast.error("Error de conexión")
                        } finally {
                            setIsCreating(false)
                        }
                    }}
                    disabled={isCreating}
                    className="bg-white text-black hover:bg-gray-200 font-bold px-8 py-6 rounded-xl text-lg"
                >
                    {isCreating ? "Creando..." : "Activar Programa Gratis"}
                </Button>
            </div>
        )
    }

    if (viewMode === 'visits') {
        return <VisitsLoyaltyView userId={userId} program={program} onBack={() => setViewMode('hub')} />
    }

    if (viewMode === 'points') {
        return <PointsLoyaltyView userId={userId} program={program} onBack={() => setViewMode('hub')} />
    }

    if (viewMode === 'menu') {
        return <MenuManager userId={userId} onBack={() => setViewMode('hub')} />
    }

    if (viewMode === 'hub') {
        return (
            <div className="min-h-screen bg-[#0a0a0f] p-2 sm:p-4 lg:p-8 font-sans">
                <div className="max-w-6xl mx-auto">
                    <div className="mb-12 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                        <div>
                            <h1 className="text-4xl font-bold text-white mb-2">Centro de Lealtad y Gamificación</h1>
                            <p className="text-gray-400">Selecciona el tipo de programa que deseas gestionar.</p>
                        </div>
                        <div className="flex flex-col sm:flex-row w-full md:w-auto gap-3">
                            <button
                                onClick={() => setIsInviteModalOpen(true)}
                                className="px-6 py-3 bg-indigo-600/10 border border-indigo-500/20 hover:bg-indigo-600/20 text-indigo-400 rounded-xl font-medium transition-colors flex items-center justify-center gap-2 w-full sm:w-auto"
                            >
                                <Users className="w-5 h-5" />
                                <span>Gestionar Equipo Operativo</span>
                            </button>
                            <button
                                onClick={() => setViewMode('advanced')}
                                className="px-6 py-3 bg-white/5 border border-white/10 hover:bg-white/10 text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2 w-full sm:w-auto"
                            >
                                <BarChart3 className="w-5 h-5" />
                                <span>Panel Avanzado</span>
                            </button>
                        </div>
                    </div>


                    {/* QUICK INVITE MODAL */}
                    {
                        isInviteModalOpen && (
                            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in duration-200">
                                <div className="bg-[#111] border border-white/10 rounded-3xl w-full max-w-md overflow-hidden p-8 relative">
                                    <button
                                        onClick={() => setIsInviteModalOpen(false)}
                                        className="absolute top-4 right-4 p-2 bg-white/5 rounded-full text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>

                                    <div className="text-center mb-6">
                                        <div className="w-16 h-16 bg-indigo-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-indigo-500/20">
                                            <Users className="w-8 h-8 text-indigo-400" />
                                        </div>
                                        <h3 className="text-xl font-bold text-white mb-2">Invitar Operador</h3>
                                        <p className="text-gray-400 text-sm">Invita a meseros o personal operativo. Recibirán un correo para unirse.</p>
                                    </div>

                                    <StaffInviteForm className="flex-col" />
                                </div>
                            </div>
                        )
                    }

                    {/* SHARED QR MODAL */}
                    {
                        qrProgramData && (
                            <ProgramSharedQrModal
                                isOpen={showSharedQr}
                                onClose={() => setShowSharedQr(false)}
                                programName={qrProgramData.name}
                                programType={qrProgramData.type}
                                programUrl={qrProgramData.url}
                            />
                        )
                    }

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        {/* OPTION 1: VISITS */}
                        <div
                            onClick={() => setViewMode('visits')}
                            className="bg-[#111] border border-white/10 rounded-3xl p-8 hover:bg-white/5 transition-all group cursor-pointer relative overflow-hidden flex flex-col"
                        >
                            <div className="absolute top-0 right-0 p-6 opacity-0 group-hover:opacity-100 transition-opacity">
                                <ArrowRight className="w-6 h-6 text-orange-500 -rotate-45 group-hover:rotate-0 transition-transform duration-300" />
                            </div>
                            <div className="w-16 h-16 bg-orange-500/10 rounded-2xl flex items-center justify-center mb-6 border border-orange-500/20 group-hover:scale-110 transition-transform">
                                <Utensils className="w-8 h-8 text-orange-400" />
                            </div>
                            <h3 className="text-2xl font-bold text-white mb-2">Lealtad por Visitas</h3>
                            <p className="text-gray-400 mb-6 flex-1">Ideal para restaurantes y cafeterías. Premia la frecuencia de tus clientes con una "Tarjeta de Sellos" digital.</p>

                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold bg-green-500/10 text-green-400 px-3 py-1 rounded-full border border-green-500/20">Disponible</span>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        setQrProgramData({
                                            name: program.businessName || "Programa de Visitas",
                                            type: "Visits",
                                            url: `https://www.happymeters.com/loyalty/${program.id}`
                                        })
                                        setShowSharedQr(true)
                                    }}
                                    className="flex items-center gap-2 px-3 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-xs font-bold text-white transition-colors"
                                >
                                    <QrCode className="w-4 h-4" />
                                    <span>Ver QR</span>
                                </button>
                            </div>
                        </div>

                        {/* OPTION 2: POINTS */}
                        <div
                            onClick={() => setViewMode('points')}
                            className="bg-[#111] border border-white/10 rounded-3xl p-8 hover:bg-white/5 transition-all group cursor-pointer relative overflow-hidden flex flex-col"
                        >
                            <div className="absolute top-0 right-0 p-6 opacity-0 group-hover:opacity-100 transition-opacity">
                                <ArrowRight className="w-6 h-6 text-blue-500 -rotate-45 group-hover:rotate-0 transition-transform duration-300" />
                            </div>
                            <div className="w-16 h-16 bg-blue-500/10 rounded-2xl flex items-center justify-center mb-6 border border-blue-500/20 group-hover:scale-110 transition-transform">
                                <Trophy className="w-8 h-8 text-blue-400" />
                            </div>
                            <h3 className="text-2xl font-bold text-white mb-2">Lealtad por Puntos</h3>
                            <p className="text-gray-400 mb-6 flex-1">Convierte cada peso gastado en puntos canjeables. Perfecto para retail y comercio.</p>

                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold bg-blue-500/10 text-blue-400 px-3 py-1 rounded-full border border-blue-500/20">Nuevo</span>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        setQrProgramData({
                                            name: program.businessName || "Programa de Puntos",
                                            type: "Points",
                                            url: `https://www.happymeters.com/loyalty/${program.id}`
                                        })
                                        setShowSharedQr(true)
                                    }}
                                    className="flex items-center gap-2 px-3 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-xs font-bold text-white transition-colors"
                                >
                                    <QrCode className="w-4 h-4" />
                                    <span>Ver QR</span>
                                </button>
                            </div>
                        </div>

                        {/* OPTION 3: MENU (NEW) */}
                        <div
                            onClick={() => setViewMode('menu')}
                            className="bg-[#111] border border-white/10 rounded-3xl p-8 hover:bg-white/5 transition-all group cursor-pointer relative overflow-hidden flex flex-col"
                        >
                            <div className="absolute top-0 right-0 p-6 opacity-0 group-hover:opacity-100 transition-opacity">
                                <ArrowRight className="w-6 h-6 text-pink-500 -rotate-45 group-hover:rotate-0 transition-transform duration-300" />
                            </div>
                            <div className="w-16 h-16 bg-pink-500/10 rounded-2xl flex items-center justify-center mb-6 border border-pink-500/20 group-hover:scale-110 transition-transform">
                                <Utensils className="w-8 h-8 text-pink-400" />
                            </div>
                            <h3 className="text-2xl font-bold text-white mb-2">Tu Menú Digital</h3>
                            <p className="text-gray-400 mb-6 flex-1">Sube tus productos, precios y categorías para que tus clientes puedan verlos desde su tarjeta.</p>

                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold bg-pink-500/10 text-pink-400 px-3 py-1 rounded-full border border-pink-500/20">Nuevo</span>
                                <div className="p-2 bg-white/5 rounded-lg">
                                    <QrCode className="w-4 h-4 text-gray-500" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* OPTION 3: ADVANCED (FULL DASHBOARD) */}
                    <div
                        onClick={() => {
                            setTargetTab('overview')
                            setViewMode('advanced')
                        }}
                        className="bg-gradient-to-r from-blue-900/20 to-indigo-900/20 border border-blue-500/20 rounded-3xl p-8 hover:border-blue-500/40 transition-all cursor-pointer group relative overflow-hidden"
                    >
                        <div className="absolute top-0 right-0 p-6 opacity-0 group-hover:opacity-100 transition-opacity">
                            <ArrowRight className="w-6 h-6 text-blue-400" />
                        </div>
                        <div className="flex items-start gap-6">
                            <div className="w-16 h-16 bg-blue-500/10 rounded-2xl flex items-center justify-center border border-blue-500/20 group-hover:scale-110 transition-transform shrink-0">
                                <Zap className="w-8 h-8 text-blue-400" />
                            </div>
                            <div>
                                <h3 className="text-2xl font-bold text-white mb-2">Programa Avanzado</h3>
                                <p className="text-gray-300 max-w-xl">Accede al panel completo. Configura reglas complejas, gestiona recompensas manuales, visualiza métricas detalladas y niveles VIP.</p>
                            </div>
                        </div>
                    </div>
                </div >
            </div >
        )
    }

    return (
        <AdvancedLoyaltyView
            userId={userId}
            program={program}
            initialTab={targetTab}
            onBack={() => setViewMode('hub')}
        />
    )
}

function AdvancedLoyaltyView({ userId, program, onBack, initialTab: propInitialTab = 'overview' }: any) {
    const router = useRouter()

    // Initialize Dashboard State
    const searchParams = useSearchParams()
    const initialTab = searchParams.get('tab') || propInitialTab
    const [activeTab, setActiveTab] = useState(initialTab)

    // Update activeTab when URL changes
    useEffect(() => {
        const tab = searchParams.get('tab')
        if (tab) setActiveTab(tab)
    }, [searchParams])

    // -- RULES STATE --
    // State for existing features
    const [tiers, setTiers] = useState<any[]>(program.tiers || [])
    // State for new Clients feature
    const [customers, setCustomers] = useState<any[]>([])
    const [isLoadingCustomers, setIsLoadingCustomers] = useState(false)

    useEffect(() => {
        if (activeTab === 'clients') {
            loadCustomers()
        }
    }, [activeTab])

    const loadCustomers = async () => {
        setIsLoadingCustomers(true)
        const res = await getProgramCustomers(program.id)
        if (res.success) {
            setCustomers(res.customers || [])
        }
        setIsLoadingCustomers(false)
    }

    const [isCreatingRule, setIsCreatingRule] = useState(false)
    const [newRule, setNewRule] = useState({
        name: "",
        triggerType: "VISIT",
        conditionType: "frequency",
        params: { count: 2, days: 7, day: "Thursday", amount: 0 },
        rewardText: ""
    })
    const [editingRuleId, setEditingRuleId] = useState<string | null>(null)

    // -- REWARDS STATE --
    const [editingRewardId, setEditingRewardId] = useState<string | null>(null)
    const [isCreatingReward, setIsCreatingReward] = useState(false)
    const [rewardForm, setRewardForm] = useState({
        name: "",
        costInVisits: 5,
        description: ""
    })

    // -- DASHBOARD STATE --
    // activeTab is now declared at top of function
    const [isPreviewing, setIsPreviewing] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)

    // REDEMPTION STATE
    const [redemptionCode, setRedemptionCode] = useState("")
    const [isRedeeming, setIsRedeeming] = useState(false)

    // RATING STATE
    const [scannedVisitToken, setScannedVisitToken] = useState<string | null>(null)
    const [isRating, setIsRating] = useState(false)
    const [ratingValue, setRatingValue] = useState(5)
    const [ratingComment, setRatingComment] = useState("")
    const [visitSpendAmount, setVisitSpendAmount] = useState("")

    // --- HANDLERS ---

    const handleApplyTemplate = async (type: 'bar' | 'restaurant') => {
        setIsSubmitting(true)
        try {
            if (program) {
                await applyLoyaltyTemplate(program.id, type)
                router.refresh()
                toast.success("Plantilla aplicada con éxito")
            } else {
                toast.error("Error: No se encontró el programa base.")
            }
        } catch (error) {
            toast.error("Error al aplicar plantilla")
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleRedeem = async () => {
        if (!redemptionCode) return

        // CHECK IF IT IS A VISIT SCAN (V:)
        if (redemptionCode.toUpperCase().startsWith('V:')) {
            const token = redemptionCode.substring(2)
            setScannedVisitToken(token)
            setRedemptionCode("")
            return // Stop here, UI will show Rating Modal
        }

        setIsRedeeming(true)
        setIsRedeeming(true)

        try {
            const res = await redeemReward(userId, redemptionCode)
            if (res.success) {
                toast.success(`¡Premio Canjeado! ${res.rewardName} para ${res.customerName}`)
                setRedemptionCode("")
            } else {
                toast.error(res.error || "Código inválido o ya usado")
            }
        } catch (e) {
            toast.error("Error de conexión")
        } finally {
            setIsRedeeming(false)
        }
    }

    const handleConfirmVisit = async () => {
        if (!scannedVisitToken) return
        setIsSubmitting(true)
        try {
            const res = await logCustomerVisit(userId, scannedVisitToken, {
                rating: ratingValue,
                comment: ratingComment
            }, program.pointsPercentage ? { spendAmount: parseFloat(visitSpendAmount) || 0 } : undefined)

            if (res.success) {
                toast.success("¡Visita Registrada y Cliente Calificado!")
                setScannedVisitToken(null)
                setRatingValue(5)
                setRatingComment("")
                setVisitSpendAmount("")
                setRedemptionCode("")
            } else {
                toast.error(res.error || "Error al registrar visita")
            }
        } catch (error) {
            toast.error("Error de conexión")
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleEditRule = (rule: any) => {
        setEditingRuleId(rule.id)
        setNewRule({
            name: rule.name,
            triggerType: rule.trigger,
            conditionType: rule.conditions.type,
            params: {
                count: rule.conditions.count || 2,
                days: rule.conditions.days || 7,
                day: rule.conditions.day || "Thursday",
                amount: rule.conditions.amount || 0
            },
            rewardText: rule.description || "Recompensa"
        })
        setIsCreatingRule(true)
    }

    const handleCreateRule = async () => {
        setIsSubmitting(true)
        let conditionValue = {}
        if (newRule.conditionType === "frequency") {
            conditionValue = { type: "frequency", count: newRule.params.count, days: newRule.params.days }
        } else if (newRule.conditionType === "specific_day") {
            conditionValue = { type: "specific_day", day: newRule.params.day }
        }

        let res;
        if (editingRuleId) {
            res = await updateLoyaltyRule(program.id, editingRuleId, {
                name: newRule.name,
                triggerType: newRule.triggerType,
                conditionValue,
                rewardText: newRule.rewardText
            })
        } else {
            res = await createLoyaltyRule(program.id, {
                name: newRule.name,
                triggerType: newRule.triggerType,
                conditionValue,
                rewardText: newRule.rewardText
            })
        }

        setIsSubmitting(false)
        if (res.success) {
            toast.success(editingRuleId ? "Regla actualizada" : "Regla creada")
            setIsCreatingRule(false)
            setEditingRuleId(null)
            setNewRule({ name: "", triggerType: "VISIT", conditionType: "frequency", params: { count: 2, days: 7, day: "Thursday", amount: 0 }, rewardText: "" })
            router.refresh()
        } else {
            toast.error("Error al guardar la regla")
        }
    }

    const handleCreateReward = async () => {
        setIsSubmitting(true)
        let res
        if (editingRewardId) {
            res = await updateLoyaltyReward(program.id, editingRewardId, rewardForm)
        } else {
            res = await addLoyaltyReward(program.id, {
                name: rewardForm.name,
                costInVisits: rewardForm.costInVisits,
                description: rewardForm.description
            })
        }

        setIsSubmitting(false)
        if (res.success) {
            toast.success(editingRewardId ? "Premio actualizado" : "Premio creado")
            setIsCreatingReward(false)
            setEditingRewardId(null)
            setRewardForm({ name: "", costInVisits: 5, description: "" })
            router.refresh()
        } else {
            toast.error("Error al guardar el premio")
        }
    }

    const handleEditReward = (reward: any) => {
        setEditingRewardId(reward.id)
        setRewardForm({
            name: reward.name,
            costInVisits: reward.costInVisits,
            description: reward.description || ""
        })
        setIsCreatingReward(true)
    }

    const handleDeleteReward = async (rewardId: string) => {
        if (confirm("¿Estás seguro de eliminar este premio?")) {
            const res = await deleteLoyaltyReward(program.id, rewardId)
            if (res.success) {
                toast.success("Premio eliminado")
            } else {
                toast.error("Error el eliminar")
            }
        }
    }

    // --- RENDER ---

    if (!program || (!program.rules?.length && !program.rewards?.length && program._count?.customers === 0)) {
        if (!program) {
            return (
                <div className="flex items-center justify-center min-h-[400px] bg-[#111] rounded-3xl border border-white/10 p-8 text-center">
                    <div className="max-w-md">
                        <div className="w-20 h-20 bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 rounded-3xl flex items-center justify-center mx-auto mb-6 backdrop-blur-sm border border-white/10">
                            <Sparkles className="w-10 h-10 text-violet-400" />
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-2">Bienvenido a HappyMeter</h2>
                        <p className="text-gray-400 mb-8">Para comenzar, contacta a soporte para activar tu cuenta.</p>
                    </div>
                </div>
            )
        }

        return (
            <div className="flex flex-col items-center justify-center min-h-[600px] bg-[#0a0a0f] p-8 text-center animate-in fade-in duration-500">
                <div className="max-w-4xl w-full">
                    <h2 className="text-3xl font-bold text-white mb-2">Elige tu Plantilla de Lealtad</h2>
                    <p className="text-gray-400 mb-12 max-w-lg mx-auto">Selecciona el tipo de negocio para configurar automáticamente tus reglas y premios ideales.</p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="group relative bg-[#111] border border-white/10 rounded-3xl p-8 text-left hover:border-orange-500/50 hover:bg-white/5 transition-all cursor-pointer overflow-hidden"
                            onClick={() => handleApplyTemplate('restaurant')}
                        >
                            <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                <ArrowRight className="w-6 h-6 text-orange-500 -rotate-45 group-hover:rotate-0 transition-transform duration-300" />
                            </div>
                            <div className="w-14 h-14 bg-gradient-to-br from-orange-400 to-red-500 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-orange-500/20 group-hover:scale-110 transition-transform">
                                <Utensils className="w-7 h-7 text-white" />
                            </div>
                            <h3 className="text-2xl font-bold text-white mb-2">Restaurantes</h3>
                            <p className="text-gray-400 text-sm mb-6">Juegos para espera de mesa, post-comida y fidelización clásica.</p>
                            <div className="space-y-2">
                                <div className="flex items-center gap-2 text-xs text-gray-500"><div className="w-1.5 h-1.5 rounded-full bg-orange-500" /> Postres gratis</div>
                                <div className="flex items-center gap-2 text-xs text-gray-500"><div className="w-1.5 h-1.5 rounded-full bg-orange-500" /> Cenas de regalo</div>
                                <div className="flex items-center gap-2 text-xs text-gray-500"><div className="w-1.5 h-1.5 rounded-full bg-orange-500" /> Descuentos VIP</div>
                            </div>
                            <div className="mt-8">
                                <span className="px-3 py-1 bg-green-500/10 text-green-400 text-xs font-bold rounded-full border border-green-500/20">Recomendado</span>
                            </div>
                        </div>

                        <div className="group relative bg-[#111] border border-white/10 rounded-3xl p-8 text-left hover:border-fuchsia-500/50 hover:bg-white/5 transition-all cursor-pointer overflow-hidden"
                            onClick={() => handleApplyTemplate('bar')}
                        >
                            <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                <ArrowRight className="w-6 h-6 text-fuchsia-500 -rotate-45 group-hover:rotate-0 transition-transform duration-300" />
                            </div>
                            <div className="w-14 h-14 bg-gradient-to-br from-fuchsia-500 to-purple-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-fuchsia-500/20 group-hover:scale-110 transition-transform">
                                <Wine className="w-7 h-7 text-white" />
                            </div>
                            <h3 className="2xl font-bold text-white mb-2">Bares y Antros</h3>
                            <p className="text-gray-400 text-sm mb-6">Dinámicas de shots, retos y promociones en tiempo real para grupos.</p>
                            <div className="space-y-2">
                                <div className="flex items-center gap-2 text-xs text-gray-500"><div className="w-1.5 h-1.5 rounded-full bg-fuchsia-500" /> Shots de bienvenida</div>
                                <div className="flex items-center gap-2 text-xs text-gray-500"><div className="w-1.5 h-1.5 rounded-full bg-fuchsia-500" /> Rondas para mesas</div>
                                <div className="flex items-center gap-2 text-xs text-gray-500"><div className="w-1.5 h-1.5 rounded-full bg-fuchsia-500" /> Botellas de regalo</div>
                            </div>
                            <div className="mt-8">
                                <span className="px-3 py-1 bg-fuchsia-500/10 text-fuchsia-400 text-xs font-bold rounded-full border border-fuchsia-500/20">Más Popular</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-[#0a0a0f] text-white p-6 font-sans">
            <div className="max-w-7xl mx-auto space-y-8">
                <div className="flex justify-between items-center">
                    <div>
                        <div className="flex items-center gap-4 mb-1">
                            <button
                                onClick={onBack}
                                className="p-2 bg-white/5 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors"
                            >
                                <ArrowRight className="w-5 h-5 rotate-180" />
                            </button>
                            <h1 className="text-3xl font-bold tracking-tight">Panel de Lealtad</h1>
                        </div>
                        <p className="text-gray-400 ml-12">Gestiona tus reglas, premios y clientes.</p>
                    </div>
                </div>

                <PremiumTabs activeTab={activeTab} setActiveTab={setActiveTab}>
                    {activeTab === 'staff' && (
                        <div className="animate-in fade-in duration-500">
                            <StaffManagementView />
                        </div>
                    )}

                    {activeTab === 'overview' && (
                        <div className="space-y-8 animate-in fade-in duration-500">
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <StatCard
                                    title="Total Miembros"
                                    value={program._count?.customers || 0}
                                    icon={Trophy}
                                    gradient="from-yellow-400/20 to-orange-500/20"
                                    iconColor="text-yellow-400"
                                />
                                <StatCard
                                    title="Reglas Activas"
                                    value={program.rules?.length || 0}
                                    icon={Zap}
                                    gradient="from-blue-400/20 to-cyan-500/20"
                                    iconColor="text-cyan-400"
                                />
                                <StatCard
                                    title="Premios Entregados"
                                    value={program._count?.redemptions || 0}
                                    icon={Gift}
                                    gradient="from-pink-400/20 to-rose-500/20"
                                    iconColor="text-pink-400"
                                />
                                <StatCard
                                    title="Nivel de Retención"
                                    value="85%"
                                    icon={BarChart3}
                                    gradient="from-emerald-400/20 to-green-500/20"
                                    iconColor="text-emerald-400"
                                />
                            </div>

                            {/* FIRST VISIT GIFT CARD */}
                            <div className="mb-8">
                                <WelcomeGiftCard
                                    program={program}
                                    onUpdate={async (enable, text) => {
                                        await updateLoyaltyProgram(program.id, {
                                            enableFirstVisitGift: enable,
                                            firstVisitGiftText: text
                                        })
                                        router.refresh()
                                    }}
                                />
                            </div>

                            {/* QUICK ACTIONS & REDEMPTION */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 relative z-10">
                                {/* Client Link Card */}
                                <div className="bg-[#111] p-8 rounded-3xl border border-white/10 relative overflow-hidden group">
                                    <div className="absolute inset-0 bg-gradient-to-r from-violet-600/5 to-fuchsia-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                                    <h3 className="text-lg font-bold text-white mb-2 relative z-10">Tarjeta Digital</h3>
                                    <p className="text-gray-400 text-sm mb-6 relative z-10">Comparte este enlace con tus clientes.</p>

                                    <div className="bg-black/30 p-4 rounded-xl border border-white/5 flex items-center justify-between gap-4 backdrop-blur-md relative z-10">
                                        <code className="text-gray-400 text-xs font-mono truncate">
                                            .../loyalty/{program.id}
                                        </code>
                                        <button
                                            onClick={() => window.open(`/loyalty/${program.id}`, '_blank')}
                                            className="p-2 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-colors"
                                        >
                                            <QrCode className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>

                                {/* REDEMPTION SCANNER INPUT */}
                                <div className="bg-[#111] p-8 rounded-3xl border border-white/10 relative overflow-hidden group">
                                    <div className="absolute inset-0 bg-gradient-to-r from-orange-500/5 to-red-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                                    <h3 className="text-lg font-bold text-white mb-2 relative z-10">Canjeo Rápido</h3>
                                    <p className="text-gray-400 text-sm mb-6 relative z-10">Ingresa el código del cliente para entregar premio.</p>

                                    <div className="flex gap-2 relative z-10">
                                        <input
                                            value={redemptionCode}
                                            onChange={(e) => setRedemptionCode(e.target.value)}
                                            placeholder="Código (R:Premio o V:Visita)"
                                            onKeyDown={(e) => e.key === 'Enter' && handleRedeem()}
                                            className="flex-1 bg-black/30 border border-white/5 rounded-xl px-4 text-white text-sm focus:outline-none focus:border-orange-500 transition-colors uppercase"
                                        />
                                        <button
                                            onClick={handleRedeem}
                                            disabled={isRedeeming || !redemptionCode}
                                            className="px-4 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-bold text-sm transition-colors disabled:opacity-50"
                                        >
                                            {isRedeeming ? "..." : "Canjear"}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* PROMOTIONS TAB */}
                    {activeTab === 'promotions' && (
                        <div className="animate-in fade-in duration-500">
                            <PromotionsManager programId={program.id} />
                        </div>
                    )}

                    {activeTab === 'history' && (
                        <div className="animate-in fade-in duration-500">
                            <RedemptionHistory programId={program.id} />
                        </div>
                    )}

                    {/* CLIENTS TAB */}
                    {activeTab === 'clients' && (
                        <div className="animate-in fade-in duration-500">
                            {isLoadingCustomers ? (
                                <div className="p-12 text-center text-gray-500">
                                    <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
                                    Cargando cartera...
                                </div>
                            ) : (
                                <CustomerList customers={customers} />
                            )}
                        </div>
                    )}

                    {/* REWARDS TAB */}


                    {/* TIERS TAB */}
                    {activeTab === 'tiers' && (
                        <div className="animate-in fade-in duration-500">
                            <TiersManager programId={program.id} tiers={program.tiers || []} />
                        </div>
                    )}

                    {activeTab === 'notifications' && (
                        <div className="animate-in fade-in duration-500">
                            <NotificationsManager programId={program.id} />
                        </div>
                    )}
                </PremiumTabs>

                {/* CREATE RULE MODAL */}
                {isCreatingRule && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                        <div className="bg-[#111] border border-white/10 rounded-3xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                            <div className="p-6 border-b border-white/10 flex justify-between items-center">
                                <h3 className="text-lg font-bold text-white">Nueva Regla de Automatización</h3>
                                <button onClick={() => setIsCreatingRule(false)} className="text-gray-400 hover:text-white">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                                {/* Name */}
                                <div>
                                    <label className="block text-xs font-medium text-gray-400 uppercase mb-1">Nombre de la Regla</label>
                                    <input
                                        type="text"
                                        placeholder="Ej. Jueves de Amigos"
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors"
                                        value={newRule.name}
                                        onChange={(e) => setNewRule({ ...newRule, name: e.target.value })}
                                    />
                                </div>

                                {/* Condition Type Selector */}
                                <div>
                                    <label className="block text-xs font-medium text-gray-400 uppercase mb-2">Tipo de Condición</label>
                                    <div className="grid grid-cols-2 gap-2">
                                        <button
                                            onClick={() => setNewRule({ ...newRule, conditionType: "frequency" })}
                                            className={cn("text-center p-3 rounded-xl border transition-all text-sm font-medium", newRule.conditionType === "frequency" ? "bg-blue-600 border-blue-600 text-white" : "bg-white/5 border-white/10 text-gray-400 hover:bg-white/10")}
                                        >
                                            Frecuencia
                                        </button>
                                        <button
                                            onClick={() => setNewRule({ ...newRule, conditionType: "specific_day" })}
                                            className={cn("text-center p-3 rounded-xl border transition-all text-sm font-medium", newRule.conditionType === "specific_day" ? "bg-blue-600 border-blue-600 text-white" : "bg-white/5 border-white/10 text-gray-400 hover:bg-white/10")}
                                        >
                                            Día Específico
                                        </button>
                                    </div>
                                </div>

                                {/* Dynamic Condition Params */}
                                <div className="bg-white/5 p-4 rounded-xl border border-white/10 space-y-4">
                                    {newRule.conditionType === "frequency" && (
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-xs font-medium text-gray-400 mb-1">Visitas Requeridas</label>
                                                <input
                                                    type="number"
                                                    min="1"
                                                    className="w-full bg-[#1A1A1A] border border-white/10 rounded-lg px-3 py-2 text-white focus:border-blue-500 outline-none"
                                                    value={newRule.params.count}
                                                    onChange={(e) => setNewRule({ ...newRule, params: { ...newRule.params, count: parseInt(e.target.value) || 0 } })}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-medium text-gray-400 mb-1">En un periodo de (Días)</label>
                                                <input
                                                    type="number"
                                                    min="1"
                                                    className="w-full bg-[#1A1A1A] border border-white/10 rounded-lg px-3 py-2 text-white focus:border-blue-500 outline-none"
                                                    value={newRule.params.days}
                                                    onChange={(e) => setNewRule({ ...newRule, params: { ...newRule.params, days: parseInt(e.target.value) || 0 } })}
                                                />
                                            </div>
                                            <div className="col-span-2 text-xs text-gray-500 italic text-center">
                                                Ej: {newRule.params.count} visitas en los últimos {newRule.params.days} días.
                                            </div>
                                        </div>
                                    )}

                                    {newRule.conditionType === "specific_day" && (
                                        <div>
                                            <label className="block text-xs font-medium text-gray-400 mb-1">Día de la Semana</label>
                                            <select
                                                className="w-full bg-[#1A1A1A] border border-white/10 rounded-lg px-3 py-2 text-white focus:border-blue-500 outline-none appearance-none"
                                                value={newRule.params.day}
                                                onChange={(e) => setNewRule({ ...newRule, params: { ...newRule.params, day: e.target.value } })}
                                            >
                                                <option value="Monday">Lunes</option>
                                                <option value="Tuesday">Martes</option>
                                                <option value="Wednesday">Miércoles</option>
                                                <option value="Thursday">Jueves</option>
                                                <option value="Friday">Viernes</option>
                                                <option value="Saturday">Sábado</option>
                                                <option value="Sunday">Domingo</option>
                                            </select>
                                            <div className="mt-2 text-xs text-gray-500 italic text-center">
                                                La regla se activará si visitan en {newRule.params.day === "Wednesday" ? "Miércoles" : newRule.params.day === "Thursday" ? "Jueves" : newRule.params.day === "Friday" ? "Viernes" : newRule.params.day === "Saturday" ? "Sábado" : newRule.params.day === "Sunday" ? "Domingo" : newRule.params.day === "Monday" ? "Lunes" : "Martes"}.
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-xs font-medium text-gray-400 uppercase mb-1">Recompensa (Texto)</label>
                                    <input
                                        type="text"
                                        placeholder="Ej. Shot Gratis"
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors"
                                        value={newRule.rewardText}
                                        onChange={(e) => setNewRule({ ...newRule, rewardText: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="p-6 pt-0 flex gap-3">
                                <button onClick={() => setIsCreatingRule(false)} className="flex-1 px-4 py-3 bg-white/5 text-gray-300 rounded-xl font-medium hover:bg-white/10 transition-colors">Cancelar</button>
                                <button
                                    onClick={handleCreateRule}
                                    disabled={isSubmitting || !newRule.name || !newRule.rewardText}
                                    className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isSubmitting ? "Creando..." : "Crear Regla"}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* CLIENT PREVIEW MODAL */}
                {isPreviewing && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in duration-200">
                        <button
                            onClick={() => setIsPreviewing(false)}
                            className="absolute top-6 right-6 p-2 bg-white/10 rounded-full text-white hover:bg-white/20 transition-colors z-50"
                        >
                            <X className="w-6 h-6" />
                        </button>

                        <div className="relative w-full max-w-[375px] h-[812px] bg-black rounded-[40px] border-[8px] border-[#222] shadow-2xl overflow-hidden flex flex-col">
                            {/* Status Bar Mock */}
                            <div className="h-12 bg-black flex justify-between items-center px-6 text-white text-xs font-medium z-10 sticky top-0">
                                <span>9:41</span>
                                <div className="flex gap-1.5">
                                    <div className="w-4 h-2.5 bg-white/20 rounded-[1px]" />
                                    <div className="w-4 h-2.5 bg-white/20 rounded-[1px]" />
                                    <div className="w-4 h-2.5 bg-white rounded-[1px]" />
                                </div>
                            </div>

                            {/* Header Mock */}
                            <div className="bg-[#111] px-4 py-3 flex items-center justify-center border-b border-white/5">
                                <span className="text-[10px] font-bold tracking-widest text-gray-500 uppercase">Vista Previa del Cliente (Móvil)</span>
                            </div>

                            <div className="flex-1 bg-black relative">
                                <CustomerLoyaltyCard
                                    customer={{
                                        id: "preview-customer",
                                        firstName: "Cliente",
                                        visits: 5,
                                        currentVisits: 5,
                                        magicToken: "PREVIEW-CODE",
                                        redemptions: [],
                                        program: program
                                    }}
                                />
                            </div>

                            {/* Home Indicator */}
                            <div className="h-6 bg-black flex justify-center items-end pb-1.5">
                                <div className="w-32 h-1 bg-white/20 rounded-full" />
                            </div>
                        </div>
                    </div>
                )}

                {/* REWARD MODAL */}
                {isCreatingReward && (
                    <div className="fixed inset-0 bg-black/80 z-[60] flex items-center justify-center p-4 backdrop-blur-sm" onClick={() => setIsCreatingReward(false)}>
                        <div className="bg-[#111] border border-white/10 w-full max-w-md p-6 rounded-3xl animate-in fade-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-xl font-bold text-white">
                                    {editingRewardId ? "Editar Premio" : "Nuevo Premio"}
                                </h3>
                                <button onClick={() => setIsCreatingReward(false)} className="text-gray-400 hover:text-white">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <label className="text-xs text-gray-500 uppercase font-bold block mb-2">Nombre del Premio</label>
                                    <input
                                        value={rewardForm.name}
                                        onChange={(e) => setRewardForm({ ...rewardForm, name: e.target.value })}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-purple-500"
                                        placeholder="Ej. Botella de Regalo"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-gray-500 uppercase font-bold block mb-2">Visitas Requeridas (Escalones)</label>
                                    <input
                                        type="number"
                                        value={rewardForm.costInVisits}
                                        onChange={(e) => setRewardForm({ ...rewardForm, costInVisits: parseInt(e.target.value) || 0 })}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-purple-500"
                                        placeholder="5"
                                    />
                                    <p className="text-xs text-gray-600 mt-1">El cliente desbloqueará esto en su visita #{rewardForm.costInVisits || 'X'}.</p>
                                </div>
                                <div>
                                    <label className="text-xs text-gray-500 uppercase font-bold block mb-2">Descripción</label>
                                    <textarea
                                        value={rewardForm.description}
                                        onChange={(e) => setRewardForm({ ...rewardForm, description: e.target.value })}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-purple-500 h-24 resize-none"
                                        placeholder="Detalles para el cliente..."
                                    />
                                </div>
                                <button
                                    disabled={isSubmitting || !rewardForm.name || !rewardForm.costInVisits}
                                    onClick={handleCreateReward}
                                    className="w-full bg-white text-black py-4 rounded-xl font-bold hover:bg-gray-200 transition-colors disabled:opacity-50 mt-4"
                                >
                                    {isSubmitting ? "Guardando..." : "Guardar Premio"}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* RATING MODAL */}
                {scannedVisitToken && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in duration-200">
                        <div className="bg-[#111] border border-white/10 rounded-3xl w-full max-w-sm overflow-hidden text-center p-8">
                            <div className="w-16 h-16 bg-gradient-to-br from-orange-400 to-yellow-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-orange-500/20">
                                <Star className="w-8 h-8 text-white fill-white" />
                            </div>

                            <h3 className="text-xl font-bold text-white mb-2">
                                {program.pointsPercentage ? "Registrar Consumo" : "Califica al Cliente"}
                            </h3>
                            <p className="text-gray-400 text-sm mb-6">
                                {program.pointsPercentage ? "Ingresa el monto del ticket para sumar puntos." : "Esta visita quedará registrada en su perfil."}
                            </p>

                            {program.pointsPercentage && (
                                <div className="mb-6 space-y-4">
                                    <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                                        <div className="text-xs text-gray-500 uppercase font-bold mb-2">Monto del Ticket</div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-2xl text-gray-400">$</span>
                                            <input
                                                type="number"
                                                value={visitSpendAmount}
                                                onChange={(e) => setVisitSpendAmount(e.target.value)}
                                                placeholder="0.00"
                                                className="bg-transparent text-3xl font-bold text-white w-full outline-none placeholder:text-gray-700"
                                                autoFocus
                                            />
                                        </div>
                                    </div>

                                    <button className="w-full py-4 bg-white/5 border-2 border-dashed border-white/10 rounded-2xl flex items-center justify-center gap-2 text-gray-400 hover:bg-white/10 hover:border-white/20 transition-all group">
                                        <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-white/20 transition-colors">
                                            <Camera className="w-4 h-4" />
                                        </div>
                                        <span className="text-sm font-medium">Tomar Foto del Ticket</span>
                                    </button>
                                </div>
                            )}

                            <div className="flex justify-center gap-2 mb-6">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <button
                                        key={star}
                                        onClick={() => setRatingValue(star)}
                                        className="transition-transform hover:scale-110 focus:outline-none"
                                    >
                                        <Star
                                            className={cn(
                                                "w-8 h-8 transition-colors",
                                                star <= ratingValue ? "text-yellow-400 fill-yellow-400" : "text-gray-600"
                                            )}
                                        />
                                    </button>
                                ))}
                            </div>

                            <textarea
                                value={ratingComment}
                                onChange={(e) => setRatingComment(e.target.value)}
                                placeholder="Comentarios (opcional)..."
                                className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white text-sm focus:outline-none focus:border-yellow-500 transition-colors mb-6 h-24 resize-none"
                            />

                            <div className="flex gap-3">
                                <button
                                    onClick={() => setScannedVisitToken(null)}
                                    className="flex-1 py-3 bg-white/10 text-gray-300 rounded-xl font-medium hover:bg-white/20 transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleConfirmVisit}
                                    disabled={isSubmitting}
                                    className="flex-1 py-3 bg-orange-500 text-white rounded-xl font-bold hover:bg-orange-600 transition-colors"
                                >
                                    {isSubmitting ? "Guardando..." : "Confirmar"}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
