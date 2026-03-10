'use client'

import { useState, useEffect } from 'react'
import { Crown, Heart, Star, Sparkles, TicketPercent, Wallet, CalendarDays, ExternalLink, Info, X, Send } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import { AnimatePresence, motion } from 'framer-motion'
import { toast } from 'sonner'

interface VipData {
    ambassadors: {
        name: string
        phone: string
        visits: number
        totalSpent: number
        daysSinceLastVisit: number
        avgNps: number
        sentimentCategory: string
        tier: string
        rfmScore: number
    }[]
    vips: {
        name: string
        phone: string
        visits: number
        totalSpent: number
        daysSinceLastVisit: number
        avgNps: number
        sentimentCategory: string
        tier: string
        rfmScore: number
    }[]
    totalIdentified: number
}

export default function VipAmbassadorsWidget() {
    const [data, setData] = useState<VipData | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [showInfo, setShowInfo] = useState(false)
    const [selectedCustomer, setSelectedCustomer] = useState<any | null>(null)

    useEffect(() => {
        fetch('/api/ai/vip-radar')
            .then(res => res.json())
            .then(resData => {
                setData(resData)
                setIsLoading(false)
            })
            .catch(err => {
                console.error('Failed to fetch VIP radar:', err)
                setIsLoading(false)
            })
    }, [])

    if (isLoading) {
        return (
            <Card className="bg-[#0F0F0F] border-white/5 h-full animate-pulse">
                <CardHeader>
                    <div className="h-6 w-3/4 bg-white/5 rounded"></div>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <div className="h-16 w-full bg-white/5 rounded-2xl"></div>
                        <div className="h-16 w-full bg-white/5 rounded-2xl"></div>
                    </div>
                </CardContent>
            </Card>
        )
    }

    if (!data || data.totalIdentified === 0) {
        return (
            <Card className="bg-[#0F0F0F] border-white/5 h-full flex flex-col items-center justify-center p-6 text-center">
                <Crown className="w-12 h-12 text-gray-600 mb-4 opacity-50" />
                <p className="text-gray-400 font-medium">Buscando Clientes VIP...</p>
                <p className="text-xs text-gray-500 mt-2 max-w-[200px]">Aún no hay suficientes encuestas con teléfono para perfilar clientes de alto valor.</p>
            </Card>
        )
    }

    return (
        <Card className="bg-[#0F0F0F] border-white/5 h-full flex flex-col relative overflow-hidden group">
            {/* Background Glow */}
            <div className="absolute top-0 left-0 w-64 h-64 bg-amber-500/5 rounded-full blur-[80px] pointer-events-none transition-all duration-700 group-hover:bg-amber-500/10" />

            <CardHeader className="pb-3 relative z-10 flex flex-row items-center justify-between">
                <div>
                    <CardTitle className="text-lg font-bold flex items-center gap-2 text-white">
                        <Crown className="w-5 h-5 text-amber-400" />
                        CRM de Embajadores
                    </CardTitle>
                    <p className="text-xs text-gray-400 mt-1">
                        IA ha identificado <span className="text-amber-400 font-bold">{data.totalIdentified}</span> clientes clave basado en lealtad y NPS.
                    </p>
                </div>
                <button
                    onClick={() => setShowInfo(true)}
                    className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition group/btn relative"
                >
                    <Info className="w-5 h-5 text-indigo-400" />
                    {/* Inline tooltip */}
                    <span className="absolute -top-8 right-0 bg-black text-xs px-2 py-1 rounded opacity-0 group-hover/btn:opacity-100 transition whitespace-nowrap pointer-events-none">
                        ¿Cómo funciona?
                    </span>
                </button>
            </CardHeader>

            <CardContent className="space-y-6 relative z-10 flex-1 flex flex-col overflow-y-auto pr-2 custom-scrollbar">

                {data.ambassadors.length > 0 && (
                    <div className="space-y-3">
                        <h4 className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-amber-400/80">
                            <Sparkles className="w-3.5 h-3.5" /> Nivel: Embajadores (Promotores Constantes)
                        </h4>
                        <div className="space-y-2">
                            {data.ambassadors.map((customer, idx) => (
                                <div
                                    key={idx}
                                    onClick={() => setSelectedCustomer(customer)}
                                    className="bg-gradient-to-r from-amber-500/10 to-transparent border border-amber-500/20 rounded-xl p-3 hover:bg-amber-500/20 transition-colors cursor-pointer group/card"
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <p className="font-bold text-sm text-amber-50">{customer.name}</p>
                                            <p className="text-xs text-amber-200/50">{customer.phone}</p>
                                        </div>
                                        <div className="text-right">
                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-400">
                                                <Heart className="w-3 h-3 fill-amber-400" /> Score: {customer.rfmScore}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4 text-xs mt-3 pt-3 border-t border-amber-500/10">
                                        <div className="flex items-center gap-1.5 text-gray-400">
                                            <Star className="w-3.5 h-3.5 text-green-400" />
                                            <span>NPS: {customer.avgNps}/10</span>
                                        </div>
                                        <div className="flex items-center gap-1.5 text-gray-400">
                                            <CalendarDays className="w-3.5 h-3.5" />
                                            <span>{customer.visits} visitas</span>
                                        </div>
                                    </div>

                                    {/* Action Button */}
                                    <button className="w-full mt-3 py-1.5 rounded-lg bg-amber-500/10 text-amber-400 text-xs font-bold hover:bg-amber-500/20 transition flex items-center justify-center gap-2 opacity-0 group-hover/card:opacity-100">
                                        <TicketPercent className="w-3.5 h-3.5" />
                                        Enviar Recompensa VIP (Próximamente)
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {data.vips.length > 0 && (
                    <div className="space-y-3 pt-2">
                        <h4 className="text-[10px] font-bold uppercase tracking-widest text-blue-400/80">
                            Nivel: VIP (Alta Frecuencia)
                        </h4>
                        <div className="space-y-2">
                            {data.vips.map((customer, idx) => (
                                <div
                                    key={idx}
                                    onClick={() => setSelectedCustomer(customer)}
                                    className="bg-blue-500/5 border border-blue-500/10 rounded-xl p-3 flex justify-between items-center transition-colors hover:bg-blue-500/10 cursor-pointer"
                                >
                                    <div>
                                        <p className="font-bold text-sm text-gray-300">{customer.name}</p>
                                        <p className="text-[10px] text-gray-500 mt-0.5">{customer.visits} visitas • Última hace {customer.daysSinceLastVisit} días</p>
                                    </div>
                                    <div className="text-right flex flex-col items-end">
                                        <div className="flex items-center gap-1" title="NPS Score">
                                            {customer.avgNps >= 8 ? (
                                                <Star className="w-3 h-3 text-green-400" />
                                            ) : (
                                                <Star className="w-3 h-3 text-yellow-500" />
                                            )}
                                            <span className="text-xs font-bold text-gray-400">{customer.avgNps || '-'}</span>
                                        </div>
                                        <span className="text-[9px] text-blue-400/50 uppercase tracking-widest mt-1">Puntos: {customer.rfmScore}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

            </CardContent>

            {/* AI Explanation Modal */}
            <AnimatePresence>
                {showInfo && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
                        onClick={() => setShowInfo(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, y: 10 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.95, y: 10 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-[#111] border border-white/10 rounded-3xl p-6 max-w-lg w-full shadow-2xl overflow-y-auto max-h-[85vh] custom-scrollbar"
                        >
                            <div className="flex justify-between items-start mb-6">
                                <h3 className="text-xl font-bold flex items-center gap-2 text-white">
                                    <Sparkles className="w-6 h-6 text-indigo-400" />
                                    ¿Cómo funciona la IA?
                                </h3>
                                <button onClick={() => setShowInfo(false)} className="p-2 rounded-full hover:bg-white/10 text-gray-400 transition">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="space-y-4 text-sm text-gray-300 leading-relaxed">
                                <p>
                                    El <strong className="text-amber-400">CRM de Embajadores</strong> identifica automáticamente quiénes son tus mejores clientes (los más leales y los que mejor hablan de ti) sin que tengas que buscar manualmente en bases de datos.
                                </p>
                                <p>
                                    Aquí te explico exactamente cómo la IA los clasifica leyendo tus datos. El sistema evalúa a cada cliente usando una fórmula de puntos basada en 4 factores:
                                </p>

                                <ul className="space-y-3 bg-white/5 rounded-xl p-4 border border-white/5">
                                    <li><strong className="text-white">Frecuencia (Visitas):</strong> Otorga 10 puntos por cada vez que el cliente te ha visitado o completado una encuesta.</li>
                                    <li><strong className="text-white">Recencia (Última Visita):</strong> Si el cliente vino hace menos de 30 días, le suma 20 puntos extra. Si vino hace menos de 60, le suma 10.</li>
                                    <li><strong className="text-white">Calificación NPS:</strong> Este es el más importante. Si el cliente te calificó con un 9 o 10 (Promotor), la IA le suma 50 puntos de golpe. Si te calificó con 6 o menos, le resta 30 puntos.</li>
                                    <li><strong className="text-white">Valor Monetario:</strong> Si ha gastado más de $500, le suma 30 puntos adicionales.</li>
                                </ul>

                                <p>Con todos estos puntos sumados, crea su "RFM Score" y los clasifica en dos niveles:</p>

                                <div className="space-y-3 pt-2">
                                    <div className="bg-amber-500/10 border border-amber-500/20 p-3 rounded-xl flex gap-3 items-start">
                                        <Crown className="w-5 h-5 text-amber-500 shrink-0" />
                                        <div>
                                            <p className="font-bold text-amber-400 mb-1">Embajadores</p>
                                            <p className="text-xs text-amber-200/70">Son el nivel más alto. Tienen que haber acumulado más de 100 puntos y su calificación promedio de NPS debe ser de Promotor (9 o 10). Son tus clientes incondicionales.</p>
                                        </div>
                                    </div>
                                    <div className="bg-blue-500/10 border border-blue-500/20 p-3 rounded-xl flex gap-3 items-start">
                                        <Star className="w-5 h-5 text-blue-400 shrink-0 fill-blue-400/20" />
                                        <div>
                                            <p className="font-bold text-blue-400 mb-1">VIPs</p>
                                            <p className="text-xs text-blue-200/70">Clientes de alta interacción. Tienen más de 60 puntos acumulados, o simplemente han ido a tu sucursal 3 veces o más.</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <button onClick={() => setShowInfo(false)} className="w-full py-3 mt-6 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl transition">
                                Entendido
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Customer Details Modal */}
            <AnimatePresence>
                {selectedCustomer && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
                        onClick={() => setSelectedCustomer(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, y: 10 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.95, y: 10 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-[#111] border border-white/10 rounded-3xl p-6 max-w-sm w-full shadow-2xl relative overflow-hidden"
                        >
                            <div className={`absolute top-0 left-0 w-full h-1.5 ${selectedCustomer.tier === 'AMBASSADOR' ? 'bg-amber-500' : 'bg-blue-500'}`}></div>

                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    <h3 className="text-xl font-bold text-white mb-1">{selectedCustomer.name}</h3>
                                    <div className="flex items-center gap-2">
                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest ${selectedCustomer.tier === 'AMBASSADOR' ? 'bg-amber-500/20 text-amber-400' : 'bg-blue-500/20 text-blue-400'}`}>
                                            {selectedCustomer.tier === 'AMBASSADOR' ? '🚀 EMBAJADOR' : '🌟 VIP'}
                                        </span>
                                        <span className="text-xs text-gray-400 flex items-center gap-1">
                                            <Heart className="w-3 h-3 text-red-500 fill-red-500" /> {selectedCustomer.rfmScore} pts
                                        </span>
                                    </div>
                                </div>
                                <button onClick={() => setSelectedCustomer(null)} className="p-2 bg-white/5 rounded-full hover:bg-white/10 text-gray-400 transition">
                                    <X className="w-4 h-4" />
                                </button>
                            </div>

                            <div className="space-y-4 mb-6">
                                <div className="bg-[#0A0A0A] border border-white/5 rounded-2xl p-4 flex flex-col gap-3">
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-gray-500">Teléfono:</span>
                                        <span className="font-mono text-gray-300">{selectedCustomer.phone}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-gray-500">Visitas:</span>
                                        <span className="text-gray-300 font-bold">{selectedCustomer.visits}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-gray-500">Última Visita:</span>
                                        <span className="text-gray-300">Hace {selectedCustomer.daysSinceLastVisit} días</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-gray-500">Promedio NPS:</span>
                                        <div className="flex items-center gap-1">
                                            {selectedCustomer.avgNps >= 8 ? (
                                                <Star className="w-4 h-4 text-green-400 fill-green-400/20" />
                                            ) : (
                                                <Star className="w-4 h-4 text-yellow-500 fill-yellow-500/20" />
                                            )}
                                            <span className="text-gray-300 font-bold">{selectedCustomer.avgNps}/10</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-col gap-2">
                                <button onClick={() => {
                                    toast.success(`Notificación enviada a ${selectedCustomer.name}`);
                                    setSelectedCustomer(null);
                                }} className="w-full py-3 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold rounded-xl transition flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/25">
                                    <Send className="w-4 h-4" />
                                    Enviar Notificación Push
                                </button>
                                <button onClick={() => setSelectedCustomer(null)} className="w-full py-2 bg-transparent text-gray-500 hover:text-white font-medium text-sm transition">
                                    Cerrar Perfil
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

        </Card>
    )
}
