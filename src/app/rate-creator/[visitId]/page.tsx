'use client'

import { useState, useEffect } from 'react'
import { getVisitDetailsForReview, submitCreatorReview } from '@/actions/creator-reviews'
import { Star, CheckCircle, MapPin, User, Send } from 'lucide-react'
import { toast } from 'sonner'
import { useParams } from 'next/navigation'
import { cn } from '@/lib/utils'

export default function RateCreatorPage() {
    const params = useParams()
    const visitId = params.visitId as string

    const [visit, setVisit] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [submitted, setSubmitted] = useState(false)
    
    // Form
    const [rating, setRating] = useState(0)
    const [comment, setComment] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)

    useEffect(() => {
        loadData()
    }, [])

    const loadData = async () => {
        try {
            const data = await getVisitDetailsForReview(visitId)
            if (data) {
                if (data.review) {
                    setSubmitted(true)
                }
                setVisit(data)
            }
        } catch (e) {
            console.error(e)
        } finally {
            setLoading(false)
        }
    }

    const handleSubmit = async () => {
        if (rating === 0) {
            toast.error('Por favor selecciona una calificación')
            return
        }
        setIsSubmitting(true)
        try {
            await submitCreatorReview(visitId, rating, comment)
            setSubmitted(true)
            toast.success('¡Gracias por tu opinión!')
        } catch (error) {
            toast.error('Error al enviar reseña')
        } finally {
            setIsSubmitting(false)
        }
    }

    if (loading) return <div className="min-h-screen bg-black flex items-center justify-center text-white">Cargando...</div>

    if (!visit) {
        return (
            <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6 text-center">
                <h1 className="text-2xl font-bold text-white mb-2">Enlace no válido</h1>
                <p className="text-gray-400">Esta solicitud de reseña no existe o ya caducó (debe estar APROBADA).</p>
            </div>
        )
    }

    if (submitted) {
        return (
            <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6 text-center relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-violet-600/10 to-fuchsia-600/10" />
                <div className="relative z-10 max-w-md w-full bg-[#111] border border-white/10 p-8 rounded-2xl animate-in zoom-in-95 duration-500">
                    <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6 text-green-500">
                        <CheckCircle className="w-8 h-8" />
                    </div>
                    <h1 className="text-3xl font-bold text-white mb-2">¡Gracias!</h1>
                    <p className="text-gray-400">Tu calificación ha sido registrada. Esto nos ayuda a mejorar la calidad de nuestros creadores.</p>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4 relative">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-violet-900/20 via-black to-black" />
            
            <div className="relative z-10 w-full max-w-lg bg-[#111] border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
                {/* Header Context */}
                <div className="h-32 bg-white/5 relative">
                    {visit.place.coverImage && (
                        <img src={visit.place.coverImage} className="w-full h-full object-cover opacity-40" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#111] to-transparent" />
                    <div className="absolute bottom-6 left-6 right-6">
                        <p className="text-sm text-fuchsia-400 font-bold uppercase tracking-wider mb-1">Encuesta de Satisfacción</p>
                        <h1 className="text-2xl font-bold text-white leading-none">{visit.place.name}</h1>
                    </div>
                </div>

                <div className="p-8 space-y-8">
                    {/* Creator Context */}
                    <div className="flex items-center gap-4 bg-white/5 p-4 rounded-xl border border-white/5">
                        <div className="w-12 h-12 rounded-full bg-violet-600/20 flex items-center justify-center text-violet-400 shrink-0">
                            <User className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-gray-400 text-xs uppercase font-bold">Experiencia con el Creador</p>
                            <p className="text-white font-medium text-lg">@{visit.creator.instagram || 'Usuario'}</p>
                        </div>
                    </div>

                    {/* Star Rating */}
                    <div className="space-y-4 text-center">
                        <label className="text-gray-300 font-medium">¿Qué tal estuvo la visita?</label>
                        <div className="flex justify-center gap-2">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                    key={star}
                                    onClick={() => setRating(star)}
                                    className="group relative transition-transform hover:scale-110 focus:outline-none"
                                >
                                    <Star 
                                        className={cn(
                                            "w-10 h-10 transition-colors", 
                                            rating >= star ? "fill-yellow-400 text-yellow-400" : "text-gray-600 group-hover:text-yellow-400/50"
                                        )} 
                                    />
                                </button>
                            ))}
                        </div>
                        <p className="text-sm text-gray-500 h-4">
                            {rating === 1 && "Mala experiencia"}
                            {rating === 2 && "Podría mejorar"}
                            {rating === 3 && "Estuvo bien"}
                            {rating === 4 && "Muy buena"}
                            {rating === 5 && "¡Excelente!"}
                        </p>
                    </div>

                    {/* Comments */}
                    <div className="space-y-2">
                        <label className="text-gray-300 text-sm font-medium pl-1">Comentarios adicionales (Opcional)</label>
                        <textarea
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            placeholder="¿Llegó a tiempo? ¿Fue profesional? ¿El contenido quedó bien? Describe tu experiencia..."
                            className="w-full bg-black/50 border border-white/10 rounded-xl p-4 text-white placeholder:text-gray-600 focus:ring-2 focus:ring-violet-500 outline-none resize-none h-32"
                        />
                    </div>

                    {/* Submit */}
                    <button
                        onClick={handleSubmit}
                        disabled={isSubmitting || rating === 0}
                        className="w-full py-4 bg-white text-black font-bold rounded-xl hover:bg-gray-200 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {isSubmitting ? 'Enviando...' : (
                            <>
                                <Send className="w-5 h-5" /> Enviar Calificación
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    )
}
