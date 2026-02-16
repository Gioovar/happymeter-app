'use client'

import { TeamRole } from "@prisma/client"
import { motion } from "framer-motion"
import { Store, Check, ArrowRight, Loader2, LogOut } from "lucide-react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { setContext } from "@/actions/ops-context"
import { toast } from "sonner"
import { useClerk } from "@clerk/nextjs"

interface Membership {
    id: string
    role: TeamRole
    name: string | null
    jobTitle: string | null
    owner: {
        businessName: string | null
        logoUrl: string | null
        userId: string
    }
}

export default function ContextSelectorClient({ memberships }: { memberships: Membership[] }) {
    const router = useRouter()
    const { signOut } = useClerk()
    const [isLoading, setIsLoading] = useState<string | null>(null)

    const handleSelect = async (membershipId: string) => {
        setIsLoading(membershipId)
        try {
            await setContext(membershipId)
            // The action will handle redirect, but we can fast-feedback here
            // toast.success("Cambiando contexto...")
        } catch (error) {
            toast.error("Error al cambiar de sucursal")
            setIsLoading(null)
        }
    }

    const handleLogout = async () => {
        await signOut({ redirectUrl: '/ops/login' })
    }

    return (
        <div className="space-y-4">
            <div className="grid gap-3">
                {memberships.map((membership) => (
                    <motion.button
                        key={membership.id}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleSelect(membership.id)}
                        disabled={!!isLoading}
                        className={`group relative flex items-center p-4 bg-slate-900/50 hover:bg-slate-800/80 border border-white/10 hover:border-indigo-500/50 rounded-xl transition-all text-left w-full ${isLoading === membership.id ? 'opacity-70 cursor-wait' : ''}`}
                    >
                        {/* Logo/Icon */}
                        <div className="w-12 h-12 rounded-lg bg-indigo-500/10 flex items-center justify-center mr-4 group-hover:bg-indigo-500/20 transition-colors border border-indigo-500/20">
                            {membership.owner.logoUrl ? (
                                <img src={membership.owner.logoUrl} alt="" className="w-full h-full object-cover rounded-lg" />
                            ) : (
                                <Store className="w-6 h-6 text-indigo-400" />
                            )}
                        </div>

                        <div className="flex-1">
                            <h3 className="font-bold text-white group-hover:text-indigo-400 transition-colors">
                                {membership.owner.businessName || "Sin Nombre Comercial"}
                            </h3>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="text-xs font-medium text-slate-400 bg-slate-950 px-2 py-0.5 rounded-full border border-white/5">
                                    {membership.role}
                                </span>
                                {membership.jobTitle && (
                                    <span className="text-xs text-slate-500 truncate max-w-[120px]">
                                        {membership.jobTitle}
                                    </span>
                                )}
                            </div>
                        </div>

                        <div className="ml-3">
                            {isLoading === membership.id ? (
                                <Loader2 className="w-5 h-5 text-indigo-500 animate-spin" />
                            ) : (
                                <ArrowRight className="w-5 h-5 text-slate-600 group-hover:text-indigo-400 transition-colors" />
                            )}
                        </div>
                    </motion.button>
                ))}
            </div>

            <div className="pt-8 flex justify-center">
                <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 text-slate-500 hover:text-red-400 transition-colors text-sm font-medium px-4 py-2 rounded-lg hover:bg-white/5"
                >
                    <LogOut className="w-4 h-4" />
                    Cerrar Sesión
                </button>
            </div>
        </div>
    )
}
