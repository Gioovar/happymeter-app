
import { Suspense } from 'react'
import { prisma } from '@/lib/prisma'
import { CheckCircle, XCircle, Mail, MapPin, Globe, CreditCard, Calendar, BarChart3, TrendingUp, History, ExternalLink } from 'lucide-react'
import { format } from 'date-fns'
import ImpersonateButton from '@/components/admin/ImpersonateButton'

export const dynamic = 'force-dynamic'

async function getTenantDetails(userId: string) {
    const user = await prisma.userSettings.findUnique({
        where: { userId },
        include: {
            // We might want related surveys if relation existed, but we fetch manually
        }
    })

    if (!user) return null

    // Fetch surveys and responses to calculate detailed stats
    const surveys = await prisma.survey.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        include: {
            responses: {
                include: {
                    answers: {
                        include: { question: true }
                    }
                }
            },
            _count: {
                select: { responses: true }
            }
        }
    })

    const totalResponses = surveys.reduce((acc, s) => acc + s._count.responses, 0)

    // Calculate Data Assets (Unique Emails & Phones)
    const uniqueEmails = new Set<string>()
    const uniquePhones = new Set<string>()

    surveys.forEach(s => {
        s.responses.forEach(r => {
            if (r.customerEmail) uniqueEmails.add(r.customerEmail)

            // Try to find phone in answers
            const phoneAnswer = r.answers.find(a =>
                a.question.text.toLowerCase().includes('whatsapp') ||
                a.question.text.toLowerCase().includes('teléfono') ||
                a.question.text.toLowerCase().includes('celular')
            )
            if (phoneAnswer?.value) uniquePhones.add(phoneAnswer.value)
        })
    })

    return { user, surveys, totalResponses, emailCount: uniqueEmails.size, phoneCount: uniquePhones.size }
}

export default async function TenantDetailPage({ params }: { params: Promise<{ userId: string }> }) {
    const { userId } = await params
    const data = await getTenantDetails(userId)

    if (!data) {
        return <div className="p-12 text-white">Usuario no encontrado</div>
    }

    const { user, surveys, totalResponses, emailCount, phoneCount } = data

    return (
        <div className="space-y-8 max-w-6xl mx-auto">
            {/* ... Header ... */}

            {/* Header / Profile Card */}
            <div className="bg-[#111] border border-white/10 rounded-2xl p-8 flex flex-col md:flex-row gap-8 items-start">
                {/* ... same header content ... */}
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-violet-600 to-blue-600 flex items-center justify-center text-3xl font-bold text-white shadow-xl shadow-violet-900/20">
                    {user.businessName?.charAt(0).toUpperCase() || 'U'}
                </div>
                <div className="flex-1 space-y-4">
                    <div>
                        <h1 className="text-3xl font-bold text-white">{user.businessName || 'Sin Nombre Comercial'}</h1>
                        <p className="text-gray-400 font-mono text-sm mt-1">{user.userId}</p>
                    </div>

                    <div className="flex flex-wrap gap-4">
                        <div className="flex items-center gap-2 text-sm text-gray-400 bg-white/5 px-3 py-1 rounded-full border border-white/10">
                            <Mail className="w-4 h-4" />
                            <span>{user.industry || 'Industria no definida'}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-400 bg-white/5 px-3 py-1 rounded-full border border-white/10">
                            <Calendar className="w-4 h-4" />
                            <span>Registrado {format(user.createdAt, 'dd MMM, yyyy')}</span>
                        </div>
                        <div className={`flex items-center gap-2 text-sm px-3 py-1 rounded-full border font-bold ${user.isOnboarded ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-amber-500/10 border-amber-500/20 text-amber-400'}`}>
                            {user.isOnboarded ? <CheckCircle className="w-4 h-4" /> : <History className="w-4 h-4" />}
                            <span>{user.isOnboarded ? 'Onboarded' : 'Pending Setup'}</span>
                        </div>
                    </div>
                </div>

                {/* Subscription Card */}
                <div className="bg-white/5 border border-white/10 rounded-xl p-6 min-w-[300px]">
                    <div className="flex justify-between items-start mb-4">
                        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                            <CreditCard className="w-4 h-4" /> Suscripción
                        </h3>
                        {/* God Mode Button */}
                        <div className="scale-90 origin-top-right">
                            <ImpersonateButton userId={user.userId} name={user.businessName || 'Tenant'} />
                        </div>
                    </div>

                    <div className="space-y-3">
                        <div className="flex justify-between items-center">
                            <span className="text-gray-400">Plan Actual</span>
                            <span className={`px-2 py-0.5 rounded text-xs font-bold bg-violet-500/20 text-violet-300 border border-violet-500/30`}>
                                {user.plan}
                            </span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-gray-400">Estado</span>
                            <span className={`px-2 py-0.5 rounded text-xs font-bold ${user.subscriptionStatus === 'active' ? 'text-green-400' : 'text-gray-400'}`}>
                                {user.subscriptionStatus?.toUpperCase() || '-'}
                            </span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-gray-400">Renovación</span>
                            <span className="text-white text-sm">
                                {user.subscriptionPeriodEnd ? format(user.subscriptionPeriodEnd, 'dd MMM yyyy') : '-'}
                            </span>
                        </div>
                        {user.stripeCustomerId && (
                            <div className="pt-2 mt-2 border-t border-white/10 text-xs text-gray-500 font-mono text-center">
                                Customer ID: {user.stripeCustomerId}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-[#111] border border-white/10 rounded-xl p-6">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-blue-500/20 rounded-lg">
                            <BarChart3 className="w-5 h-5 text-blue-500" />
                        </div>
                        <span className="text-gray-400 font-medium">Encuestas Totales</span>
                    </div>
                    <p className="text-3xl font-bold text-white">{data.surveys.length}</p>
                </div>
                <div className="bg-[#111] border border-white/10 rounded-xl p-6">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-green-500/20 rounded-lg">
                            <TrendingUp className="w-5 h-5 text-green-500" />
                        </div>
                        <span className="text-gray-400 font-medium">Respuestas Totales</span>
                    </div>
                    <p className="text-3xl font-bold text-white">{totalResponses}</p>
                </div>
                <div className="bg-[#111] border border-white/10 rounded-xl p-6">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-purple-500/20 rounded-lg">
                            <MapPin className="w-5 h-5 text-purple-500" />
                        </div>
                        <span className="text-gray-400 font-medium">Locations</span>
                    </div>
                    <p className="text-3xl font-bold text-white">1</p>
                </div>
            </div>

            {/* Surveys List Table */}
            <div className="bg-[#111] border border-white/10 rounded-xl overflow-hidden">
                <div className="p-6 border-b border-white/10 flex flex-col md:flex-row justify-between items-center gap-4">
                    <h3 className="font-bold text-white">Actividad Reciente (Encuestas)</h3>
                    <div className="flex gap-2">
                        <a
                            href={`/api/admin/users/${data.user.userId}/export?format=whatsapp`}
                            className="flex items-center gap-2 px-3 py-1.5 bg-green-500/10 hover:bg-green-500/20 border border-green-500/20 text-green-400 text-xs font-bold rounded-lg transition"
                            download
                        >
                            <img src="https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg" className="w-4 h-4" alt="WA" />
                            Exportar WhatsApp ({phoneCount})
                        </a>
                        <a
                            href={`/api/admin/users/${data.user.userId}/export?format=meta`}
                            className="flex items-center gap-2 px-3 py-1.5 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 text-blue-400 text-xs font-bold rounded-lg transition"
                            download
                        >
                            <Globe className="w-4 h-4" />
                            Exportar Meta Ads ({emailCount})
                        </a>
                    </div>
                </div>
                <table className="w-full text-left text-sm">
                    <thead className="bg-white/5 text-gray-400 font-medium">
                        <tr>
                            <th className="px-6 py-3">Título</th>
                            <th className="px-6 py-3 text-center">Respuestas</th>
                            <th className="px-6 py-3 text-right">Creada</th>
                            <th className="px-6 py-3 text-right">Acción</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {data.surveys.map((survey) => (
                            <tr key={survey.id} className="hover:bg-white/5 transition-colors group">
                                <td className="px-6 py-4 font-medium text-white">
                                    {survey.title}
                                </td>
                                <td className="px-6 py-4 text-center text-gray-400">
                                    {survey._count.responses}
                                </td>
                                <td className="px-6 py-4 text-right text-gray-500">
                                    {format(survey.createdAt, 'dd MMM yyyy')}
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <a
                                        href={`/s/${survey.id}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1 text-violet-400 hover:text-violet-300 text-xs font-bold"
                                    >
                                        Ver Encuesta <ExternalLink className="w-3 h-3" />
                                    </a>
                                </td>
                            </tr>
                        ))}
                        {data.surveys.length === 0 && (
                            <tr>
                                <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                                    Este usuario no ha creado encuestas aún.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
