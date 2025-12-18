import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { redirect, notFound } from 'next/navigation'
import { MessageSquare, Phone, Mail, ArrowLeft, Calendar, User, Star } from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

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
        <div className="min-h-screen bg-[#0a0a0a] text-white p-6 md:p-12">
            <div className="max-w-4xl mx-auto">
                <Link href="/dashboard/responses" className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition mb-6">
                    <ArrowLeft className="w-4 h-4" /> Volver a respuestas
                </Link>

                <div className="bg-[#111] border border-white/5 rounded-2xl overflow-hidden">
                    {/* Header with Contact Actions */}
                    <div className="p-8 border-b border-white/5 bg-gradient-to-r from-violet-500/5 to-fuchsia-500/5">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                            <div className="flex items-center gap-4">
                                <div className={`w-16 h-16 rounded-full ${avatarBg} flex items-center justify-center text-2xl font-bold shadow-2xl`}>
                                    {initial}
                                </div>
                                <div>
                                    <h1 className="text-2xl font-bold">{displayName}</h1>
                                    <div className="flex items-center gap-3 text-sm text-gray-400 mt-1">
                                        <span className="flex items-center gap-1">
                                            <Calendar className="w-3 h-3" />
                                            {format(new Date(response.createdAt), "d 'de' MMMM, yyyy 'a las' HH:mm", { locale: es })}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <Star className="w-3 h-3 text-yellow-500" />
                                            {response.survey.title}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Contact Actions */}
                            <div className="flex gap-3 w-full md:w-auto">
                                {response.customerPhone && (
                                    <>
                                        <a
                                            href={`https://wa.me/${response.customerPhone}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex-1 md:flex-none py-3 px-6 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-black font-bold flex items-center justify-center gap-2 transition"
                                        >
                                            <MessageSquare className="w-5 h-5" />
                                            WhatsApp
                                        </a>
                                        <a
                                            href={`tel:${response.customerPhone}`}
                                            className="flex-1 md:flex-none py-3 px-6 rounded-xl bg-white/10 hover:bg-white/20 font-bold flex items-center justify-center gap-2 transition"
                                        >
                                            <Phone className="w-5 h-5" />
                                            Llamar
                                        </a>
                                    </>
                                )}
                                {response.customerEmail && (
                                    <a
                                        href={`mailto:${response.customerEmail}`}
                                        className="flex-1 md:flex-none py-3 px-6 rounded-xl bg-white/10 hover:bg-white/20 font-bold flex items-center justify-center gap-2 transition"
                                    >
                                        <Mail className="w-5 h-5" />
                                        Email
                                    </a>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Content / Answers */}
                    <div className="p-8 space-y-8">
                        {response.answers.map((answer) => (
                            <div key={answer.id} className="pb-6 border-b border-white/5 last:border-0 last:pb-0">
                                <h3 className="text-gray-400 text-sm font-medium mb-3 uppercase tracking-wider">
                                    {answer.question.text}
                                </h3>
                                <div className="text-lg">
                                    {answer.question.type === 'RATING' ? (
                                        <div className="flex gap-1">
                                            {[...Array(5)].map((_, i) => (
                                                <Star
                                                    key={i}
                                                    className={`w-6 h-6 ${i < parseInt(answer.value) ? 'text-yellow-500 fill-yellow-500' : 'text-gray-800'}`}
                                                />
                                            ))}
                                        </div>
                                    ) : (
                                        <p>{answer.value}</p>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}
