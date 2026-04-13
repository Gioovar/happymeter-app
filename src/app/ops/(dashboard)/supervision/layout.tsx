import { redirect } from "next/navigation";
import { getOpsSession } from "@/lib/ops-auth";
import { ShieldAlert } from "lucide-react";
import Link from "next/link";

export default async function SupervisionLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const { isAuthenticated, member } = await getOpsSession();

    if (!isAuthenticated) {
        redirect("/ops/login");
    }

    // Role-Based Access Control (RBAC)
    // Only ADMIN and SUPERVISOR roles are allowed to access supervision features.
    // If there's no member (e.g., Owner testing directly), we allow access.
    const isAllowed = member ? ['ADMIN', 'SUPERVISOR'].includes(member.role) : true;

    if (!isAllowed) {
        return (
            <div className="flex flex-col items-center justify-center h-[70vh] text-center p-6">
                <div className="w-20 h-20 bg-rose-500/10 rounded-full flex items-center justify-center mb-6 border border-rose-500/20">
                    <ShieldAlert className="w-10 h-10 text-rose-500" />
                </div>
                <h1 className="text-2xl font-black text-white tracking-tight mb-2">Acceso Restringido</h1>
                <p className="text-slate-400 mb-8 max-w-sm">
                    Esta sección es exclusiva para supervisores y administradores. No tienes los permisos necesarios para acceder.
                </p>
                <Link
                    href="/ops/tasks"
                    className="px-6 py-3 bg-white/5 border border-white/10 rounded-2xl font-bold text-white hover:bg-white/10 transition-colors"
                >
                    Volver a mis Tareas
                </Link>
            </div>
        );
    }

    return (
        <section className="w-full">
            {children}
        </section>
    );
}
