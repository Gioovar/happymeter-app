import Link from "next/link"
import { QrCode, History, LogOut, CheckCircle2 } from "lucide-react"

export default function OpsPage() {
    return (
        <div className="flex flex-col gap-6">
            <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-2xl p-6">
                <h2 className="text-xl font-bold text-white mb-2">Panel de Staff</h2>
                <p className="text-indigo-200 text-sm">
                    Bienvenido. Selecciona una acción para comenzar.
                </p>
            </div>

            <div className="grid grid-cols-1 gap-4">
                {/* TASKS BUTTON */}
                <Link href="/ops/tasks" className="group relative overflow-hidden bg-gradient-to-br from-emerald-600 to-teal-600 rounded-3xl p-8 transition-all active:scale-95 shadow-lg shadow-emerald-500/25">
                    <div className="absolute top-0 right-0 p-8 opacity-20 group-hover:scale-110 transition-transform">
                        <QrCode className="w-32 h-32 text-white rotate-12" />
                    </div>

                    <div className="relative z-10 flex flex-col h-full min-h-[160px] justify-between">
                        <div className="bg-white/20 w-12 h-12 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                            <CheckCircle2 className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h3 className="text-2xl font-bold text-white mb-1">Mis Tareas</h3>
                            <p className="text-emerald-100 text-sm font-medium">Ver lista de pendientes y checklist</p>
                        </div>
                    </div>
                </Link>

                {/* BIG SCANNER BUTTON */}
                <Link href="/ops/scanner" className="group relative overflow-hidden bg-gradient-to-br from-indigo-600 to-violet-600 rounded-3xl p-8 transition-all active:scale-95 shadow-lg shadow-indigo-500/25">
                    <div className="absolute top-0 right-0 p-8 opacity-20 group-hover:scale-110 transition-transform">
                        <QrCode className="w-32 h-32 text-white rotate-12" />
                    </div>

                    <div className="relative z-10 flex flex-col h-full min-h-[160px] justify-between">
                        <div className="bg-white/20 w-12 h-12 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                            <QrCode className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h3 className="text-2xl font-bold text-white mb-1">Escanear Cliente</h3>
                            <p className="text-indigo-100 text-sm font-medium">Registrar visitas o canjear premios</p>
                        </div>
                    </div>
                </Link>

                {/* HISTORY BUTTON */}
                <button className="group relative overflow-hidden bg-[#16161e] border border-white/5 rounded-3xl p-6 transition-all active:scale-95 hover:bg-[#1c1c24]">
                    <div className="flex items-center gap-4">
                        <div className="bg-white/5 w-12 h-12 rounded-2xl flex items-center justify-center">
                            <History className="w-6 h-6 text-gray-400 group-hover:text-white transition-colors" />
                        </div>
                        <div className="text-left">
                            <h3 className="text-lg font-bold text-white">Historial de Turno</h3>
                            <p className="text-gray-500 text-sm">Ver últimos movimientos</p>
                        </div>
                    </div>
                </button>
            </div>
        </div>
    )
}
