import {
    CalendarDays,
    Users,
    CalendarX,
    CalendarCheck,
    ChevronRight,
    Settings
} from 'lucide-react';
import Link from 'next/link';

export default function ReservationsPage() {
    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-white tracking-tight">Reservaciones</h1>
                <p className="text-gray-400 mt-2">Gestiona tu agenda, capacidad y horarios.</p>
            </div>
            <div className="flex gap-3">
                <Link
                    href="/dashboard/reservations/setup"
                    className="bg-zinc-800 hover:bg-zinc-700 px-4 py-2.5 rounded-xl font-medium text-sm text-white transition-all flex items-center gap-2"
                >
                    Configurar Plano
                </Link>
                <button className="bg-gradient-to-r from-amber-500 to-orange-600 px-6 py-2.5 rounded-xl font-semibold text-sm shadow-lg shadow-orange-900/20 hover:scale-105 transition-all text-white flex items-center gap-2">
                    <CalendarDays className="w-4 h-4" />
                    Nueva Reserva
                </button>
            </div>
        </div>

            {/* Stats */ }
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-[#111] border border-white/10 p-4 rounded-xl flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-orange-500/20 flex items-center justify-center">
                <CalendarCheck className="w-6 h-6 text-orange-500" />
            </div>
            <div>
                <p className="text-xs text-gray-400 uppercase font-bold">Hoy</p>
                <p className="text-2xl font-bold text-white">12</p>
            </div>
        </div>
        <div className="bg-[#111] border border-white/10 p-4 rounded-xl flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center">
                <Users className="w-6 h-6 text-emerald-500" />
            </div>
            <div>
                <p className="text-xs text-gray-400 uppercase font-bold">Personas</p>
                <p className="text-2xl font-bold text-white">48</p>
            </div>
        </div>
        <div className="bg-[#111] border border-white/10 p-4 rounded-xl flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center">
                <CalendarDays className="w-6 h-6 text-blue-500" />
            </div>
            <div>
                <p className="text-xs text-gray-400 uppercase font-bold">Semana</p>
                <p className="text-2xl font-bold text-white">84</p>
            </div>
        </div>
        <div className="bg-[#111] border border-white/10 p-4 rounded-xl flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center">
                <CalendarX className="w-6 h-6 text-red-500" />
            </div>
            <div>
                <p className="text-xs text-gray-400 uppercase font-bold">Canceladas</p>
                <p className="text-2xl font-bold text-white">2</p>
            </div>
        </div>
    </div>

    {/* Agenda View Placeholder */ }
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Upcoming List */}
        <div className="lg:col-span-2 bg-[#111] border border-white/10 rounded-2xl p-6">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-white">Próximas Reservas</h3>
                <button className="text-xs text-orange-400 hover:text-orange-300 font-medium flex items-center">
                    Ver Calendario <ChevronRight className="w-3 h-3 ml-1" />
                </button>
            </div>

            <div className="space-y-3">
                {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5 hover:border-orange-500/30 transition-colors">
                        <div className="flex items-center gap-4">
                            <div className="flex flex-col items-center justify-center w-12 h-12 bg-black rounded-lg border border-white/10">
                                <span className="text-xs text-gray-400 font-bold uppercase">ENE</span>
                                <span className="text-lg font-bold text-white">0{i + 6}</span>
                            </div>
                            <div>
                                <h4 className="text-white font-medium">Juan Pérez</h4>
                                <p className="text-gray-400 text-xs">Mesa 4 • 4 Personas</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <span className="block text-white font-mono font-medium">19:30</span>
                            <span className="text-emerald-400 text-xs font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full">Confirmada</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>

        {/* Capacity / Availability */}
        <div className="bg-[#111] border border-white/10 rounded-2xl p-6">
            <h3 className="text-lg font-bold text-white mb-6">Capacidad Hoy</h3>
            <div className="space-y-6">
                <div>
                    <div className="flex justify-between text-sm mb-2">
                        <span className="text-gray-400">Ocupación Total</span>
                        <span className="text-white font-bold">65%</span>
                    </div>
                    <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                        <div className="h-full w-[65%] bg-gradient-to-r from-orange-500 to-amber-500 rounded-full" />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-6">
                    <div className="p-4 bg-white/5 rounded-xl text-center">
                        <span className="block text-2xl font-bold text-white">12</span>
                        <span className="text-xs text-gray-500 font-medium uppercase">Libres</span>
                    </div>
                    <div className="p-4 bg-white/5 rounded-xl text-center">
                        <span className="block text-2xl font-bold text-white">8</span>
                        <span className="text-xs text-gray-500 font-medium uppercase">Ocupadas</span>
                    </div>
                </div>
            </div>
        </div>
    </div>
        </div >
    );
}
