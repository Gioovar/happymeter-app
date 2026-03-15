import { getAllStaffStats } from '@/actions/supervision';
import { Shield, CheckCircle2, AlertCircle, Clock, ChevronRight, User } from 'lucide-react';
import Link from 'next/link';

import { getActiveBusinessId } from '@/lib/tenant';
import { redirect } from 'next/navigation';

export default async function GlobalSupervisionPage() {
    const effectiveUserId = await getActiveBusinessId();
    if (!effectiveUserId) return redirect('/dashboard');

    const stats = await getAllStaffStats(effectiveUserId);

    return (
        <div className="p-6 md:p-10 space-y-10 max-w-7xl mx-auto">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                        <Shield className="w-5 h-5 text-white" />
                    </div>
                    Supervisión de Tareas
                </h1>
                <p className="text-gray-400 mt-2 text-lg">
                    Monitorea el cumplimiento de tus empleados en tiempo real.
                </p>
            </div>

            {/* Employee Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {stats.length === 0 ? (
                    <div className="col-span-full py-12 text-center border border-dashed border-white/10 rounded-2xl bg-white/5">
                        <User className="w-12 h-12 text-gray-500 mx-auto mb-3" />
                        <h3 className="text-lg font-medium text-white">No hay empleados asignados</h3>
                        <p className="text-gray-400">Asigna zonas a tus empleados para ver su progreso aquí.</p>
                    </div>
                ) : (
                    stats.map(employee => (
                        <Link
                            key={employee.staffId}
                            href={`/dashboard/supervision/${employee.staffId}`}
                            className="group relative bg-[#111] border border-white/10 rounded-2xl p-6 hover:border-blue-500/30 transition-all hover:shadow-2xl hover:shadow-blue-900/10 active:scale-[0.99] overflow-hidden"
                        >
                            {/* Blue Gradient Glow on Hover */}
                            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

                            {/* Modernized Status Indicator Stripe - Using blue/indigo motif instead of harsh red/green */}
                            <div className={`absolute top-0 left-0 bottom-0 w-1.5 transition-all duration-300 ${employee.status === 'BEHIND' ? 'bg-gradient-to-b from-indigo-500 to-rose-500 group-hover:shadow-[0_0_15px_rgba(99,102,241,0.5)]' :
                                employee.status === 'WARNING' ? 'bg-gradient-to-b from-indigo-400 to-amber-500 group-hover:shadow-[0_0_15px_rgba(99,102,241,0.5)]' :
                                    'bg-gradient-to-b from-blue-400 to-indigo-500 group-hover:shadow-[0_0_15px_rgba(59,130,246,0.5)]'
                                }`} />

                            <div className="pl-4">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500/10 to-indigo-500/10 border border-blue-500/20 flex items-center justify-center text-lg font-bold text-blue-400">
                                            {employee.staffName.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-bold text-white group-hover:text-blue-300 transition-colors">
                                                {employee.staffName}
                                            </h3>
                                            <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">
                                                {employee.role === 'OPERATOR' ? 'Operador' : employee.role}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Status Badge */}
                                    <div className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 border ${employee.status === 'BEHIND' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                                        employee.status === 'WARNING' ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' :
                                            'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                        }`}>
                                        {employee.status === 'BEHIND' ? <AlertCircle className="w-3 h-3" /> :
                                            employee.status === 'WARNING' ? <Clock className="w-3 h-3" /> :
                                                <CheckCircle2 className="w-3 h-3" />}
                                        {employee.status === 'BEHIND' ? 'ATRASADO' :
                                            employee.status === 'WARNING' ? 'PENDIENTE' :
                                                'AL DÍA'}
                                    </div>
                                </div>

                                {/* Stats Grid - Modernized with glassmorphism and subtle blue accents */}
                                <div className="grid grid-cols-3 gap-3 mb-6 relative z-10">
                                    <div className="bg-white/[0.03] backdrop-blur-sm rounded-xl p-3 text-center border border-white/5 group-hover:bg-blue-500/5 group-hover:border-blue-500/20 transition-all duration-300 shadow-inner group-hover:-translate-y-1">
                                        <div className="text-2xl font-black text-white group-hover:text-blue-200 transition-colors tracking-tight">{employee.totalTasks}</div>
                                        <div className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">Total</div>
                                    </div>
                                    <div className="bg-white/[0.03] backdrop-blur-sm rounded-xl p-3 text-center border border-white/5 group-hover:bg-indigo-500/10 group-hover:border-indigo-500/30 transition-all duration-300 shadow-inner group-hover:-translate-y-1 delay-75">
                                        <div className="text-2xl font-black text-indigo-400 group-hover:text-indigo-300 transition-colors tracking-tight">{employee.completedTasks}</div>
                                        <div className="text-[10px] text-indigo-500/70 font-bold uppercase tracking-widest mt-1">Hechas</div>
                                    </div>
                                    <div className="bg-white/[0.03] backdrop-blur-sm rounded-xl p-3 text-center border border-white/5 group-hover:bg-violet-500/10 group-hover:border-violet-500/30 transition-all duration-300 shadow-inner group-hover:-translate-y-1 delay-150">
                                        <div className="text-2xl font-black text-violet-400 group-hover:text-violet-300 transition-colors tracking-tight">{employee.pendingTasks}</div>
                                        <div className="text-[10px] text-violet-500/70 font-bold uppercase tracking-widest mt-1">Faltan</div>
                                    </div>
                                </div>

                                {/* Premium Link Footer */}
                                <div className="flex items-center justify-end mt-2">
                                    <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-xs font-bold text-gray-300 group-hover:text-white group-hover:bg-gradient-to-r group-hover:from-blue-600 group-hover:to-indigo-600 group-hover:border-transparent transition-all duration-300 shadow-lg shadow-transparent group-hover:shadow-blue-500/25 group-hover:-translate-x-1">
                                        <span>Ver Detalle</span>
                                        <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
                                    </div>
                                </div>
                            </div>
                        </Link>
                    ))
                )}
            </div>
        </div>
    );
}
