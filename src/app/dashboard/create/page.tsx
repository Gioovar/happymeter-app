'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { UserButton } from '@clerk/nextjs'
import { Sparkles, Plus, Trash2, ArrowLeft, Image as ImageIcon, Upload, GripVertical, Check, Shield, FileText } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'


type QuestionType = 'EMOJI' | 'TEXT' | 'RATING' | 'SELECT' | 'YES_NO' | 'IMAGE' | 'DATE'

interface Question {
    id: string
    text: string
    type: QuestionType
    options?: string[]
    required: boolean
}

const TEMPLATE_STANDARD: Question[] = [
    { id: '1', text: '¿Cómo calificarías tu experiencia general?', type: 'EMOJI', required: true },
    { id: '2', text: '¿Cómo estuvo el servicio del personal?', type: 'SELECT', options: ['Excelente', 'Bueno', 'Regular', 'Malo', 'Muy Malo'], required: true },
    { id: '3', text: '¿Conoces el nombre de tu mesero?', type: 'YES_NO', required: true },
    { id: '4', text: '¿Qué te pareció la calidad de los alimentos/bebidas?', type: 'SELECT', options: ['Excelente', 'Buena', 'Regular', 'Mala', 'Muy Mala'], required: true },
    { id: '5', text: '¿Cómo calificarías el ambiente/música?', type: 'SELECT', options: ['Excelente', 'Bueno', 'Regular', 'Malo', 'Muy Malo'], required: true },
    { id: '6', text: '¿Qué tan rápido recibiste tu pedido?', type: 'SELECT', options: ['Muy rápido', 'Rápido', 'Normal', 'Lento', 'Muy lento'], required: true },
    { id: '7', text: '¿Recomendarías este lugar a tus amigos?', type: 'SELECT', options: ['Definitivamente sí', 'Probablemente sí', 'No estoy seguro', 'Probablemente no', 'Definitivamente no'], required: true },
    { id: '8', text: '¿Hay algo que podamos mejorar?', type: 'TEXT', required: false },
]

const TEMPLATE_ANONYMOUS: Question[] = [
    { id: '1', text: '¿Qué tipo de reporte deseas realizar?', type: 'SELECT', options: ['Sugerencia de Mejora', 'Reporte de Conducta', 'Incidente de Seguridad', 'Otro'], required: true },
    { id: '2', text: 'Describe la situación detalladamente', type: 'TEXT', required: true },
    { id: '3', text: '¿En qué área o departamento ocurrió?', type: 'TEXT', required: true },
    { id: '4', text: '¿Cuándo sucedió? (Aproximado)', type: 'TEXT', required: false }, // Using TEXT for flexibility as DATE isn't fully supported in all UIs yet
    { id: '5', text: 'Adjuntar Evidencia (Opcional)', type: 'IMAGE', required: false },
]

export default function CreateSurveyPage() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const mode = searchParams.get('mode')

    // Initialize state based on mode
    const isAnonymousMode = mode === 'anonymous'

    const [activeTemplate, setActiveTemplate] = useState<'standard' | 'anonymous'>(isAnonymousMode ? 'anonymous' : 'standard')

    const [title, setTitle] = useState(isAnonymousMode ? 'Buzón de Sugerencias Anónimo' : 'Encuesta de Satisfacción')
    const [description, setDescription] = useState(isAnonymousMode ? 'Tu reporte es 100% confidencial y seguro.' : 'Queremos conocer tu opinión')
    const [googleMapsUrl, setGoogleMapsUrl] = useState('')
    const [hexColor, setHexColor] = useState(isAnonymousMode ? '#64748b' : '#8b5cf6')
    const [banner, setBanner] = useState<File | null>(null)
    const [bannerPreview, setBannerPreview] = useState<string | null>(null)
    const [isSubmitting, setIsSubmitting] = useState(false)

    const [questions, setQuestions] = useState<Question[]>(isAnonymousMode ? TEMPLATE_ANONYMOUS : TEMPLATE_STANDARD)

    const applyTemplate = (type: 'standard' | 'anonymous') => {
        setActiveTemplate(type)
        if (type === 'standard') {
            setTitle('Encuesta de Satisfacción')
            setDescription('Queremos conocer tu opinión')
            setQuestions(TEMPLATE_STANDARD)
        } else {
            setTitle('Buzón de Sugerencias Anónimo')
            setDescription('Tu reporte es 100% confidencial y seguro.')
            setQuestions(TEMPLATE_ANONYMOUS)
            setHexColor('#64748b') // Slate color for serious tone
        }
    }

    const [socialConfig, setSocialConfig] = useState({
        enabled: false,
        instagram: '',
        facebook: ''
    })



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
            let bannerUrl = null
            if (banner) {
                // Convert to Base64
                bannerUrl = await new Promise((resolve) => {
                    const reader = new FileReader()
                    reader.onloadend = () => resolve(reader.result)
                    reader.readAsDataURL(banner)
                })
            }

            const res = await fetch('/api/surveys', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    title,
                    description,
                    googleMapsUrl,
                    hexColor,
                    questions,
                    bannerUrl,
                    socialConfig: socialConfig.enabled ? socialConfig : null
                })
            })

            if (!res.ok) {
                if (res.status === 403) {
                    alert('Has alcanzado el límite de encuestas de tu plan.')
                    setIsSubmitting(false)
                    return
                }

                const errorData = await res.json().catch(() => ({}))
                throw new Error(errorData.error || 'Error al crear la encuesta')
            }

            router.push('/dashboard')
            router.refresh() // Force refresh to show new survey
        } catch (error: any) {
            console.error(error)
            alert(`Error: ${error.message}`)
            setIsSubmitting(false)
        }
    }

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-white selection:bg-violet-500/30 pb-20">
            {/* Header */}
            <header className="border-b border-white/5 bg-black/20 backdrop-blur-xl sticky top-0 z-50">
                <nav className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/dashboard">
                            <button className="p-2 rounded-lg hover:bg-white/10 transition text-gray-400 hover:text-white">
                                <ArrowLeft className="w-5 h-5" />
                            </button>
                        </Link>
                        <div className="flex items-center gap-2">
                            {isAnonymousMode ? (
                                <Shield className="w-5 h-5 text-slate-400" />
                            ) : (
                                <Sparkles className="w-5 h-5 text-violet-500" />
                            )}
                            <span className="text-lg font-bold">
                                {isAnonymousMode ? 'Nuevo Buzón Staff' : 'Nueva Encuesta'}
                            </span>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <UserButton />
                    </div>
                </nav>
            </header>

            {/* Main Content */}
            <main className="max-w-3xl mx-auto px-6 py-10 space-y-8">
                <form onSubmit={handleSubmit} className="space-y-8">

                    {/* Template Selector - Only show if NOT in anonymous mode */}
                    {!isAnonymousMode && (
                        <section className="space-y-4">
                            <h2 className="text-lg font-bold text-gray-200">Elige una Plantilla</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* ... existing buttons ... */}
                                <button
                                    type="button"
                                    onClick={() => applyTemplate('standard')}
                                    className={`p-6 rounded-2xl border text-left transition-all duration-200 flex items-start gap-4 group ${activeTemplate === 'standard'
                                        ? 'bg-violet-600/10 border-violet-500 ring-1 ring-violet-500'
                                        : 'bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/20'
                                        }`}
                                >
                                    <div className={`p-3 rounded-xl ${activeTemplate === 'standard' ? 'bg-violet-500 text-white shadow-lg shadow-violet-500/20' : 'bg-white/10 text-gray-400 group-hover:text-white'}`}>
                                        <FileText className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h3 className={`font-bold mb-1 ${activeTemplate === 'standard' ? 'text-white' : 'text-gray-300'}`}>Estándar de Satisfacción</h3>
                                        <p className="text-sm text-gray-500 leading-relaxed">
                                            Mide el NPS, calidad de alimentos, servicio y ambiente. Ideal para restaurantes y comercios.
                                        </p>
                                    </div>
                                    {activeTemplate === 'standard' && (
                                        <div className="absolute top-4 right-4 text-violet-500">
                                            <Check className="w-5 h-5" />
                                        </div>
                                    )}
                                </button>

                                <button
                                    type="button"
                                    onClick={() => applyTemplate('anonymous')}
                                    className={`relative p-6 rounded-2xl border text-left transition-all duration-200 flex items-start gap-4 group ${activeTemplate === 'anonymous'
                                        ? 'bg-slate-500/10 border-slate-400 ring-1 ring-slate-400'
                                        : 'bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/20'
                                        }`}
                                >
                                    <div className={`p-3 rounded-xl ${activeTemplate === 'anonymous' ? 'bg-slate-500 text-white shadow-lg shadow-slate-500/20' : 'bg-white/10 text-gray-400 group-hover:text-white'}`}>
                                        <Shield className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h3 className={`font-bold mb-1 ${activeTemplate === 'anonymous' ? 'text-white' : 'text-gray-300'}`}>Buzón Anónimo</h3>
                                        <p className="text-sm text-gray-500 leading-relaxed">
                                            Canal seguro para reportes de staff, sugerencias o incidentes. Sin datos de contacto.
                                        </p>
                                    </div>
                                    {activeTemplate === 'anonymous' && (
                                        <div className="absolute top-4 right-4 text-slate-400">
                                            <Check className="w-5 h-5" />
                                        </div>
                                    )}
                                </button>
                            </div>
                        </section>
                    )}

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

                            {activeTemplate === 'standard' && (
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
                            )}
                        </div>

                        {/* Social Media Recommendations */}
                        {activeTemplate === 'standard' && (
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
                        )}
                    </section>


                    {/* Questions Editor */}
                    < section className="space-y-4" >
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
                        <Link href="/dashboard">
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
                                        <span>Creando magia...</span>
                                        <Sparkles className="w-4 h-4 animate-pulse" />
                                    </div>
                                </div>
                            )}
                            <Sparkles className={`w-5 h-5 ${isSubmitting ? 'opacity-0' : ''}`} />
                            <span className={isSubmitting ? 'opacity-0' : ''}>Publicar Encuesta</span>
                        </button>
                    </div >
                </form >
            </main >
        </div >
    )
}
