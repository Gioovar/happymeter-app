import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CheckCircle2, AlertCircle, Clock } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface StaffStat {
    name: string;
    photo: string | null;
    completed: number;
    missed: number;
    pending: number;
}

export default function StaffLeaderboard({ stats }: { stats: StaffStat[] }) {
    if (!stats || stats.length === 0) return null;

    return (
        <div className="bg-[#111] border border-white/10 rounded-3xl p-6 overflow-hidden">
            <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                <span className="bg-gradient-to-r from-indigo-400 to-purple-400 w-2 h-6 rounded-full" />
                Rendimiento del Equipo
            </h3>

            <div className="space-y-6">
                {stats.map((staff, index) => {
                    const total = staff.completed + staff.missed + staff.pending;
                    const completionRate = total > 0 ? Math.round((staff.completed / total) * 100) : 0;

                    return (
                        <div key={index} className="group">
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-3">
                                    <div className="relative">
                                        <Avatar className="w-10 h-10 border border-white/10">
                                            <AvatarImage src={staff.photo || ""} />
                                            <AvatarFallback className="bg-slate-800 text-xs font-bold text-slate-300">
                                                {staff.name.substring(0, 2).toUpperCase()}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="absolute -bottom-1 -right-1 bg-[#111] rounded-full p-0.5">
                                            <div className="bg-indigo-500/20 text-indigo-300 text-[10px] font-bold px-1.5 rounded-full border border-indigo-500/30">
                                                #{index + 1}
                                            </div>
                                        </div>
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-white">{staff.name}</p>
                                        <p className="text-xs text-slate-500">{total} tareas asignadas</p>
                                    </div>
                                </div>
                                <div className="flex flex-col items-end">
                                    <span className="text-xl font-bold text-white font-mono">{staff.completed}</span>
                                    <span className="text-[10px] text-green-400">Completadas</span>
                                </div>
                            </div>

                            {/* Progres Bar */}
                            <div className="w-full bg-slate-900 rounded-full h-2 mb-2 overflow-hidden flex">
                                <div className="bg-green-500 h-full transition-all duration-500" style={{ width: `${(staff.completed / total) * 100}%` }} />
                                <div className="bg-slate-700 h-full transition-all duration-500" style={{ width: `${(staff.pending / total) * 100}%` }} />
                                <div className="bg-red-500/50 h-full transition-all duration-500" style={{ width: `${(staff.missed / total) * 100}%` }} />
                            </div>

                            {/* Legend / Stats */}
                            <div className="flex justify-between text-[10px] text-slate-500 px-1 opacity-60 group-hover:opacity-100 transition-opacity">
                                <span className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3 text-green-500" /> {Math.round((staff.completed / total) * 100)}% Cumplimiento</span>
                                {(staff.missed > 0 || staff.pending > 0) && (
                                    <div className="flex gap-3">
                                        {staff.pending > 0 && <span className="flex items-center gap-1"><Clock className="w-3 h-3 text-slate-400" /> {staff.pending}</span>}
                                        {staff.missed > 0 && <span className="flex items-center gap-1"><AlertCircle className="w-3 h-3 text-red-400" /> {staff.missed}</span>}
                                    </div>
                                )}
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
