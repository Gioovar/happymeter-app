
import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { MoreHorizontal, Search, Download, ExternalLink, Calendar, CheckCircle2, Circle } from 'lucide-react'
import Image from 'next/image'

export default async function LeadsPage() {
    const { userId } = await auth()
    if (!userId) redirect('/sign-in')

    const affiliate = await prisma.affiliateProfile.findUnique({
        where: { userId }
    })

    if (!affiliate) {
        return <div className="p-8 text-white">Perfil de afiliado no encontrado.</div>
    }

    const leads = await prisma.referral.findMany({
        where: { affiliateId: affiliate.id },
        orderBy: { createdAt: 'desc' }
    })

    return (
        <div className="min-h-screen bg-[#0a0a0a] p-8 space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">Mis Leads</h1>
                    <p className="text-gray-400">Gestiona y da seguimiento a tus usuarios referidos.</p>
                </div>
                <div className="flex gap-3">
                    <button className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg transition border border-white/10">
                        <Download className="w-4 h-4" />
                        Exportar CSV
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-lg transition font-medium shadow-lg shadow-violet-600/20">
                        <Search className="w-4 h-4" />
                        Buscar Lead
                    </button>
                </div>
            </div>

            {/* Stats Cards Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-[#111] p-6 rounded-2xl border border-white/10">
                    <h3 className="text-gray-400 text-sm font-medium mb-1">Total Leads</h3>
                    <div className="text-3xl font-bold text-white">{leads.length}</div>
                </div>
                <div className="bg-[#111] p-6 rounded-2xl border border-white/10">
                    <h3 className="text-gray-400 text-sm font-medium mb-1">Convertidos</h3>
                    <div className="text-3xl font-bold text-green-400">{leads.filter(l => l.status === 'CONVERTED').length}</div>
                </div>
                <div className="bg-[#111] p-6 rounded-2xl border border-white/10">
                    <h3 className="text-gray-400 text-sm font-medium mb-1">Tasa de Conversión</h3>
                    <div className="text-3xl font-bold text-violet-400">
                        {leads.length > 0 ? ((leads.filter(l => l.status === 'CONVERTED').length / leads.length) * 100).toFixed(1) : 0}%
                    </div>
                </div>
            </div>

            {/* Table Section */}
            <div className="bg-[#111] rounded-2xl border border-white/10 overflow-hidden">
                <div className="p-6 border-b border-white/10 flex items-center justify-between">
                    <h2 className="text-lg font-bold text-white">Listado de Registros</h2>
                    <div className="text-sm text-gray-500">
                        Mostrando {leads.length} registros recientes
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-white/5 text-gray-400 text-xs uppercase font-medium">
                            <tr>
                                <th className="px-6 py-4">Usuario</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4">Fecha Registro</th>
                                <th className="px-6 py-4">Contacto</th>
                                <th className="px-6 py-4 text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {leads.map((lead, index) => (
                                <tr key={lead.id} className="hover:bg-white/[0.02] transition">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center text-white font-bold text-sm">
                                                {lead.leadName ? lead.leadName.charAt(0) : 'U'}
                                            </div>
                                            <div>
                                                <div className="font-medium text-white">{lead.leadName || 'Usuario Desconocido'}</div>
                                                <div className="text-xs text-gray-500">{lead.leadEmail || 'Sin correo'}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        {lead.status === 'CONVERTED' ? (
                                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-green-500/10 text-green-400 border border-green-500/20">
                                                <CheckCircle2 className="w-3 h-3" />
                                                Cliente PRO
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-gray-500/10 text-gray-400 border border-gray-500/20">
                                                <Circle className="w-3 h-3" />
                                                Lead Gratis
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2 text-gray-400 text-sm">
                                            <Calendar className="w-4 h-4" />
                                            {new Date(lead.createdAt).toLocaleDateString()}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        {lead.socialLink ? (
                                            <a
                                                href={lead.socialLink}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center gap-2 text-violet-400 hover:text-violet-300 transition text-sm font-medium hover:underline"
                                            >
                                                <ExternalLink className="w-3 h-3" />
                                                Red Social
                                            </a>
                                        ) : (
                                            <span className="text-gray-600 text-sm italic">No provisto</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button className="p-2 hover:bg-white/10 rounded-lg transition text-gray-400 hover:text-white">
                                            <MoreHorizontal className="w-5 h-5" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {leads.length === 0 && (
                    <div className="p-12 text-center text-gray-500">
                        <p>Aún no tienes referidos. ¡Comparte tu enlace!</p>
                    </div>
                )}
            </div>
        </div>
    )
}
