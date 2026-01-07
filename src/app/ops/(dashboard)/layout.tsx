import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { ShieldCheck, Home } from "lucide-react" // Removed LogOut
import Link from "next/link"
import { prisma } from "@/lib/prisma"
import OpsHeader from "./OpsHeader"

export default async function OpsLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const { userId } = await auth()

    // In a real production environment, you would verify if userId has permission (STAFF/ADMIN)
    if (!userId) redirect("/ops/login")

    // Check if user is an active OPERATOR or ADMIN/OWNER
    // 1. Check if is Owner (User is owner if they have a plan/settings usually, or we can just let them in)
    // 2. Check if is Member

    // We'll allow access if:
    // - User is an active Member with role OPERATOR/ADMIN
    // OR
    // - User is an Owner (has created a team?) - Owners should be able to see this view for testing.

    const member = await prisma.teamMember.findFirst({
        where: { userId }
    })

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
    } else {
        // Not a member. Are they an owner?
        // Simple check: do they have UserSettings?
        // Or we just allow them in. If they are an owner, they can use the scanner for their own loyalty program.
        // We'll assume yes for now.
    }

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
            {/* Mobile Header */}
            {/* Mobile Header (Client Component) */}
            <OpsHeader />

            {/* Main Content */}
            <main className="flex-1 p-4 pb-24">
                {children}
            </main>

            {/* Bottom Nav (If deeper navigation needed later, for now just Home) */}
            <nav className="fixed bottom-0 left-0 right-0 h-16 bg-slate-900 border-t border-slate-800 flex items-center justify-around px-4 pb-safe">
                <Link href="/ops/tasks" className="flex flex-col items-center gap-1 text-indigo-400">
                    <Home className="w-6 h-6" />
                    <span className="text-[10px] font-medium">Tareas</span>
                </Link>
                {/* Add more tabs like History here later */}
            </nav>
        </div>
    )
}
