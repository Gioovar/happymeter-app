import { getAllStaffStats } from '@/actions/supervision';
import { Shield, CheckCircle2, AlertCircle, Clock, ChevronRight, User } from 'lucide-react';
import Link from 'next/link';

export default async function SupervisionPage() {
    const stats = await getAllStaffStats();

    return (
        <div className="p-6 md:p-10 space-y-10 max-w-7xl mx-auto">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                    <Shield className="w-8 h-8 text-violet-500" />
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
                            className="group relative bg-[#111] border border-white/10 rounded-2xl p-6 hover:border-violet-500/30 transition-all hover:shadow-2xl hover:shadow-violet-900/10 active:scale-[0.99]"
                        >
                            {/* Status Indicator Stripe */}
                            <div className={`absolute top-0 left-0 bottom-0 w-1.5 rounded-l-2xl transition-colors ${employee.status === 'BEHIND' ? 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]' :
                                    employee.status === 'WARNING' ? 'bg-yellow-500' :
                                        'bg-emerald-500'
                                }`} />

                            <div className="pl-4">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-lg font-bold text-gray-300">
                                            {employee.staffName.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-bold text-white group-hover:text-violet-300 transition-colors">
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

                                {/* Stats Grid */}
                                <div className="grid grid-cols-3 gap-2 mb-6">
                                    <div className="bg-white/5 rounded-lg p-2 text-center border border-white/5 group-hover:bg-white/10 transition-colors">
                                        <div className="text-2xl font-bold text-white">{employee.totalTasks}</div>
                                        <div className="text-[10px] text-gray-500 uppercase">Total</div>
                                    </div>
                                    <div className="bg-emerald-500/10 rounded-lg p-2 text-center border border-emerald-500/10 group-hover:bg-emerald-500/20 transition-colors">
                                        <div className="text-2xl font-bold text-emerald-400">{employee.completedTasks}</div>
                                        <div className="text-[10px] text-emerald-500/70 uppercase">Hechas</div>
                                    </div>
                                    <div className="bg-red-500/10 rounded-lg p-2 text-center border border-red-500/10 group-hover:bg-red-500/20 transition-colors">
                                        <div className="text-2xl font-bold text-red-400">{employee.pendingTasks}</div>
                                        <div className="text-[10px] text-red-500/70 uppercase">Faltan</div>
                                    </div>
                                </div>

                                {/* Link Footer */}
                                <div className="flex items-center justify-end text-sm text-gray-400 group-hover:text-white transition-colors gap-1">
                                    Ver Detalle <ChevronRight className="w-4 h-4" />
                                </div>
                            </div>
                        </Link>
                    ))
                )}
            </div>
        </div>
    );
}
