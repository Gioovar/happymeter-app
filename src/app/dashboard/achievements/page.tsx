
import { prisma } from '@/lib/prisma'
import { currentUser } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { Trophy, Lock, Star, Award, Medal, Crown, Flame, Zap } from 'lucide-react'

// Milestone definitions
const MILESTONES = [
    { count: 1, title: 'Tu Primer Paso', description: '¡Completaste tu primera encuesta!', icon: Star, color: 'text-yellow-400', bg: 'bg-yellow-400/10 border-yellow-400/20' },
    { count: 10, title: 'Recolector Novato', description: '10 respuestas recibidas.', icon: Zap, color: 'text-blue-400', bg: 'bg-blue-400/10 border-blue-400/20' },
    { count: 50, title: 'Analista en Ascenso', description: '50 opiniones de clientes.', icon: Flame, color: 'text-orange-500', bg: 'bg-orange-500/10 border-orange-500/20' },
    { count: 100, title: 'Centenario de Feedback', description: '¡100 respuestas! Un hito increíble.', icon: Trophy, color: 'text-yellow-500', bg: 'bg-yellow-500/10 border-yellow-500/20' }, // Gold Trophy
    { count: 500, title: 'Maestro de la Opinión', description: 'Media milésima de respuestas.', icon: Award, color: 'text-purple-500', bg: 'bg-purple-500/10 border-purple-500/20' },
    { count: 1000, title: 'Leyenda del Servicio', description: '1000 respuestas. Tu negocio es un referente.', icon: Crown, color: 'text-red-500', bg: 'bg-red-500/10 border-red-500/20' },
]

export default async function AchievementsPage() {
    const user = await currentUser()
    if (!user) return redirect('/sign-in')

    // 1. Get total responses count
    // Since we don't have a direct relation easily available without fetching all surveys, let's aggregate.
    // Efficient way:
    const surveys = await prisma.survey.findMany({
        where: { userId: user.id },
        include: { _count: { select: { responses: true } } }
    })

    const totalResponses = surveys.reduce((acc, survey) => acc + survey._count.responses, 0)

    // Find next milestone
    const nextMilestone = MILESTONES.find(m => m.count > totalResponses)

    return (
        <div className="p-8 max-w-6xl mx-auto space-y-8">
            <header>
                <h1 className="text-2xl font-bold text-white mb-2 flex items-center gap-3">
                    <Trophy className="w-8 h-8 text-yellow-500" />
                    Sala de Trofeos
                </h1>
                <p className="text-gray-400">Celebra el crecimiento de tu negocio a través del feedback de tus clientes.</p>
            </header>

            {/* Progress Card */}
            <div className="bg-[#111] border border-white/10 rounded-2xl p-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-violet-600/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

                <div className="relative z-10 flex flex-col md:flex-row gap-8 items-center justify-between">
                    <div>
                        <h2 className="text-4xl font-black text-white mb-1">{totalResponses}</h2>
                        <p className="text-sm text-gray-400 uppercase tracking-wider font-medium">Respuestas Totales</p>
                    </div>

                    {nextMilestone && (
                        <div className="flex-1 w-full md:max-w-md">
                            <div className="flex justify-between text-xs text-gray-400 mb-2">
                                <span>Progreso al siguiente nivel</span>
                                <span>{totalResponses} / {nextMilestone.count}</span>
                            </div>
                            <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-violet-600 to-fuchsia-600 transition-all duration-1000"
                                    style={{ width: `${Math.min(100, (totalResponses / nextMilestone.count) * 100)}%` }}
                                />
                            </div>
                            <p className="text-xs text-gray-500 mt-2 text-right">
                                Siguiente logro: <span className="text-white font-bold">{nextMilestone.title}</span>
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {MILESTONES.map((milestone) => {
                    const isUnlocked = totalResponses >= milestone.count
                    const Icon = milestone.icon

                    return (
                        <div
                            key={milestone.count}
                            className={`relative p-6 rounded-2xl border transition-all duration-300 group
                                ${isUnlocked
                                    ? `bg-[#111] ${milestone.bg} hover:scale-[1.02] shadow-xl`
                                    : 'bg-black/40 border-white/5 opacity-50 grayscale hover:opacity-70'
                                }
                            `}
                        >
                            <div className="flex items-start justify-between mb-4">
                                <div className={`p-3 rounded-xl ${isUnlocked ? 'bg-white/5' : 'bg-white/5'}`}>
                                    {isUnlocked ? (
                                        <Icon className={`w-8 h-8 ${milestone.color}`} />
                                    ) : (
                                        <Lock className="w-8 h-8 text-gray-600" />
                                    )}
                                </div>
                                {isUnlocked && (
                                    <span className="px-2 py-1 rounded-full bg-green-500/10 text-green-400 text-[10px] font-bold border border-green-500/20">
                                        DESBLOQUEADO
                                    </span>
                                )}
                            </div>

                            <h3 className={`text-lg font-bold mb-1 ${isUnlocked ? 'text-white' : 'text-gray-500'}`}>
                                {milestone.title}
                            </h3>
                            <p className="text-sm text-gray-400 mb-4 h-10">
                                {milestone.description}
                            </p>

                            <div className={`text-xs font-mono font-bold ${isUnlocked ? milestone.color : 'text-gray-600'}`}>
                                {milestone.count} RESPUESTAS
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
