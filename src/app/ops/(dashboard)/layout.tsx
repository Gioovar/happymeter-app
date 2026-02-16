import { redirect } from "next/navigation"
import { ShieldCheck, Home, History as HistoryIcon, ShieldX } from "lucide-react" // Removed LogOut
import Link from "next/link"
import OpsHeader from "./OpsHeader"
import { getOpsSession } from "@/lib/ops-auth"

export default async function OpsLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const { isAuthenticated, member, requiresContextSelection } = await getOpsSession()

    if (!isAuthenticated) redirect("/ops/login")
    if (requiresContextSelection) redirect("/ops/select-context")

    // Check if user is an active OPERATOR or ADMIN/OWNER
    // If member exists, check active status
    if (member) {
        if (!member.isActive) {
            return (
                <div className="min-h-screen flex items-center justify-center bg-[#050505] text-white p-8 text-center relative overflow-hidden">
                    {/* Background effects */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-rose-500/10 blur-[120px] rounded-full" />

                    <div className="relative z-10 max-w-md w-full bg-white/5 border border-white/10 backdrop-blur-2xl p-10 rounded-[40px] shadow-2xl">
                        <div className="w-20 h-20 bg-rose-500/20 rounded-3xl flex items-center justify-center mx-auto mb-8 border border-rose-500/30 rotate-12 hover:rotate-0 transition-transform duration-500">
                            < ShieldX className="w-10 h-10 text-rose-500" />
                        </div>
                        <h1 className="text-3xl font-black mb-4 tracking-tight">Acceso Bloqueado</h1>
                        <p className="text-gray-400 text-sm leading-relaxed mb-8">
                            Oops! Tu acceso a esta sucursal ha sido desactivado temporalmente.
                            <span className="block mt-2 font-bold text-white">Por favor, comunícate con tu supervisor para más información.</span>
                        </p>
                        <Link
                            href="/"
                            className="w-full py-4 px-6 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl block font-bold transition-all hover:scale-[1.02] active:scale-[0.98]"
                        >
                            Volver al inicio
                        </Link>
                    </div>
                </div>
            )
        }
    }

    // If authenticated but no member (e.g. Owner via Clerk), we allow access.

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
            {/* Mobile Header (Client Component) */}
            <OpsHeader />

            {/* Main Content */}
            <main className="flex-1 p-4 pb-24">
                {children}
            </main>

            {/* Bottom Nav (If deeper navigation needed later, for now just Home) */}
            <nav className="fixed bottom-0 left-0 right-0 h-16 bg-slate-900 border-t border-slate-800 flex items-center justify-around px-4 pb-safe z-40">
                <Link href="/ops/tasks" className="flex flex-col items-center gap-1 text-slate-400 hover:text-indigo-400 transition-colors">
                    <Home className="w-6 h-6" />
                    <span className="text-[10px] font-medium">Tareas</span>
                </Link>
                <Link href="/ops/history" className="flex flex-col items-center gap-1 text-slate-400 hover:text-indigo-400 transition-colors">
                    <HistoryIcon className="w-6 h-6" />
                    <span className="text-[10px] font-medium">Historial</span>
                </Link>
                {requiresContextSelection && (
                    <Link href="/ops/select-context" className="flex flex-col items-center gap-1 text-slate-400 hover:text-indigo-400 transition-colors">
                        <Home className="w-6 h-6" />
                        <span className="text-[10px] font-medium">Cambiar</span>
                    </Link>
                )}
            </nav>
        </div>
    )
}
