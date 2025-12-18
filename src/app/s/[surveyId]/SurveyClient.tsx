'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, ChevronLeft, Upload, X, Instagram, Facebook, Sparkles } from 'lucide-react'
import Image from 'next/image'


export default function SurveyClient({ surveyId, isOwner }: { surveyId: string, isOwner: boolean }) {

    const [step, setStep] = useState(1)
    const [loading, setLoading] = useState(true)
    const [survey, setSurvey] = useState<any>(null)
    const [formData, setFormData] = useState<Record<string, any>>({
        name: '',
        age: '',
        email: '',
        phone: '',
        source: '',
        sourceOther: ''
    })
    const [uploadedPhoto, setUploadedPhoto] = useState<string | null>(null)
    const [isSubmitting, setIsSubmitting] = useState(false)

    useEffect(() => {
        if (surveyId === 'demo') {
            // Mock data for demo
            setSurvey({
                title: "Demo de Restaurante",
                description: "Así es como verán la encuesta tus clientes.",
                hexColor: "#8b5cf6",
                bannerUrl: null,
                questions: [
                    { id: "q1", text: "¿Qué tal estuvo tu experiencia?", type: "EMOJI", order: 1, required: true },
                    { id: "q2", text: "¿Qué fue lo que más te gustó?", type: "TEXT", order: 2, required: false },
                    { id: "q3", text: "¿Cómo calificarías al mesero?", type: "RATING", order: 3, required: true }
                ]
            })
            setFormData({
                q1: '3',
                name: '', age: '', email: '', phone: '', source: '', sourceOther: ''
            })
            setLoading(false)
            return
        }

        const fetchSurvey = async () => {
            try {
                const res = await fetch(`/api/surveys/${surveyId}`, { cache: 'no-store' })
                if (res.ok) {
                    const data = await res.json()
                    setSurvey(data)
                    const initialData: any = { ...formData }
                    data.questions.forEach((q: any) => {
                        initialData[q.id] = q.type === 'EMOJI' ? '3' : ''
                    })
                    setFormData(initialData)
                }
            } catch (error) {
                console.error('Failed to fetch survey', error)
            } finally {
                setLoading(false)
            }
        }
        fetchSurvey()
    }, [surveyId])

    const handleInputChange = (field: string, value: any) => {
        setFormData({ ...formData, [field]: value })
    }

    const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            const reader = new FileReader()
            reader.onloadend = () => setUploadedPhoto(reader.result as string)
            reader.readAsDataURL(file)
        }
    }

    const handleNext = (e: React.FormEvent) => {
        e.preventDefault()
        setStep(2)
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    const handleBack = () => {
        setStep(1)
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (isSubmitting) return

        if (surveyId === 'demo') {
            setStep(3)
            return
        }

        setIsSubmitting(true)

        try {
            const answers = []
            if (emojiQuestion && formData[emojiQuestion.id]) {
                answers.push({ questionId: emojiQuestion.id, value: formData[emojiQuestion.id] })
            }
            otherQuestions.forEach((q: any) => {
                if (formData[q.id]) {
                    answers.push({ questionId: q.id, value: formData[q.id] })
                }
            })

            const customer = {
                name: formData.name,
                email: formData.email,
                phone: formData.phone ? `52${formData.phone}` : '',
                age: formData.age,
                birthday: formData.customerBirthday ? new Date(formData.customerBirthday) : null // Backend expects Date object or ISO string
            }

            const res = await fetch(`/api/surveys/${surveyId}/submit`, {
                method: 'POST',
                body: JSON.stringify({ answers, customer, photo: uploadedPhoto })
            })

            if (res.ok) {
                setStep(3)
            } else {
                alert('Hubo un error al enviar la encuesta. Por favor intenta de nuevo.')
                setIsSubmitting(false)
            }
        } catch (error) {
            console.error('Submit error:', error)
            alert('Error de conexión.')
            setIsSubmitting(false)
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#0f1516]">
                <div className="text-center space-y-4">
                    <div className="relative">
                        <div className="w-16 h-16 border-4 border-violet-200 border-t-violet-600 rounded-full animate-spin mx-auto"></div>
                        <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-2xl animate-pulse">✨</span>
                        </div>
                    </div>
                    <p className="text-white text-lg font-medium animate-pulse">Cargando encuesta...</p>
                </div>
            </div>
        )
    }

    if (!survey) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#0f1516] p-4">
                <div className="text-center space-y-6 max-w-md">
                    <div className="text-6xl mb-4">🔍</div>
                    <h2 className="text-2xl font-bold text-white">Encuesta no encontrada</h2>
                    <p className="text-gray-400">Esta encuesta no existe o ha sido eliminada.</p>
                    <a href="/dashboard" className="inline-block px-6 py-3 bg-violet-600 hover:bg-violet-500 text-white rounded-xl font-medium transition">
                        Volver al Dashboard
                    </a>
                </div>
            </div>
        )
    }

    const theme = {
        background: '#0f1516',
        inputBg: '#1a2021',
        accent: survey.hexColor || '#dbd2b0',
        text: '#ffffff',
        textSecondary: '#9ca3af'
    }

    const emojiQuestion = survey.questions.find((q: any) => q.type === 'EMOJI')
    const otherQuestions = survey.questions.filter((q: any) => q.type !== 'EMOJI')

    const getBannerColor = () => {
        const rating = formData[emojiQuestion?.id]
        if (rating === '1' || rating === '2') return '#ef4444'
        if (rating === '3') return '#f59e0b'
        return '#22c55e'
    }

    const getBannerTitle = () => {
        const rating = formData[emojiQuestion?.id]
        if (rating === '1') return 'Experiencia mala'
        if (rating === '2') return 'Experiencia regular'
        if (rating === '3') return 'Experiencia regular'
        if (rating === '4') return 'Experiencia buena'
        return 'Experiencia excelente'
    }



    if (step === 3) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4 py-12" style={{ backgroundColor: theme.background, color: theme.text }}>
                <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center space-y-6 max-w-md w-full">
                    <div className="w-24 h-24 rounded-full flex items-center justify-center mx-auto shadow-lg" style={{ backgroundColor: '#22c55e' }}>
                        <Check className="w-12 h-12 text-white" />
                    </div>
                    <h2 className="text-3xl font-bold">¡Gracias por tu opinión!</h2>
                    <p style={{ color: theme.textSecondary }}>Tus comentarios nos ayudan a mejorar.</p>

                    {/* Google Maps Review Request */}
                    {survey.googleMapsUrl && (['4', '5'].includes(formData[emojiQuestion?.id])) && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.5 }}
                            className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4"
                        >
                            <div className="space-y-2">
                                <h3 className="text-xl font-bold text-white">¡Nos alegra que te haya gustado! 🎉</h3>
                                <p className="text-sm text-gray-300">
                                    ¿Podrías regalarnos 5 estrellas en Google? Nos ayudaría muchísimo.
                                </p>
                            </div>
                            <a
                                href={survey.googleMapsUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold transition shadow-lg shadow-blue-600/20"
                            >
                                ⭐ Calificar en Google
                            </a>
                        </motion.div>
                    )}

                    {/* Social Media Follow Request */}
                    {survey.socialConfig?.enabled && (survey.socialConfig.instagram || survey.socialConfig.facebook) && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.7 }}
                            className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4 text-left"
                        >
                            <div className="space-y-1 text-center">
                                <h3 className="text-lg font-bold text-white">¡Síguenos en redes! 📱</h3>
                                <p className="text-sm text-gray-400">
                                    Entérate de nuestras promos exclusivas.
                                </p>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                {survey.socialConfig.instagram && (
                                    <a
                                        href={survey.socialConfig.instagram}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex flex-col items-center justify-center p-3 rounded-xl bg-gradient-to-br from-purple-600 via-pink-600 to-orange-500 hover:opacity-90 transition text-white gap-2"
                                    >
                                        <Instagram className="w-5 h-5" />
                                        <span className="text-xs font-bold">Instagram</span>
                                    </a>
                                )}
                                {survey.socialConfig.facebook && (
                                    <a
                                        href={survey.socialConfig.facebook}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex flex-col items-center justify-center p-3 rounded-xl bg-[#1877F2] hover:bg-[#1864cc] transition text-white gap-2"
                                    >
                                        <Facebook className="w-5 h-5" />
                                        <span className="text-xs font-bold">Facebook</span>
                                    </a>
                                )}
                            </div>
                        </motion.div>
                    )}

                    {/* OWNER ONLY BUTTON */}
                    {isOwner && (
                        <a
                            href="/dashboard"
                            className="block w-full py-3 rounded-xl border border-white/10 hover:bg-white/5 transition text-gray-400 hover:text-white mb-4 mt-4"
                        >
                            🛠️ Volver al Dashboard (Solo tú ves esto)
                        </a>
                    )}

                    <button
                        onClick={() => {
                            setStep(1)
                            const initialData: any = { name: '', age: '', email: '', phone: '', source: '', sourceOther: '' }
                            survey.questions.forEach((q: any) => { initialData[q.id] = q.type === 'EMOJI' ? '3' : '' })
                            setFormData(initialData)
                            setUploadedPhoto(null)
                            window.scrollTo({ top: 0, behavior: 'smooth' })
                        }}
                        className="px-6 py-3 rounded-xl font-medium transition w-full mt-4"
                        style={{ backgroundColor: theme.accent, color: '#000000' }}
                    >
                        Enviar otra respuesta
                    </button>
                </motion.div>
            </div>
        )
    }

    return (
        <div className="min-h-screen flex justify-center p-4 pb-20 font-sans" style={{ backgroundColor: theme.background, color: theme.text }}>
            <div className="w-full max-w-md space-y-6">
                <div className="w-full h-48 rounded-2xl relative overflow-hidden shadow-lg">
                    {survey.bannerUrl ? (
                        <div className="relative w-full h-full">
                            <Image src={survey.bannerUrl} alt="Banner" fill className="object-cover" />
                        </div>
                    ) : (
                        <div className="absolute inset-0 bg-gradient-to-r from-orange-400 to-yellow-400">
                            <div className="absolute inset-0 flex items-center justify-center">
                                <h2 className="text-3xl font-black text-white drop-shadow-md uppercase italic">{survey.title}</h2>
                            </div>
                        </div>
                    )}
                </div>

                <div className="space-y-2 px-1">
                    <h1 className="text-2xl font-bold flex items-center gap-2">{survey.title}</h1>
                    <p className="text-sm" style={{ color: theme.textSecondary }}>{survey.description}</p>
                </div>

                <AnimatePresence mode="wait">
                    {step === 1 ? (
                        <motion.form
                            key="step1"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            onSubmit={handleNext}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && (e.target as HTMLElement).tagName !== 'TEXTAREA') {
                                    e.preventDefault()
                                }
                            }}
                            className="space-y-5"
                        >
                            <div className="space-y-2">
                                <label className="block text-sm font-medium" style={{ color: theme.textSecondary }}>Nombre <span className="text-red-400">*</span></label>
                                <input type="text" value={formData.name} onChange={(e) => handleInputChange('name', e.target.value)} className="w-full rounded-xl px-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-violet-500 transition border border-white/5" style={{ backgroundColor: theme.inputBg, color: theme.text }} required placeholder="Tu nombre" />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="block text-sm font-medium" style={{ color: theme.textSecondary }}>Edad <span className="text-red-400">*</span></label>
                                    <input type="number" value={formData.age} onChange={(e) => handleInputChange('age', e.target.value)} className="w-full rounded-xl px-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-violet-500 transition border border-white/5" style={{ backgroundColor: theme.inputBg, color: theme.text }} required placeholder="Ingresa tu edad" min="1" max="120" />
                                </div>
                                <div className="space-y-2">
                                    <label className="block text-sm font-medium" style={{ color: theme.textSecondary }}>Correo electrónico <span className="text-red-400">*</span></label>
                                    <input type="email" value={formData.email} onChange={(e) => handleInputChange('email', e.target.value)} className="w-full rounded-xl px-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-violet-500 transition border border-white/5" style={{ backgroundColor: theme.inputBg, color: theme.text }} required placeholder="tucorreo@email.com" />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="block text-sm font-medium" style={{ color: theme.textSecondary }}>¿Cómo te enteraste de nosotros? <span className="text-red-400">*</span></label>
                                <div className="relative">
                                    <select value={formData.source} onChange={(e) => handleInputChange('source', e.target.value)} className="w-full rounded-xl px-4 py-3.5 appearance-none focus:outline-none focus:ring-2 focus:ring-violet-500 transition border border-white/5" style={{ backgroundColor: theme.inputBg, color: theme.text }} required>
                                        <option value="">Selecciona una opción</option>
                                        <option value="Facebook">Facebook</option>
                                        <option value="Instagram">Instagram</option>
                                        <option value="Google">Google</option>
                                        <option value="Recomendación">Recomendación</option>
                                        <option value="Otra">Otra</option>
                                    </select>
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: theme.textSecondary }}>▼</div>
                                </div>
                                <AnimatePresence>
                                    {formData.source === 'Otra' && (
                                        <motion.input initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} type="text" value={formData.sourceOther} onChange={(e) => handleInputChange('sourceOther', e.target.value)} placeholder="¿Cuál?" className="w-full rounded-xl px-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-violet-500 transition border border-white/5" style={{ backgroundColor: theme.inputBg, color: theme.text }} required />
                                    )}
                                </AnimatePresence>
                            </div>

                            {emojiQuestion && <QuestionField question={emojiQuestion} value={formData[emojiQuestion.id]} onChange={(value: any) => handleInputChange(emojiQuestion.id, value)} theme={theme} formData={formData} />}

                            <button type="submit" className="w-full font-bold py-4 rounded-xl transition mt-8 shadow-lg hover:opacity-90" style={{ backgroundColor: theme.accent, color: '#000000' }}>Continuar</button>
                        </motion.form>
                    ) : (
                        <motion.form
                            key="step2"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            onSubmit={handleSubmit}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && (e.target as HTMLElement).tagName !== 'TEXTAREA') {
                                    e.preventDefault()
                                }
                            }}
                            className="space-y-5"
                        >
                            {otherQuestions.map((q: any) => <QuestionField key={q.id} question={q} value={formData[q.id]} onChange={(value: any) => handleInputChange(q.id, value)} theme={theme} formData={formData} />)}

                            <div className="space-y-2">
                                <label className="block text-sm font-medium" style={{ color: theme.textSecondary }}>Sube una foto (opcional)</label>
                                {uploadedPhoto ? (
                                    <div className="relative">
                                        <div className="relative w-full h-48 rounded-xl overflow-hidden">
                                            <Image src={uploadedPhoto} alt="Uploaded" fill className="object-cover" />
                                        </div>
                                        <button type="button" onClick={() => setUploadedPhoto(null)} className="absolute top-2 right-2 p-2 bg-red-500 hover:bg-red-600 rounded-full transition">
                                            <X className="w-4 h-4 text-white" />
                                        </button>
                                    </div>
                                ) : (
                                    <label className="w-full h-32 rounded-xl border-2 border-dashed border-white/10 flex flex-col items-center justify-center cursor-pointer hover:border-violet-500/50 transition" style={{ backgroundColor: theme.inputBg }}>
                                        <Upload className="w-8 h-8 mb-2" style={{ color: theme.textSecondary }} />
                                        <span className="text-sm" style={{ color: theme.textSecondary }}>Haz clic para subir una foto</span>
                                        <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
                                    </label>
                                )}
                            </div>

                            <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: getBannerColor() }}>
                                <div className="p-6 space-y-4">
                                    <div className="space-y-1">
                                        <h3 className="text-xl font-bold text-white">{getBannerTitle()}</h3>
                                        <p className="text-white/90 text-sm">Déjanos tu WhatsApp para enviarte tu regalo (no enviamos spam).</p>
                                    </div>
                                    <div className="relative">
                                        <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-2 pointer-events-none select-none text-gray-500 font-medium z-10">
                                            <span>🇲🇽</span>
                                            <span>+52</span>
                                            <div className="h-4 w-px bg-gray-300"></div>
                                        </div>
                                        <input
                                            type="tel"
                                            value={formData.phone}
                                            onChange={(e) => {
                                                const val = e.target.value.replace(/\D/g, '').slice(0, 10)
                                                handleInputChange('phone', val)
                                            }}
                                            className="w-full rounded-xl pl-24 pr-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-white transition border-0 text-gray-800 font-medium placeholder:text-gray-400"
                                            style={{ backgroundColor: '#ffffff' }}
                                            placeholder="55 1234 5678"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button type="button" onClick={handleBack} disabled={isSubmitting} className="px-6 py-4 rounded-xl font-medium transition border flex items-center gap-2 disabled:opacity-50" style={{ borderColor: 'rgba(255,255,255,0.1)', color: theme.text, backgroundColor: 'transparent' }}>
                                    <ChevronLeft className="w-4 h-4" /> Atrás
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="flex-1 font-bold py-4 rounded-xl transition shadow-lg hover:opacity-90 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                    style={{ backgroundColor: theme.accent, color: '#000000' }}
                                >
                                    {isSubmitting ? (
                                        <>
                                            <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                                            Enviando...
                                        </>
                                    ) : 'Enviar Encuesta'}
                                </button>
                            </div>
                        </motion.form>
                    )}
                </AnimatePresence>
            </div>
        </div>
    )
}

function QuestionField({ question, value, onChange, theme, formData }: any) {
    const showConditional = question.text.toLowerCase().includes('mesero') && value === 'Sí'

    return (
        <div className="space-y-3">
            <label className="block text-sm font-medium" style={{ color: theme.textSecondary }}>
                {question.text} {question.required && <span className="text-red-400">*</span>}
            </label>

            {question.type === 'TEXT' && (
                <input type="text" value={value || ''} onChange={(e) => onChange(e.target.value)} className="w-full rounded-xl px-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-violet-500 transition border border-white/5" style={{ backgroundColor: theme.inputBg, color: theme.text }} required={question.required} placeholder="Escribe tu respuesta..." />
            )}

            {question.type === 'SELECT' && (
                <div className="relative">
                    <select value={value || ''} onChange={(e) => onChange(e.target.value)} className="w-full rounded-xl px-4 py-3.5 appearance-none focus:outline-none focus:ring-2 focus:ring-violet-500 transition border border-white/5" style={{ backgroundColor: theme.inputBg, color: theme.text }} required={question.required}>
                        <option value="">Selecciona una opción</option>
                        {question.options?.map((opt: string) => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: theme.textSecondary }}>▼</div>
                </div>
            )}

            {question.type === 'YES_NO' && (
                <>
                    <div className="flex gap-4">
                        {['Sí', 'No'].map((opt) => (
                            <label key={opt} className="flex items-center gap-2 cursor-pointer group">
                                <input
                                    type="radio"
                                    name={question.id}
                                    value={opt}
                                    checked={value?.startsWith(opt)}
                                    onChange={(e) => onChange(e.target.value)}
                                    className="w-5 h-5 accent-violet-500"
                                    required={question.required}
                                />
                                <span className="group-hover:text-white transition">{opt}</span>
                            </label>
                        ))}
                    </div>
                    <AnimatePresence>
                        {question.text.toLowerCase().includes('mesero') && value?.startsWith('Sí') && (
                            <motion.input
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                type="text"
                                placeholder="¿Cuál es su nombre?"
                                value={value.includes(' - ') ? value.split(' - ')[1] : ''}
                                onChange={(e) => onChange(`Sí - ${e.target.value}`)}
                                className="w-full rounded-xl px-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-violet-500 transition border border-white/5 mt-2"
                                style={{ backgroundColor: theme.inputBg, color: theme.text }}
                            />
                        )}
                    </AnimatePresence>
                </>
            )}

            {question.type === 'EMOJI' && (
                <div className="space-y-4">
                    <div className="flex justify-between px-2">
                        {['😡', '☹️', '😐', '🙂', '😍'].map((emoji, index) => (
                            <div key={index} onClick={() => onChange((index + 1).toString())} className={`flex flex-col items-center transition-all duration-300 cursor-pointer ${value === (index + 1).toString() ? 'scale-125 opacity-100' : 'scale-100 opacity-40 grayscale hover:opacity-70 hover:scale-110'}`}>
                                <span className="text-4xl mb-1 filter drop-shadow-lg">{emoji}</span>
                                <span className="text-xs font-medium" style={{ color: theme.textSecondary }}>{index + 1}</span>
                            </div>
                        ))}
                    </div>
                    <div className="relative w-full h-6 px-1">
                        <div className="absolute w-full h-2 top-2 rounded-full bg-gradient-to-r from-red-500 via-yellow-400 to-green-500 shadow-inner"></div>
                        <input type="range" min="1" max="5" step="1" value={value || '3'} onChange={(e) => onChange(e.target.value)} className="absolute w-full h-6 opacity-0 cursor-pointer z-20" />
                        <div className="absolute top-0 w-6 h-6 bg-white border-2 border-gray-200 rounded-full shadow-lg pointer-events-none z-10 transition-all duration-150 ease-out" style={{ left: `calc(${((parseInt(value || '3') - 1) / 4) * 100}% - 10px)` }}></div>
                    </div>
                    <div className="flex justify-between text-xs font-medium px-1">
                        <span className="text-red-400">Muy insatisfecho/a</span>
                        <span className="text-green-400">Muy satisfecho/a</span>
                    </div>
                </div>
            )}
        </div>
    )
}
