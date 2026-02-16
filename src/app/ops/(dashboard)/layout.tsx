import { redirect } from "next/navigation"
import { ShieldCheck, Home, History as HistoryIcon } from "lucide-react" // Removed LogOut
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
                <div className="min-h-screen flex items-center justify-center bg-black text-white p-6 text-center">
                    <div>
                        <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-500/50">
                            <ShieldCheck className="w-8 h-8 text-red-500" />
                        </div>
                        <h1 className="text-xl font-bold mb-2">Acceso Desactivado</h1>
                        <p className="text-gray-400">Tu cuenta de operador ha sido desactivada por el administrador.</p>
                        <Link href="/" className="mt-8 inline-block text-indigo-400 hover:text-white transition-colors">
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
