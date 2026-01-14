import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { getStaffRedemptionHistory } from "@/actions/loyalty"
import { History, Tag, User, Clock, Image as ImageIcon } from "lucide-react"

export default async function OpsHistoryPage() {
    const { userId } = await auth()
    if (!userId) redirect("/ops/login")

    const history = await getStaffRedemptionHistory(userId)

    return (
        <div className="max-w-md mx-auto">
            <div className="mb-6 flex items-center gap-3">
                <div className="bg-indigo-500/10 p-3 rounded-2xl">
                    <History className="w-6 h-6 text-indigo-400" />
                </div>
                <div>
                    <h1 className="text-xl font-bold text-white">Historial de Turno</h1>
                    <p className="text-slate-400 text-sm">Últimos 20 premios entregados</p>
                </div>
            </div>

            {history.length === 0 ? (
                <div className="text-center py-12 bg-white/5 rounded-3xl border border-dashed border-white/10">
                    <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-500">
                        <Tag className="w-8 h-8" />
                    </div>
                    <p className="text-slate-400 font-medium">Sin movimientos recientes</p>
                    <p className="text-slate-600 text-sm mt-1">Los canjes aparecerán aquí</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {history.map((record) => (
                        <div key={record.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex gap-4">
                            {/* Evidence Thumbnail */}
                            <div className="shrink-0">
                                {record.evidenceUrl ? (
                                    /* eslint-disable-next-line @next/next/no-img-element */
                                    <img
                                        src={record.evidenceUrl}
                                        alt="Evidencia"
                                        className="w-16 h-16 rounded-xl object-cover border border-white/10 bg-black"
                                    />
                                ) : (
                                    <div className="w-16 h-16 rounded-xl bg-slate-800 flex items-center justify-center border border-slate-700">
                                        <ImageIcon className="w-6 h-6 text-slate-600" />
                                    </div>
                                )}
                            </div>

                            <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-2">
                                    <h3 className="font-bold text-white truncate">{record.rewardName}</h3>
                                    <span className="text-[10px] font-mono text-slate-500 shrink-0 mt-1">
                                        {new Date(record.redeemedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>

                                <div className="flex items-center gap-1.5 mt-1 text-indigo-300 text-sm">
                                    <User className="w-3.5 h-3.5" />
                                    <span className="truncate">{record.customerName}</span>
                                </div>

                                {record.evidenceUrl && (
                                    <div className="mt-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-green-500/10 text-green-400 text-[10px] font-bold border border-green-500/20">
                                        <ImageIcon className="w-3 h-3" /> EVIDENCIA
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
