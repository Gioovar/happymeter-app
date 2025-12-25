import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { redirect, notFound } from 'next/navigation'
import { MessageSquare, Phone, Mail, ArrowLeft, ArrowRight, Star, X } from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import LaserBorder from '@/components/ui/LaserBorder'
import ResponseClientView from '@/components/responses/ResponseClientView' // We'll create this to handle client-side interactions like image lightbox

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

    // Helper to extract data - kept server side for initial render but data passed to client component
    const answers = response.answers

    // We will render a client component that wraps the interactions to keep the file cleaner 
    // and handle the lightbox/hover states exactly like the modal.
    // However, to strictly follow the modal code structure in a page:

    const displayName = response.customerName || 'Cliente Anónimo'
    const initial = displayName.charAt(0).toUpperCase()
    const colorIndex = displayName.length % 3
    const avatarBg = ['bg-violet-500', 'bg-fuchsia-500', 'bg-blue-500'][colorIndex]

    const ratingAnswer = answers.find(a => a.question?.type === 'RATING' || a.question?.type === 'EMOJI')
    const ratingValue = ratingAnswer ? parseInt(ratingAnswer.value) : 0

    const commentAnswer = answers.find(a => a.question?.type === 'TEXT')
    const comment = commentAnswer ? commentAnswer.value : null

    const photoUrl = response.photo
    const phone = response.customerPhone
    const email = response.customerEmail

    // Clean phone for WhatsApp link
    const waLink = phone ? `https://wa.me/${phone.replace(/\D/g, '')}` : '#'


    return (
        <div className="min-h-screen bg-[#0a0a0a] text-white p-4 md:p-8 flex items-center justify-center font-sans tracking-tight">
            {/* Main Container replacing the Modal Content */}
            <div className="w-full max-w-lg mx-auto relative">

                {/* Back Link styled like the modal header actions but appropriate for a page */}
                <div className="absolute top-0 left-0 -mt-12 md:-ml-12 mb-4">
                    <Link href="/dashboard/responses" className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition group py-2">
                        <div className="p-2 rounded-lg bg-white/5 border border-white/5 group-hover:bg-white/10 transition">
                            <ArrowLeft className="w-4 h-4" />
                        </div>
                        <span className="text-sm font-medium">Volver</span>
                    </Link>
                </div>

                <div className="bg-[#0a0a0a] border border-white/10 rounded-[32px] w-full shadow-2xl overflow-hidden relative flex flex-col">
                    <LaserBorder color="violet" />

                    {/* Content */}
                    <div className="p-6 pt-12 flex-1 space-y-8">

                        {/* User Profile - Centered & Prominent */}
                        <div className="flex flex-col items-center text-center relative z-10">
                            <div className={`w-24 h-24 rounded-full flex items-center justify-center text-4xl font-bold mb-4 shadow-2xl ring-4 ring-black ${avatarBg}`}>
                                {initial}
                            </div>
                            <h1 className="text-3xl font-bold text-white mb-1 tracking-tight">{displayName}</h1>
                            <p className="text-gray-500 text-sm font-medium mb-3">
                                {format(new Date(response.createdAt), "d 'de' MMMM 'de' yyyy HH:mm", { locale: es })}
                            </p>

                            {/* Rating Stars */}
                            {ratingAnswer && !isNaN(ratingValue) && (
                                <div className="flex text-yellow-500 scale-125 mt-2">
                                    {[...Array(5)].map((_, i) => (
                                        <Star key={i} className={`w-4 h-4 ${i < ratingValue ? 'fill-current' : 'text-gray-800'}`} />
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Quote Box */}
                        <div className="bg-[#111] rounded-2xl p-8 text-center border border-white/5 shadow-inner relative group isolate">
                            <div className="absolute top-0 left-0 w-full h-full bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl pointer-events-none -z-10" />
                            <p className="text-xl text-gray-200 italic font-medium leading-relaxed">"{comment || 'Sin comentarios'}"</p>
                        </div>

                        {/* Photo Evidence Section */}
                        {photoUrl && (
                            <ResponseClientView photoUrl={photoUrl} />
                        )}

                        {/* Survey Details (Collapsed/Simplified) */}
                        <div className="bg-[#111] rounded-2xl border border-white/5 overflow-hidden">
                            <div className="px-5 py-3 border-b border-white/5 bg-white/[0.02]">
                                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest">RESUMEN DE ENCUESTA</h4>
                            </div>
                            <div className="p-5 space-y-3">
                                {answers.filter(a =>
                                    // Filter out ONLY the answers we already displayed prominently
                                    a.id !== ratingAnswer?.id &&
                                    a.id !== commentAnswer?.id &&
                                    // Filter out image if it matches the main photo?
                                    // In the page we don't hold the 'photoAnswer' reference variable easily reachable here unless we find it again.
                                    a.question?.type !== 'IMAGE' // Safest for page since we show Photo prominently anyway
                                ).map((ans, i) => (
                                    <div key={i} className="flex justify-between items-start gap-4 text-sm group/item">
                                        <span className="text-gray-500 group-hover/item:text-gray-400 transition-colors flex-1">{ans.question?.text || 'Pregunta'}:</span>
                                        <div className="text-right">
                                            {ans.question?.type === 'RATING' || ans.question?.type === 'EMOJI' ? (
                                                <div className="flex text-yellow-500 justify-end">
                                                    {[...Array(5)].map((_, i) => (
                                                        <Star key={i} className={`w-3 h-3 ${i < parseInt(ans.value) ? 'fill-current' : 'text-gray-800'}`} />
                                                    ))}
                                                </div>
                                            ) : (
                                                <span className="text-white font-medium">{ans.value}</span>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Bottom Action Bar */}
                    <div className="p-6 pt-2 shrink-0 grid grid-cols-3 gap-4 relative z-10 bg-[#0a0a0a]">
                        {/* WhatsApp */}
                        <a
                            href={waLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`group relative flex items-center justify-center h-16 rounded-2xl border transition-all duration-300 overflow-hidden ${phone
                                ? 'bg-[#1a3826] border-[#25D366]/20 hover:border-[#25D366]/50 hover:shadow-[0_0_20px_rgba(37,211,102,0.15)]'
                                : 'bg-white/5 border-white/5 opacity-50 cursor-not-allowed'
                                }`}
                        >
                            <div className={`absolute inset-0 bg-[#25D366]/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ${!phone && 'hidden'}`} />
                            <MessageSquare className={`w-7 h-7 relative z-10 ${phone ? 'text-[#25D366] group-hover:scale-110 transition-transform' : 'text-gray-600'}`} />
                        </a>

                        {/* Call */}
                        <a
                            href={phone ? `tel:${phone}` : '#'}
                            className={`group relative flex items-center justify-center h-16 rounded-2xl border transition-all duration-300 overflow-hidden ${phone
                                ? 'bg-[#1a2b4b] border-blue-500/20 hover:border-blue-500/50 hover:shadow-[0_0_20px_rgba(59,130,246,0.15)]'
                                : 'bg-white/5 border-white/5 opacity-50 cursor-not-allowed'
                                }`}
                        >
                            <div className={`absolute inset-0 bg-blue-500/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ${!phone && 'hidden'}`} />
                            <Phone className={`w-7 h-7 relative z-10 ${phone ? 'text-blue-400 group-hover:scale-110 transition-transform' : 'text-gray-600'}`} />
                        </a>

                        {/* Mail */}
                        <a
                            href={email ? `mailto:${email}` : '#'}
                            className={`group relative flex items-center justify-center h-16 rounded-2xl border transition-all duration-300 overflow-hidden ${email
                                ? 'bg-[#2a1a38] border-violet-500/20 hover:border-violet-500/50 hover:shadow-[0_0_20px_rgba(139,92,246,0.15)]'
                                : 'bg-white/5 border-white/5 opacity-50 cursor-not-allowed'
                                }`}
                        >
                            <div className={`absolute inset-0 bg-violet-500/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ${!email && 'hidden'}`} />
                            <Mail className={`w-7 h-7 relative z-10 ${email ? 'text-violet-400 group-hover:scale-110 transition-transform' : 'text-gray-600'}`} />
                        </a>
                    </div>
                </div>
            </div>
        </div>
    )
}
