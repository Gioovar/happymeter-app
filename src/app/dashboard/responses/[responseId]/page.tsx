import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { redirect, notFound } from 'next/navigation'
import { MessageSquare, Phone, Mail, ArrowLeft, Calendar, User, Star } from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import LaserBorder from '@/components/ui/LaserBorder'

export default async function ResponseDetailPage({ params }: { params: Promise<{ responseId: string }> }) {
    const { userId } = await auth()
    if (!userId) redirect('/')

    const { responseId } = await params

    const response = await prisma.response.findUnique({
        where: { id: responseId },
        include: {
            survey: true,
            answers: {
                include: {
                    question: true
                },
                orderBy: {
                    question: {
                        order: 'asc'
                    }
                }
            }
        }
    })

    if (!response) notFound()
    if (response.survey.userId !== userId) redirect('/dashboard')

    const displayName = response.customerName || 'Anónimo'
    const initial = displayName.charAt(0).toUpperCase()
    const avatarColors = ['bg-violet-500', 'bg-fuchsia-500', 'bg-blue-500', 'bg-emerald-500', 'bg-indigo-500']
    const avatarBg = avatarColors[displayName.length % avatarColors.length]

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-white p-6 md:p-12 font-sans selection:bg-violet-500/30">
            <div className="max-w-4xl mx-auto space-y-8">
                <Link href="/dashboard/responses" className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition group">
                    <div className="p-2 rounded-lg bg-white/5 border border-white/5 group-hover:bg-white/10 transition">
                        <ArrowLeft className="w-4 h-4" />
                    </div>
                    <span>Volver a respuestas</span>
                </Link>

                <div className="relative group rounded-3xl bg-[#0F0F0F] border border-white/5 overflow-hidden shadow-2xl">
                    <LaserBorder color="violet" />

                    {/* Header with Glassmorphism & Gradient */}
                    <div className="relative p-8 md:p-10 border-b border-white/5 overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-br from-violet-500/10 via-transparent to-blue-500/5 opacity-50 pointer-events-none" />

                        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
                            <div className="flex items-center gap-6">
                                <div className={`w-20 h-20 rounded-2xl ${avatarBg} flex items-center justify-center text-3xl font-bold text-white shadow-[0_0_30px_rgba(139,92,246,0.3)] ring-4 ring-black/50`}>
                                    {initial}
                                </div>
                                <div>
                                    <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">{displayName}</h1>
                                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-400">
                                        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/5">
                                            <Calendar className="w-3.5 h-3.5" />
                                            {format(new Date(response.createdAt), "d MMM, yyyy • HH:mm", { locale: es })}
                                        </div>
                                        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-yellow-500/10 border border-yellow-500/20 text-yellow-500/90">
                                            <Star className="w-3.5 h-3.5 fill-yellow-500" />
                                            <span className="font-bold">{response.survey.title}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Contact Actions - Modernized */}
                            <div className="flex gap-3 w-full md:w-auto">
                                {response.customerPhone && (
                                    <>
                                        <a
                                            href={`https://wa.me/${response.customerPhone}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex-1 md:flex-none py-3 px-6 rounded-xl bg-[#25D366] hover:bg-[#1daf53] text-black font-bold flex items-center justify-center gap-2 transition-all hover:scale-105 shadow-[0_0_20px_rgba(37,211,102,0.2)]"
                                        >
                                            <MessageSquare className="w-5 h-5 fill-black" />
                                            WhatsApp
                                        </a>
                                        <a
                                            href={`tel:${response.customerPhone}`}
                                            className="flex-1 md:flex-none py-3 px-6 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 text-white font-bold flex items-center justify-center gap-2 transition-all"
                                        >
                                            <Phone className="w-5 h-5" />
                                            Llamar
                                        </a>
                                    </>
                                )}
                                {response.customerEmail && (
                                    <a
                                        href={`mailto:${response.customerEmail}`}
                                        className="flex-1 md:flex-none py-3 px-6 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 text-white font-bold flex items-center justify-center gap-2 transition-all"
                                    >
                                        <Mail className="w-5 h-5" />
                                        Email
                                    </a>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Content / Answers - Card Style */}
                    <div className="p-8 md:p-10 bg-[#0F0F0F] relative">
                        {/* Subtle Background Pattern */}
                        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none opacity-20" />

                        <div className="space-y-6 relative z-10">
                            {response.answers.map((answer, idx) => (
                                <div key={answer.id} className="group p-6 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-violet-500/20 hover:bg-white/[0.04] transition-all duration-300">
                                    <div className="flex flex-col gap-3">
                                        <div className="flex items-start gap-4">
                                            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-white/10 text-xs font-mono text-gray-400 mt-0.5">
                                                {idx + 1}
                                            </span>
                                            <h3 className="text-gray-300 font-medium text-lg leading-relaxed">
                                                {answer.question.text}
                                            </h3>
                                        </div>

                                        <div className="pl-10">
                                            {answer.question.type === 'RATING' ? (
                                                <div className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-yellow-500/5 border border-yellow-500/10">
                                                    {[...Array(5)].map((_, i) => (
                                                        <Star
                                                            key={i}
                                                            className={`w-6 h-6 transition-all duration-300 ${i < parseInt(answer.value) ? 'text-yellow-400 fill-yellow-400 scale-110 drop-shadow-[0_0_8px_rgba(250,204,21,0.5)]' : 'text-gray-700'}`}
                                                        />
                                                    ))}
                                                    <span className="ml-3 text-lg font-bold text-yellow-400">{answer.value}/5</span>
                                                </div>
                                            ) : (
                                                <div className="text-white text-lg leading-relaxed font-light">
                                                    "{answer.value}"
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
