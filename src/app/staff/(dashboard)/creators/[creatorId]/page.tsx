
import { prisma } from '@/lib/prisma'
import { ArrowLeft, Star, TrendingUp, DollarSign, Wallet, Instagram, Facebook, Youtube, MessageCircle, Phone, Mail, MapPin } from 'lucide-react'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import Image from 'next/image'

export default async function CreatorAdminDetailPage(props: { params: Promise<{ creatorId: string }> }) {
    const params = await props.params
    const creator = await prisma.affiliateProfile.findUnique({
        where: { id: params.creatorId },
        include: {
            commissions: { orderBy: { createdAt: 'desc' }, take: 10 },
            payouts: { orderBy: { createdAt: 'desc' }, take: 10 },
            visits: { include: { place: true }, orderBy: { visitDate: 'desc' }, take: 5 }
        }
    })

    if (!creator) redirect('/staff/creators')

    const totalEarnings = creator.commissions.reduce((acc, curr) => acc + curr.amount, 0)
    const totalPaid = creator.payouts.reduce((acc, curr) => acc + curr.amount, 0)

    return (
        <div className="max-w-7xl mx-auto space-y-8">
            <Link href="/staff/creators" className="flex items-center gap-2 text-gray-400 hover:text-white transition w-fit">
                <ArrowLeft className="w-4 h-4" />
                Volver a Directorio
            </Link>

            {/* Header / Profile Card */}
            <div className="bg-[#111] border border-white/10 rounded-2xl p-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-32 bg-indigo-500/10 blur-3xl rounded-full pointer-events-none" />

                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
                    <div className="flex items-center gap-6">
                        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-3xl font-bold text-white shadow-xl">
                            {creator.code.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-white mb-2">{creator.code}</h1>
                            <div className="flex flex-wrap gap-2 text-sm">
                                <span className="px-3 py-1 bg-white/5 rounded-full text-gray-300">{creator.niche || 'Sin Nicho'}</span>
                                <span className={`px-3 py-1 rounded-full font-bold ${creator.status === 'ACTIVE' ? 'bg-green-500/10 text-green-400' : 'bg-yellow-500/10 text-yellow-400'}`}>
                                    {creator.status}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-3">
                        {creator.whatsapp && (
                            <a href={`https://wa.me/${creator.whatsapp}`} target="_blank" className="p-3 bg-green-500/10 hover:bg-green-500/20 text-green-500 rounded-xl transition">
                                <MessageCircle className="w-6 h-6" />
                            </a>
                        )}
                        {creator.instagram && (
                            <a href={`https://instagram.com/${creator.instagram.replace('@', '')}`} target="_blank" className="p-3 bg-pink-500/10 hover:bg-pink-500/20 text-pink-500 rounded-xl transition">
                                <Instagram className="w-6 h-6" />
                            </a>
                        )}
                        {/* Fallback Contact Buttons */}
                        <button className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl font-bold transition flex items-center gap-2">
                            <Mail className="w-4 h-4" />
                            Contactar
                        </button>
                    </div>
                </div>

                <div className="mt-8 pt-8 border-t border-white/10 grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div>
                        <p className="text-gray-400 text-xs uppercase font-bold tracking-wider mb-1">Calificación</p>
                        <div className="flex items-center gap-2 text-2xl font-bold text-yellow-400">
                            <Star className="w-6 h-6 fill-yellow-400" />
                            {creator.avgRating.toFixed(1)} <span className="text-sm text-gray-500 font-normal">({creator.reviewCount} res.)</span>
                        </div>
                    </div>
                    <div>
                        <p className="text-gray-400 text-xs uppercase font-bold tracking-wider mb-1">Visitas Realizadas</p>
                        <div className="flex items-center gap-2 text-2xl font-bold text-blue-400">
                            <MapPin className="w-6 h-6" />
                            {creator.visits.length}
                        </div>
                    </div>
                    <div>
                        <p className="text-gray-400 text-xs uppercase font-bold tracking-wider mb-1">Ganancias Totales</p>
                        <div className="flex items-center gap-2 text-2xl font-bold text-green-400">
                            <DollarSign className="w-6 h-6" />
                            ${totalEarnings.toLocaleString()} MXN
                        </div>
                    </div>
                    <div>
                        <p className="text-gray-400 text-xs uppercase font-bold tracking-wider mb-1">Pagado</p>
                        <div className="flex items-center gap-2 text-2xl font-bold text-gray-300">
                            <Wallet className="w-6 h-6" />
                            ${totalPaid.toLocaleString()} MXN
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Visit History */}
                <div className="space-y-4">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <MapPin className="w-5 h-5 text-blue-500" />
                        Últimas Visitas
                    </h3>
                    <div className="space-y-3">
                        {creator.visits.length === 0 ? (
                            <div className="p-6 border border-dashed border-white/10 rounded-xl text-center text-gray-500">
                                Sin visitas registradas.
                            </div>
                        ) : (
                            creator.visits.map(visit => (
                                <div key={visit.id} className="bg-[#111] border border-white/5 p-4 rounded-xl flex items-center justify-between">
                                    <div>
                                        <p className="font-bold text-white">{visit.place.name}</p>
                                        <p className="text-xs text-gray-500">{new Date(visit.visitDate).toLocaleDateString()}</p>
                                    </div>
                                    <span className={`px-2 py-1 rounded text-xs font-bold ${visit.status === 'APPROVED' ? 'bg-green-500/10 text-green-500' : 'bg-white/10 text-gray-400'}`}>
                                        {visit.status}
                                    </span>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Financial History */}
                <div className="space-y-4">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <DollarSign className="w-5 h-5 text-green-500" />
                        Últimos Resultados
                    </h3>
                    <div className="space-y-3">
                        {creator.commissions.length === 0 ? (
                            <div className="p-6 border border-dashed border-white/10 rounded-xl text-center text-gray-500">
                                Sin comisiones generadas.
                            </div>
                        ) : (
                            creator.commissions.map(comm => (
                                <div key={comm.id} className="bg-[#111] border border-white/5 p-4 rounded-xl flex items-center justify-between">
                                    <div>
                                        <p className="font-bold text-gray-300">{comm.description}</p>
                                        <p className="text-xs text-gray-500">{new Date(comm.createdAt).toLocaleDateString()}</p>
                                    </div>
                                    <span className="font-bold text-green-400">+${comm.amount.toFixed(2)} MXN</span>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
