import { useState } from "react"
import { motion } from "framer-motion"
import { Users, LayoutGrid, Gift, MessageSquare, History, Trophy, Bell, Share2, Plus, Zap, Check } from "lucide-react"
import { cn } from "@/lib/utils"
import { StaffInviteForm } from "@/components/team/StaffInviteForm"
import { Button } from "@/components/ui/button"

// --- PremiumTabs ---

export function PremiumTabs({ activeTab, setActiveTab, children }: { activeTab: string, setActiveTab: (t: string) => void, children: React.ReactNode }) {
    const tabs = [
        { id: 'overview', label: 'General', icon: LayoutGrid },
        { id: 'clients', label: 'Cartera', icon: Users },
        { id: 'promotions', label: 'Promociones', icon: MessageSquare },
        { id: 'tiers', label: 'Niveles', icon: Trophy },
        { id: 'history', label: 'Historial', icon: History },
        { id: 'notifications', label: 'Avisos', icon: Bell },
        { id: 'staff', label: 'Equipo', icon: Users }, // Reused icon or maybe different one
    ]

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap gap-2 border-b border-white/10 pb-4">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={cn(
                            "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all",
                            activeTab === tab.id
                                ? "bg-white text-black shadow-lg shadow-white/10"
                                : "text-gray-400 hover:text-white hover:bg-white/5"
                        )}
                    >
                        <tab.icon className="w-4 h-4" />
                        {tab.label}
                    </button>
                ))}
            </div>
            {children}
        </div>
    )
}

// --- WelcomeGiftCard ---

interface WelcomeGiftCardProps {
    program: any
    onUpdate: (enable: boolean, text: string) => void
}

export function WelcomeGiftCard({ program, onUpdate }: WelcomeGiftCardProps) {
    const [enabled, setEnabled] = useState(program.enableFirstVisitGift || false)
    const [text, setText] = useState(program.firstVisitGiftText || "¡Un regalo de bienvenida!")
    const [isEditing, setIsEditing] = useState(false)

    const handleSave = () => {
        onUpdate(enabled, text)
        setIsEditing(false)
    }

    return (
        <div className="bg-[#111] p-6 rounded-3xl border border-white/10 relative overflow-hidden">
            <div className="flex justify-between items-start">
                <div className="flex gap-4">
                    <div className="w-12 h-12 bg-pink-500/10 rounded-xl flex items-center justify-center border border-pink-500/20">
                        <Gift className="w-6 h-6 text-pink-400" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-white">Regalo de Bienvenida</h3>
                        <p className="text-gray-400 text-sm max-w-sm">
                            Atrae nuevos clientes ofreciendo un incentivo en su primera visita.
                        </p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => {
                            const newState = !enabled
                            setEnabled(newState)
                            onUpdate(newState, text)
                        }}
                        className={cn(
                            "w-12 h-6 rounded-full transition-colors relative",
                            enabled ? "bg-green-500" : "bg-gray-700"
                        )}
                    >
                        <div className={cn(
                            "absolute top-1 w-4 h-4 bg-white rounded-full transition-transform shadow-sm",
                            enabled ? "left-7" : "left-1"
                        )} />
                    </button>
                </div>
            </div>

            {enabled && (
                <div className="mt-6 pl-16">
                    {isEditing ? (
                        <div className="flex gap-2">
                            <input
                                value={text}
                                onChange={(e) => setText(e.target.value)}
                                className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm"
                                autoFocus
                            />
                            <button onClick={handleSave} className="p-2 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30">
                                <Check className="w-4 h-4" />
                            </button>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2">
                            <p className="text-white text-sm font-medium">"{text}"</p>
                            <button onClick={() => setIsEditing(true)} className="text-xs text-gray-500 hover:text-white underline">
                                Editar
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}

// --- StaffManagementView ---

export function StaffManagementView() {
    // This is a placeholder. Real implementation should fetch staff lists.
    // For now, it shows the Invite Form.
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
                <h3 className="text-xl font-bold text-white mb-4">Invitar Personal</h3>
                <div className="bg-[#111] p-6 rounded-3xl border border-white/10">
                    <StaffInviteForm />
                </div>
            </div>
            <div>
                <h3 className="text-xl font-bold text-white mb-4">Equipo Activo</h3>
                <div className="bg-[#111] p-6 rounded-3xl border border-white/10 text-center text-gray-500 py-12">
                    <Users className="w-10 h-10 mx-auto mb-2 opacity-50" />
                    <p>La gestión de lista de personal estará disponible pronto.</p>
                </div>
            </div>
        </div>
    )
}

// --- LoyaltyStatCard ---

export function LoyaltyStatCard({ title, value, icon: Icon, gradient, iconColor }: { title: string, value: string | number, icon: any, gradient: string, iconColor: string }) {
    return (
        <div className="bg-[#111] p-6 rounded-3xl border border-white/10 relative overflow-hidden group hover:border-white/20 transition-colors">
            <div className={cn("absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-10 transition-opacity", gradient)} />
            <div className="flex justify-between items-start relative z-10">
                <div>
                    <p className="text-gray-400 text-sm font-medium mb-1">{title}</p>
                    <h4 className="text-3xl font-bold text-white">{value}</h4>
                </div>
                <div className={cn("p-3 rounded-xl bg-white/5", iconColor)}>
                    <Icon className="w-6 h-6" />
                </div>
            </div>
        </div>
    )
}
