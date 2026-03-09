import Link from "next/link";
import { Users, QrCode, Settings, CalendarRange, ShieldX } from "lucide-react";
import { redirect } from "next/navigation";
import { getOpsSession } from "@/lib/ops-auth";

export default async function HostessLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { isAuthenticated, member, requiresContextSelection } = await getOpsSession();

    if (!isAuthenticated) {
        redirect("/ops/login");
    }

    if (requiresContextSelection) {
        redirect("/ops/select-context");
    }

    if (member && !member.isActive) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-black text-white p-8 text-center relative overflow-hidden">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-rose-500/10 blur-[120px] rounded-full" />
                <div className="relative z-10 max-w-md w-full bg-white/5 border border-white/10 backdrop-blur-2xl p-10 rounded-[40px] shadow-2xl">
                    <div className="w-20 h-20 bg-rose-500/20 rounded-3xl flex items-center justify-center mx-auto mb-8 border border-rose-500/30 rotate-12 hover:rotate-0 transition-transform duration-500">
                        <ShieldX className="w-10 h-10 text-rose-500" />
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
        );
    }

    return (
        <div className="flex flex-col h-[100dvh] bg-black text-white">
            {/* Main Content Area */}
            <main className="flex-1 overflow-y-auto pb-20 no-scrollbar">
                {children}
            </main>

            {/* Bottom Mobile Navigation */}
            <nav className="fixed bottom-0 left-0 right-0 bg-[#111111] border-t border-white/10 px-6 py-4 flex justify-between items-center z-50 rounded-t-2xl pb-safe">
                <Link
                    href="/hostess"
                    className="flex flex-col items-center gap-1 text-white/50 hover:text-white transition-colors"
                >
                    <CalendarRange className="w-6 h-6" />
                    <span className="text-[10px] font-medium tracking-wide">Reservas</span>
                </Link>
                <Link
                    href="/hostess/scanner"
                    className="flex flex-col items-center gap-1 -mt-6"
                >
                    <div className="bg-sky-500 rounded-full p-4 shadow-lg shadow-sky-500/20 text-white">
                        <QrCode className="w-8 h-8" />
                    </div>
                    <span className="text-[10px] font-medium tracking-wide text-sky-500 mt-1">Escanear</span>
                </Link>
                <Link
                    href="/hostess/account"
                    className="flex flex-col items-center gap-1 text-white/50 hover:text-white transition-colors"
                >
                    <Settings className="w-6 h-6" />
                    <span className="text-[10px] font-medium tracking-wide">Ajustes</span>
                </Link>
            </nav>
        </div>
    );
}
