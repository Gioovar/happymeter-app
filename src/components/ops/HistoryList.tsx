'use client';

import { useState } from 'react';
import { History, Tag, User, Clock, Image as ImageIcon, CheckCircle2, Video, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface HistoryItem {
    id: string;
    type: 'REDEMPTION' | 'TASK';
    title: string;
    subtitle: string;
    date: Date | string;
    image: string | null;
    status: string;
}

export default function HistoryList({ items }: { items: HistoryItem[] }) {
    const [selectedItem, setSelectedItem] = useState<HistoryItem | null>(null);

    return (
        <>
            <div className="space-y-4">
                {items.map((record) => (
                    <div
                        key={record.id}
                        onClick={() => setSelectedItem(record)}
                        className="bg-[#111] border border-white/10 rounded-2xl p-4 flex gap-4 cursor-pointer hover:bg-white/5 transition-colors active:scale-98"
                    >
                        {/* Icon / Image */}
                        <div className="shrink-0">
                            {record.image ? (
                                record.image.endsWith('.webm') || record.image.endsWith('.mp4') ? (
                                    <div className="w-16 h-16 rounded-xl bg-black border border-white/10 flex items-center justify-center">
                                        <Video className="w-8 h-8 text-white/50" />
                                    </div>
                                ) : (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img
                                        src={record.image}
                                        alt="Evidencia"
                                        className="w-16 h-16 rounded-xl object-cover border border-white/10 bg-black"
                                    />
                                )
                            ) : (
                                <div className={`w-16 h-16 rounded-xl flex items-center justify-center border ${record.type === 'TASK' ? 'bg-indigo-500/10 border-indigo-500/20' : 'bg-fuchsia-500/10 border-fuchsia-500/20'}`}>
                                    {record.type === 'TASK' ? <CheckCircle2 className="w-6 h-6 text-indigo-400" /> : <Tag className="w-6 h-6 text-fuchsia-400" />}
                                </div>
                            )}
                        </div>

                        <div className="flex-1 min-w-0 flex flex-col justify-center">
                            <div className="flex items-start justify-between gap-2">
                                <h3 className="font-bold text-white truncate text-sm">{record.title}</h3>
                                <span className="text-[10px] font-mono text-slate-500 shrink-0">
                                    {new Date(record.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>

                            <p className="text-xs text-slate-400 mt-1 truncate">{record.subtitle}</p>

                            {record.type === 'TASK' && (
                                <div className="flex gap-2 mt-2">
                                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${record.status === 'APPROVED' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                                            record.status === 'REJECTED' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                                                'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
                                        }`}>
                                        {record.status === 'APPROVED' ? 'APROBADO' :
                                            record.status === 'REJECTED' ? 'RECHAZADO' : 'EN REVISIÓN'}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* Detail Modal */}
            <Dialog open={!!selectedItem} onOpenChange={(open) => !open && setSelectedItem(null)}>
                <DialogContent className="bg-black/90 border border-white/10 text-white max-w-sm w-[90%] rounded-3xl p-0 overflow-hidden backdrop-blur-xl">
                    {selectedItem && (
                        <div className="flex flex-col max-h-[85vh]">
                            {/* Evidence View */}
                            <div className="bg-black relative aspect-[9/16] w-full shrink-0 max-h-[50vh] flex items-center justify-center overflow-hidden border-b border-white/10">
                                {selectedItem.image ? (
                                    selectedItem.image.endsWith('.webm') || selectedItem.image.endsWith('.mp4') ? (
                                        <video
                                            src={selectedItem.image}
                                            controls
                                            className="w-full h-full object-contain"
                                            autoPlay
                                        />
                                    ) : (
                                        <img
                                            src={selectedItem.image}
                                            alt="Evidencia"
                                            className="w-full h-full object-contain"
                                        />
                                    )
                                ) : (
                                    <div className="text-slate-500 flex flex-col items-center">
                                        <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-2">
                                            {selectedItem.type === 'TASK' ? <CheckCircle2 className="w-8 h-8" /> : <Tag className="w-8 h-8" />}
                                        </div>
                                        <p className="text-sm">Sin evidencia visual</p>
                                    </div>
                                )}

                                <button
                                    onClick={() => setSelectedItem(null)}
                                    className="absolute top-4 right-4 p-2 bg-black/50 backdrop-blur rounded-full text-white/80 hover:bg-white/20 transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Details */}
                            <div className="p-6 space-y-6 overflow-y-auto">
                                <div>
                                    <h2 className="text-xl font-bold leading-tight mb-1">{selectedItem.title}</h2>
                                    <p className="text-indigo-400 font-medium text-sm">{selectedItem.subtitle}</p>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5">
                                        <Clock className="w-5 h-5 text-slate-400" />
                                        <div>
                                            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Hora Registrada</p>
                                            <p className="text-white font-mono">
                                                {format(new Date(selectedItem.date), "PPP p", { locale: es })}
                                            </p>
                                        </div>
                                    </div>

                                    {selectedItem.status && selectedItem.type === 'TASK' && (
                                        <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5">
                                            <CheckCircle2 className="w-5 h-5 text-slate-400" />
                                            <div>
                                                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Estado de Validación</p>
                                                <div className={`mt-1 inline-flex text-xs font-bold px-2 py-0.5 rounded-full border ${selectedItem.status === 'APPROVED' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                                                        selectedItem.status === 'REJECTED' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                                                            'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
                                                    }`}>
                                                    {selectedItem.status === 'APPROVED' ? 'APROBADO' :
                                                        selectedItem.status === 'REJECTED' ? 'RECHAZADO' : 'EN REVISIÓN'}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </>
    );
}
