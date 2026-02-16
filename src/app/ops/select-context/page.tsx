import { getMembershipContexts } from "@/actions/team"
import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import BrandLogo from "@/components/BrandLogo"
import { ShieldCheck, LogOut, Store, ChevronRight } from "lucide-react"
import ContextSelectorClient from "./ContextSelectorClient"

export default async function SelectContextPage() {
    const { userId } = await auth()
    if (!userId) redirect("/ops/login")

    const memberships = await getMembershipContexts(userId)

    if (memberships.length === 0) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 text-center">
                <div className="max-w-md w-full bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-2xl p-8">
                    <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-500/50">
                        <ShieldCheck className="w-8 h-8 text-red-500" />
                    </div>
                    <h1 className="text-xl font-bold text-white mb-2">Sin Acceso</h1>
                    <p className="text-slate-400 mb-6">No tienes ninguna membresía activa en ninguna sucursal.</p>
                    <a href="/ops/login?mode=signup" className="text-indigo-400 hover:text-white font-medium">Crear cuenta nueva</a>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-md space-y-8">
                <div className="text-center space-y-4">
                    <div className="flex justify-center mb-2">
                        <BrandLogo size="lg" />
                    </div>
                    <h1 className="text-2xl font-bold text-white">Selecciona una Sucursal</h1>
                    <p className="text-slate-400">Tienes acceso a múltiples ubicaciones. Elige a cual quieres entrar.</p>
                </div>

                <ContextSelectorClient memberships={memberships} />
            </div>
        </div>
    )
}
