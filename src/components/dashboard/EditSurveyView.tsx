'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { UserButton } from '@clerk/nextjs'
import { Sparkles, Plus, Trash2, ArrowLeft, Image as ImageIcon, Upload, GripVertical, Check } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { compressImage } from '@/lib/image-compression'
import AlertSettings from '@/components/AlertSettings'
import RecoverySettings from '@/components/RecoverySettings'
import HappyLoader from '@/components/HappyLoader'

type QuestionType = 'EMOJI' | 'TEXT' | 'RATING' | 'SELECT' | 'YES_NO'

interface Question {
    id: string
    text: string
    type: QuestionType
    options?: string[]
    required: boolean
}

interface EditSurveyViewProps {
    surveyId: string
    backLink?: string
}

export default function EditSurveyView({ surveyId, backLink = '/dashboard' }: EditSurveyViewProps) {
    const router = useRouter()
    const [activeTab, setActiveTab] = useState<'edit' | 'alerts' | 'recovery'>('edit')

    // Original State
    const [title, setTitle] = useState('')
    const [description, setDescription] = useState('')
    const [googleMapsUrl, setGoogleMapsUrl] = useState('')
    const [bannerUrl, setBannerUrl] = useState('')
    const [hexColor, setHexColor] = useState('#8b5cf6')
    const [banner, setBanner] = useState<File | null>(null)
    const [bannerPreview, setBannerPreview] = useState<string | null>(null)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isLoading, setIsLoading] = useState(true)
    const [socialConfig, setSocialConfig] = useState({
        enabled: false,
        instagram: '',
        facebook: ''
    })
    const [recoveryConfig, setRecoveryConfig] = useState<any>(null)

    const [questions, setQuestions] = useState<Question[]>([])

    useEffect(() => {
        const fetchSurvey = async () => {
            try {
                const res = await fetch(`/api/surveys/${surveyId}`)
                if (res.ok) {
                    const data = await res.json()
                    setTitle(data.title)
                    setDescription(data.description || '')
                    setBannerUrl(data.bannerUrl || '')
                    setGoogleMapsUrl(data.googleMapsUrl || '')
                    setHexColor(data.hexColor || '#8b5cf6')
                    setBannerPreview(data.bannerUrl)
                    if (data.socialConfig) {
                        setSocialConfig(data.socialConfig)
                    }
                    if (data.recoveryConfig) {
                        setRecoveryConfig(data.recoveryConfig)
                    }

                    // Map questions
                    if (data.questions) {
                        setQuestions(data.questions.map((q: any) => ({
                            id: q.id,
                            text: q.text,
                            type: q.type,
                            options: q.options,
                            required: q.required
                        })))
                    }
                } else {
                    alert('Error al cargar la encuesta')
                    router.push(backLink)
                }
            } catch (error) {
                console.error('Failed to fetch survey', error)
                alert('Error al cargar la encuesta')
            } finally {
                setIsLoading(false)
            }
        }
        fetchSurvey()
    }, [surveyId, router, backLink])

    const handleBannerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0]
            setBanner(file)
            setBannerPreview(URL.createObjectURL(file))
        }
    }

    const addQuestion = () => {
        const newQuestion: Question = {
            id: Date.now().toString(),
            text: '',
            type: 'TEXT',
            required: true
        }
        setQuestions([...questions, newQuestion])
    }

    const updateQuestion = (id: string, field: keyof Question, value: any) => {
        setQuestions(questions.map(q => q.id === id ? { ...q, [field]: value } : q))
    }

    const removeQuestion = (id: string) => {
        setQuestions(questions.filter(q => q.id !== id))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsSubmitting(true)

        try {
            let bannerUrl = bannerPreview // Keep existing URL if no new file
            if (banner) {
                try {
                    bannerUrl = await compressImage(banner)
                } catch (error) {
                    console.error('Compression failed, using original', error)
                    // Fallback
                    bannerUrl = await new Promise((resolve) => {
                        const reader = new FileReader()
                        reader.onloadend = () => resolve(reader.result as string)
                        reader.readAsDataURL(banner)
                    })
                }
            }

            const res = await fetch(`/api/surveys/${surveyId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    title,
                    description,
                    bannerUrl,
                    googleMapsUrl,
                    hexColor,
                    questions,
                    socialConfig: socialConfig.enabled ? socialConfig : null,
                    recoveryConfig
                })
            })

            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}))
                throw new Error(errorData.error || 'Error al actualizar la encuesta')
            }

            router.push(backLink)
            router.refresh()
        } catch (error: any) {
            console.error(error)
            alert(`Error: ${error.message}`)
            setIsSubmitting(false)
        }
    }

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a] text-white">
                <HappyLoader />
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-white selection:bg-violet-500/30 pb-20">
            {/* Header */}
            <header className="border-b border-white/5 bg-black/20 backdrop-blur-xl sticky top-0 z-50">
                <nav className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href={backLink}>
                            <button className="p-2 rounded-lg hover:bg-white/10 transition text-gray-400 hover:text-white">
                                <ArrowLeft className="w-5 h-5" />
                            </button>
                        </Link>
                        <div className="flex items-center gap-2">
                            <Image
                                src="/assets/branding/logo-white.png"
                                alt="Icon"
                                width={20}
                                height={20}
                                className="w-5 h-5 object-contain"
                            />
                            <span className="text-lg font-bold">Editar Encuesta</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <UserButton />
                    </div>
                </nav>
            </header>

            {/* Tab Navigation */}
            <div className="max-w-3xl mx-auto px-6 mt-8 mb-4">
                <div className="flex flex-wrap gap-3 items-center">
                    <button
                        onClick={() => setActiveTab('edit')}
                        className={`px-4 py-2.5 rounded-xl text-sm font-bold transition flex items-center gap-2 ${activeTab === 'edit' ? 'bg-white text-black shadow-lg shadow-white/10' : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'}`}
                    >
                        Editor
                    </button>

                    <button
                        onClick={() => setActiveTab('recovery')}
                        className={`px-4 py-2.5 rounded-xl text-sm font-bold transition flex items-center gap-2 relative overflow-hidden group ${activeTab === 'recovery' ? 'ring-2 ring-white/20' : 'hover:scale-[1.02]'}`}
                    >
                        <div className={`absolute inset-0 bg-gradient-to-r from-orange-500 to-amber-500 transition-opacity ${activeTab === 'recovery' ? 'opacity-100' : 'opacity-80 group-hover:opacity-100'}`}></div>
                        <div className="absolute inset-0 bg-gradient-to-r from-orange-400 to-amber-400 opacity-0 group-hover:opacity-20 animate-pulse"></div>
                        <span className="relative z-10 text-white flex items-center gap-2">
                            Recuperación Inteligente <span className="animate-bounce">🚑</span>
                        </span>
                    </button>

                    <button
                        onClick={() => setActiveTab('alerts')}
                        className={`px-4 py-2.5 rounded-xl text-sm font-bold transition flex items-center gap-2 relative overflow-hidden group ${activeTab === 'alerts' ? 'ring-2 ring-white/20' : 'hover:scale-[1.02]'}`}
                    >
                        <div className={`absolute inset-0 bg-gradient-to-r from-red-600 to-rose-600 transition-opacity ${activeTab === 'alerts' ? 'opacity-100' : 'opacity-80 group-hover:opacity-100'}`}></div>
                        <div className="absolute inset-0 bg-gradient-to-r from-red-500 to-rose-500 opacity-0 group-hover:opacity-20 animate-pulse"></div>
                        <span className="relative z-10 text-white flex items-center gap-2">
                            Alertas de Crisis <span className="animate-pulse">🚨</span>
                        </span>
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <main className="max-w-3xl mx-auto px-6 py-4 space-y-8">
                {activeTab === 'edit' ? (
                    <form onSubmit={handleSubmit} className="space-y-8">

                        {/* Banner Upload Section */}
                        <section className="space-y-4">
                            <div className="flex items-center gap-2 text-violet-400 mb-2">
                                <ImageIcon className="w-5 h-5" />
                                <h2 className="text-lg font-bold">Personalización</h2>
                            </div>

                            <div className="p-6 rounded-2xl bg-white/5 border border-white/5 space-y-4">
                                <label className="block text-sm font-medium text-gray-300">
                                    Banner / Logo del Negocio
                                    <span className="block text-xs text-gray-500 font-normal mt-1">
                                        Esta imagen aparecerá en la parte superior de tu encuesta.
                                    </span>
                                </label>

                                <div className={`relative border-2 border-dashed rounded-xl transition-all duration-200 ${bannerPreview ? 'border-violet-500/50 h-48' : 'border-white/10 hover:border-violet-500/30 h-32'}`}>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleBannerChange}
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                                    />

                                    {bannerPreview ? (
                                        <div className="absolute inset-0 w-full h-full rounded-lg overflow-hidden p-1">
                                            <img src={bannerPreview} alt="Banner preview" className="w-full h-full object-cover rounded-lg" />
                                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity backdrop-blur-sm">
                                                <p className="text-white font-medium flex items-center gap-2">
                                                    <Upload className="w-4 h-4" /> Cambiar imagen
                                                </p>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-500 pointer-events-none">
                                            <Upload className="w-8 h-8 mb-2 opacity-50" />
                                            <p className="text-sm font-medium">Arrastra una imagen o haz clic</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="p-6 rounded-2xl bg-white/5 border border-white/5 space-y-4">
                                <label className="block text-sm font-medium text-gray-300">
                                    Color de la Marca
                                    <span className="block text-xs text-gray-500 font-normal mt-1">
                                        Elige el color principal para botones y acentos.
                                    </span>
                                </label>
                                <div className="flex items-center gap-4">
                                    <input
                                        type="color"
                                        value={hexColor}
                                        onChange={(e) => setHexColor(e.target.value)}
                                        className="w-12 h-12 rounded-lg cursor-pointer bg-transparent border-0 p-0"
                                    />
                                    <div className="flex-1">
                                        <input
                                            type="text"
                                            value={hexColor}
                                            onChange={(e) => setHexColor(e.target.value)}
                                            className="w-full px-4 py-2 rounded-xl bg-black/20 border border-white/10 focus:border-violet-500 focus:outline-none transition text-white font-mono uppercase"
                                            placeholder="#000000"
                                        />
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* Survey Info */}
                        <section className="space-y-4">
                            <h2 className="text-lg font-bold text-gray-200">Información Básica</h2>
                            <div className="p-6 rounded-2xl bg-white/5 border border-white/5 space-y-5">
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                        Título de la Encuesta *
                                    </label>
                                    <input
                                        type="text"
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        placeholder="Ej: Encuesta de Satisfacción"
                                        className="w-full px-4 py-3 rounded-xl bg-black/20 border border-white/10 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500 transition text-white placeholder-gray-600"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                        Mensaje de Bienvenida
                                    </label>
                                    <input
                                        type="text"
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        placeholder="Ej: Queremos conocer tu opinión"
                                        className="w-full px-4 py-3 rounded-xl bg-black/20 border border-white/10 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500 transition text-white placeholder-gray-600"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                        URL de Google Maps (Opcional)
                                        <span className="block text-xs text-gray-500 font-normal mt-1">
                                            Si el cliente califica bien, le pediremos una reseña en Google.
                                        </span>
                                    </label>
                                    <input
                                        type="url"
                                        value={googleMapsUrl}
                                        onChange={(e) => setGoogleMapsUrl(e.target.value)}
                                        placeholder="https://g.page/r/..."
                                        className="w-full px-4 py-3 rounded-xl bg-black/20 border border-white/10 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500 transition text-white placeholder-gray-600"
                                    />
                                </div>
                            </div>

                            {/* Social Media Recommendations */}
                            <div className="p-6 rounded-2xl bg-white/5 border border-white/5 space-y-5">
                                <div className="flex items-center justify-between">
                                    <label className="block text-sm font-medium text-gray-300">
                                        Redes Sociales
                                        <span className="block text-xs text-gray-500 font-normal mt-1">
                                            ¿Mostrar botones para seguirte al finalizar la encuesta?
                                        </span>
                                    </label>
                                    <div className="flex items-center">
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input
                                                type="checkbox"
                                                className="sr-only peer"
                                                checked={socialConfig.enabled}
                                                onChange={(e) => setSocialConfig({ ...socialConfig, enabled: e.target.checked })}
                                            />
                                            <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-violet-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-violet-600"></div>
                                        </label>
                                    </div>
                                </div>

                                {socialConfig.enabled && (
                                    <div className="space-y-4 pt-4 border-t border-white/5 animate-in slide-in-from-top-2 duration-200">
                                        <div>
                                            <label className="block text-xs font-medium text-gray-400 mb-1">
                                                Instagram URL
                                            </label>
                                            <div className="relative">
                                                <input
                                                    type="url"
                                                    value={socialConfig.instagram}
                                                    onChange={(e) => setSocialConfig({ ...socialConfig, instagram: e.target.value })}
                                                    placeholder="https://instagram.com/tu_negocio"
                                                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-black/20 border border-white/10 focus:border-violet-500 focus:outline-none transition text-white text-sm"
                                                />
                                                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                                                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
                                                </div>
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-400 mb-1">
                                                Facebook URL
                                            </label>
                                            <div className="relative">
                                                <input
                                                    type="url"
                                                    value={socialConfig.facebook}
                                                    onChange={(e) => setSocialConfig({ ...socialConfig, facebook: e.target.value })}
                                                    placeholder="https://facebook.com/tu_negocio"
                                                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-black/20 border border-white/10 focus:border-violet-500 focus:outline-none transition text-white text-sm"
                                                />
                                                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                                                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path></svg>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                        </section >

                        {/* Questions Editor */}
                        <section className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h2 className="text-lg font-bold text-gray-200">Preguntas de la Encuesta</h2>
                                <button
                                    type="button"
                                    onClick={addQuestion}
                                    className="px-3 py-1.5 rounded-lg bg-violet-500/10 text-violet-400 text-sm font-medium hover:bg-violet-500/20 transition flex items-center gap-2"
                                >
                                    <Plus className="w-4 h-4" /> Agregar
                                </button>
                            </div>

                            <div className="space-y-4">
                                {questions.map((question, index) => (
                                    <div key={question.id} className="group p-6 rounded-2xl bg-white/5 border border-white/5 hover:border-white/10 transition relative">
                                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600 cursor-grab opacity-0 group-hover:opacity-100 transition">
                                            <GripVertical className="w-5 h-5" />
                                        </div>

                                        <div className="pl-6 space-y-4">
                                            <div className="flex items-start gap-4">
                                                <div className="flex-1">
                                                    <label className="block text-xs font-medium text-gray-500 mb-1 uppercase tracking-wider">
                                                        Pregunta {index + 1}
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={question.text}
                                                        onChange={(e) => updateQuestion(question.id, 'text', e.target.value)}
                                                        className="w-full bg-transparent border-b border-white/10 focus:border-violet-500 focus:outline-none py-2 text-lg font-medium transition placeholder-gray-600"
                                                        placeholder="Escribe la pregunta..."
                                                    />
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => removeQuestion(question.id)}
                                                    className="p-2 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition"
                                                    title="Eliminar pregunta"
                                                >
                                                    <Trash2 className="w-5 h-5" />
                                                </button>
                                            </div>

                                            <div className="flex items-center gap-4">
                                                <div className="w-1/2">
                                                    <label className="block text-xs font-medium text-gray-500 mb-1">Tipo de Respuesta</label>
                                                    <select
                                                        value={question.type}
                                                        onChange={(e) => {
                                                            const newType = e.target.value as QuestionType
                                                            const updates: any = { type: newType }
                                                            if (newType === 'SELECT' && (!question.options || question.options.length === 0)) {
                                                                updates.options = ['Excelente', 'Bueno', 'Regular', 'Malo', 'Muy Malo']
                                                            }
                                                            setQuestions(questions.map(q => q.id === question.id ? { ...q, ...updates } : q))
                                                        }}
                                                        className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-violet-500 transition text-gray-300"
                                                    >
                                                        <option value="TEXT">Texto Libre</option>
                                                        <option value="SELECT">Selección Múltiple</option>
                                                        <option value="YES_NO">Sí / No</option>
                                                        <option value="RATING">Calificación (Estrellas)</option>
                                                        <option value="EMOJI">Emojis (Satisfacción)</option>
                                                    </select>
                                                </div>

                                                <div className="flex items-center pt-5">
                                                    <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-400 hover:text-white transition">
                                                        <input
                                                            type="checkbox"
                                                            checked={question.required}
                                                            onChange={(e) => updateQuestion(question.id, 'required', e.target.checked)}
                                                            className="w-4 h-4 rounded border-white/20 bg-white/5 text-violet-500 focus:ring-violet-500 focus:ring-offset-0"
                                                        />
                                                        Obligatoria
                                                    </label>
                                                </div>
                                            </div>

                                            {/* Multiple Choice Options Editor */}
                                            {question.type === 'SELECT' && (
                                                <div className="space-y-3 pl-1 border-l-2 border-violet-500/20 ml-1 mt-2">
                                                    <label className="block text-xs font-medium text-gray-500">Opciones de Respuesta</label>
                                                    <div className="space-y-2">
                                                        {question.options?.map((option, optIndex) => (
                                                            <div key={optIndex} className="flex items-center gap-2">
                                                                <div className="w-1.5 h-1.5 rounded-full bg-violet-500/50"></div>
                                                                <input
                                                                    type="text"
                                                                    value={option}
                                                                    onChange={(e) => {
                                                                        const newOptions = [...(question.options || [])]
                                                                        newOptions[optIndex] = e.target.value
                                                                        updateQuestion(question.id, 'options', newOptions)
                                                                    }}
                                                                    className="flex-1 bg-black/20 border border-white/5 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-violet-500 transition text-gray-300"
                                                                    placeholder={`Opción ${optIndex + 1}`}
                                                                />
                                                                <button
                                                                    type="button"
                                                                    onClick={() => {
                                                                        const newOptions = question.options?.filter((_, i) => i !== optIndex)
                                                                        updateQuestion(question.id, 'options', newOptions)
                                                                    }}
                                                                    className="p-1.5 rounded-lg text-gray-600 hover:text-red-400 hover:bg-red-500/10 transition"
                                                                >
                                                                    <Trash2 className="w-3.5 h-3.5" />
                                                                </button>
                                                            </div>
                                                        ))}
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            const newOptions = [...(question.options || []), `Opción ${(question.options?.length || 0) + 1}`]
                                                            updateQuestion(question.id, 'options', newOptions)
                                                        }}
                                                        className="text-xs font-medium text-violet-400 hover:text-violet-300 flex items-center gap-1 mt-2"
                                                    >
                                                        <Plus className="w-3 h-3" /> Agregar opción
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <button
                                type="button"
                                onClick={addQuestion}
                                className="w-full py-4 rounded-xl border-2 border-dashed border-white/10 text-gray-500 hover:border-violet-500/50 hover:text-violet-400 hover:bg-violet-500/5 transition flex items-center justify-center gap-2 font-medium"
                            >
                                <Plus className="w-5 h-5" /> Agregar otra pregunta
                            </button>
                        </section >

                        {/* Actions */}
                        < div className="flex items-center justify-end gap-4 pt-4 border-t border-white/5" >
                            <Link href={backLink}>
                                <button
                                    type="button"
                                    className="px-6 py-3 rounded-xl hover:bg-white/5 text-gray-400 hover:text-white transition font-medium"
                                >
                                    Cancelar
                                </button>
                            </Link>
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="px-8 py-3 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold transition shadow-lg shadow-violet-600/20 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden"
                            >
                                {isSubmitting && (
                                    <div className="absolute inset-0 bg-violet-700 flex items-center justify-center">
                                        <div className="flex items-center gap-2">
                                            <Sparkles className="w-5 h-5 animate-spin" />
                                            <span>Guardando...</span>
                                            <Sparkles className="w-4 h-4 animate-pulse" />
                                        </div>
                                    </div>
                                )}
                                <Image
                                    src="/assets/branding/logo-white.png"
                                    alt="Icon"
                                    width={20}
                                    height={20}
                                    className={`w-5 h-5 object-contain ${isSubmitting ? 'opacity-0' : ''}`}
                                />
                                <span className={isSubmitting ? 'opacity-0' : ''}>Guardar Cambios</span>
                            </button>
                        </div >
                    </form>
                ) : activeTab === 'recovery' ? (
                    <RecoverySettings
                        initialConfig={recoveryConfig}
                        onSave={async (config) => {
                            setRecoveryConfig(config)
                            await fetch(`/api/surveys/${surveyId}`, {
                                method: 'PATCH',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ recoveryConfig: config })
                            })
                            alert('Configuración guardada')
                        }}
                    />
                ) : (
                    <AlertSettings surveyId={surveyId} />
                )}
            </main>
        </div>
    )
}
