'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { UploadCloud, Check, Building2, Globe, Heart, MessageCircle } from 'lucide-react'
import BrandLogo from '@/components/BrandLogo'
import { toast } from 'sonner'
import { completeOnboarding } from '@/actions/onboarding'
import { upload } from '@vercel/blob/client'

export default function OnboardingPage() {
    const router = useRouter()
    const [step, setStep] = useState(1)
    const [isLoading, setIsLoading] = useState(false)
    const [uploading, setUploading] = useState(false)
    const [formData, setFormData] = useState({
        businessName: '',
        whatsappContact: '',
        googleReviewUrl: '',
        instagram: '',
        facebook: '',
        industry: 'restaurant',
        logoUrl: '',
        bannerUrl: ''
    })

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'logo' | 'banner') => {
        if (!e.target.files?.[0]) return

        const file = e.target.files[0]
        setUploading(true)

        try {
            const newBlob = await upload(file.name, file, {
                access: 'public',
                handleUploadUrl: '/api/upload',
            })

            setFormData(prev => ({
                ...prev,
                [type === 'logo' ? 'logoUrl' : 'bannerUrl']: newBlob.url
            }))
            toast.success(`${type === 'logo' ? 'Logo' : 'Banner'} subido correctamente`)
        } catch (err) {
            console.error(err)
            toast.error('Error al subir imagen')
        } finally {
            setUploading(false)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)

        try {
            const data = new FormData()
            Object.entries(formData).forEach(([key, value]) => {
                data.append(key, value)
            })


            await completeOnboarding(data)
            toast.success('¡Negocio configurado correctamente!')
            router.push('/dashboard')
        } catch (error) {
            toast.error('Error al guardar la información. Inténtalo de nuevo.')
            console.error(error)
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col md:flex-row">
            {/* Sidebar / Info Panel */}
            <div className="md:w-1/3 bg-[#111] p-8 md:p-12 flex flex-col justify-between border-r border-white/5">
                <div>
                    <BrandLogo />
                    <div className="mt-12 space-y-6">
                        <div className="flex items-start gap-4">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center border ${step >= 1 ? 'bg-violet-600 border-violet-600' : 'border-white/20 text-gray-500'}`}>
                                1
                            </div>
                            <div>
                                <h3 className="font-bold text-lg">Información del Negocio</h3>
                                <p className="text-gray-400 text-sm">Nombre y Categoría</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-4">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center border ${step >= 2 ? 'bg-violet-600 border-violet-600' : 'border-white/20 text-gray-500'}`}>
                                2
                            </div>
                            <div>
                                <h3 className="font-bold text-lg">Identidad Visual</h3>
                                <p className="text-gray-400 text-sm">Logo y Portada</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-4">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center border ${step >= 3 ? 'bg-violet-600 border-violet-600' : 'border-white/20 text-gray-500'}`}>
                                3
                            </div>
                            <div>
                                <h3 className="font-bold text-lg">Conectividad</h3>
                                <p className="text-gray-400 text-sm">Redes y WhatsApp</p>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="mt-12">
                    <p className="text-xs text-gray-500">
                        Configuración obligatoria para activar tu cuenta.
                    </p>
                </div>
            </div>

            {/* Form Area */}
            <div className="flex-1 p-8 md:p-12 flex items-center justify-center">
                <div className="max-w-xl w-full">

                    <form onSubmit={handleSubmit} className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {step === 1 && (
                            <div className="space-y-6">
                                <div>
                                    <h1 className="text-3xl font-bold mb-2">Comencemos con tu negocio</h1>
                                    <p className="text-gray-400">¿Cómo se llama tu empresa?</p>
                                </div>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-1">Nombre del Negocio</label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.businessName}
                                            onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                                            className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl p-4 text-white focus:border-violet-500 transition-colors outline-none"
                                            placeholder="Ej. Restaurante La Plaza"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-1">Industria</label>
                                        <select
                                            value={formData.industry}
                                            onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                                            className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl p-4 text-white focus:border-violet-500 transition-colors outline-none appearance-none"
                                        >
                                            <option value="restaurant">Restaurante / Bar</option>
                                            <option value="retail">Comercio / Retail</option>
                                            <option value="services">Servicios</option>
                                            <option value="hotel">Hotelería</option>
                                            <option value="other">Otro</option>
                                        </select>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setStep(2)}
                                    disabled={!formData.businessName}
                                    className="w-full bg-white text-black font-bold py-4 rounded-xl hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Continuar
                                </button>
                            </div>
                        )}

                        {step === 2 && (
                            <div className="space-y-6">
                                <div>
                                    <h1 className="text-3xl font-bold mb-2">Identidad Visual</h1>
                                    <p className="text-gray-400">Sube el logo y banner que verán tus clientes.</p>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    {/* Logo Upload Placeholder */}
                                    <div className="relative border-2 border-dashed border-white/10 rounded-2xl p-6 flex flex-col items-center justify-center text-center hover:border-violet-500/50 transition-colors cursor-pointer bg-[#1a1a1a] group overflow-hidden">
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={(e) => handleFileUpload(e, 'logo')}
                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                            disabled={uploading}
                                        />
                                        {formData.logoUrl ? (
                                            <img src={formData.logoUrl} alt="Logo" className="w-full h-32 object-contain mb-2 rounded-lg" />
                                        ) : (
                                            <>
                                                <div className="w-12 h-12 bg-violet-500/10 rounded-full flex items-center justify-center mb-3 group-hover:bg-violet-500/20 transition-colors">
                                                    <UploadCloud className="w-6 h-6 text-violet-400" />
                                                </div>
                                                <p className="text-sm font-bold">{uploading ? 'Subiendo...' : 'Subir Logo'}</p>
                                                <p className="text-xs text-gray-500 mt-1">Recomendado: 500x500px</p>
                                            </>
                                        )}
                                    </div>

                                    {/* Banner Upload Placeholder */}
                                    <div className="relative border-2 border-dashed border-white/10 rounded-2xl p-6 flex flex-col items-center justify-center text-center hover:border-violet-500/50 transition-colors cursor-pointer bg-[#1a1a1a] group overflow-hidden">
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={(e) => handleFileUpload(e, 'banner')}
                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                            disabled={uploading}
                                        />
                                        {formData.bannerUrl ? (
                                            <img src={formData.bannerUrl} alt="Banner" className="w-full h-32 object-cover mb-2 rounded-lg" />
                                        ) : (
                                            <>
                                                <div className="w-12 h-12 bg-indigo-500/10 rounded-full flex items-center justify-center mb-3 group-hover:bg-indigo-500/20 transition-colors">
                                                    <UploadCloud className="w-6 h-6 text-indigo-400" />
                                                </div>
                                                <p className="text-sm font-bold">{uploading ? 'Subiendo...' : 'Subir Portada'}</p>
                                                <p className="text-xs text-gray-500 mt-1">Recomendado: 1200x600px</p>
                                            </>
                                        )}
                                    </div>
                                </div>
                                <div className="text-xs text-yellow-500/80 bg-yellow-500/10 p-3 rounded-lg flex items-center gap-2">
                                    <Heart className="w-3 h-3 fill-yellow-500 text-yellow-500" />
                                    <span>Tu imagen es clave para la confianza de tus clientes.</span>
                                </div>

                                <div className="flex gap-4">
                                    <button
                                        type="button"
                                        onClick={() => setStep(1)}
                                        className="w-1/3 bg-[#1a1a1a] text-white font-bold py-4 rounded-xl hover:bg-[#222] transition-colors"
                                    >
                                        Atrás
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setStep(3)}
                                        disabled={uploading}
                                        className="flex-1 bg-white text-black font-bold py-4 rounded-xl hover:bg-gray-200 transition-colors disabled:opacity-50"
                                    >
                                        Continuar
                                    </button>
                                </div>
                            </div>
                        )}

                        {step === 3 && (
                            <div className="space-y-6">
                                <div>
                                    <h1 className="text-3xl font-bold mb-2">Conecta con tus Clientes</h1>
                                    <p className="text-gray-400">Links importantes para tus encuestas y contacto.</p>
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-1 flex items-center gap-2">
                                            <MessageCircle className="w-4 h-4 text-green-500" /> WhatsApp del Negocio
                                        </label>
                                        <input
                                            type="tel"
                                            value={formData.whatsappContact}
                                            onChange={(e) => setFormData({ ...formData, whatsappContact: e.target.value })}
                                            className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl p-4 text-white focus:border-green-500 transition-colors outline-none"
                                            placeholder="+52..."
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-1 flex items-center gap-2">
                                            <Globe className="w-4 h-4 text-blue-400" /> Link de Google Maps/Reviews
                                        </label>
                                        <input
                                            type="url"
                                            value={formData.googleReviewUrl}
                                            onChange={(e) => setFormData({ ...formData, googleReviewUrl: e.target.value })}
                                            className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl p-4 text-white focus:border-blue-500 transition-colors outline-none"
                                            placeholder="https://g.page/..."
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-300 mb-1">Instagram</label>
                                            <input
                                                type="text"
                                                value={formData.instagram}
                                                onChange={(e) => setFormData({ ...formData, instagram: e.target.value })}
                                                className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl p-4 text-white focus:border-pink-500 transition-colors outline-none"
                                                placeholder="@usuario"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-300 mb-1">Facebook</label>
                                            <input
                                                type="text"
                                                value={formData.facebook}
                                                onChange={(e) => setFormData({ ...formData, facebook: e.target.value })}
                                                className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl p-4 text-white focus:border-blue-600 transition-colors outline-none"
                                                placeholder="facebook.com/..."
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="flex gap-4">
                                    <button
                                        type="button"
                                        onClick={() => setStep(2)}
                                        className="w-1/3 bg-[#1a1a1a] text-white font-bold py-4 rounded-xl hover:bg-[#222] transition-colors"
                                    >
                                        Atrás
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isLoading}
                                        className="flex-1 bg-violet-600 text-white font-bold py-4 rounded-xl hover:bg-violet-500 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                                    >
                                        {isLoading ? 'Guardando...' : 'Finalizar y Crear Negocio'}
                                    </button>
                                </div>
                            </div>
                        )}
                    </form>
                </div>
            </div>
        </div>
    )
}
