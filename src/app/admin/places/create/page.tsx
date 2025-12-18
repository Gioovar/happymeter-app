'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Save, Upload, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'

export default function CreatePlacePage() {
    const router = useRouter()
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        address: '',
        contactName: '',
        contactPhone: '',
        agreementDetails: '',
        coverImage: ''
    })

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!formData.name) {
            toast.error('El nombre es obligatorio')
            return
        }

        setIsSubmitting(true)
        try {
            const res = await fetch('/api/admin/places', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            })

            if (res.ok) {
                toast.success('Lugar creado correctamente')
                router.push('/admin/places')
                router.refresh()
            } else {
                toast.error('Error al crear lugar')
            }
        } catch (error) {
            console.error(error)
            toast.error('Error inesperado')
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center gap-4">
                <Link href="/admin/places" className="p-2 hover:bg-white/5 rounded-lg transition">
                    <ArrowLeft className="w-5 h-5 text-gray-400" />
                </Link>
                <h1 className="text-2xl font-bold">Nuevo Lugar</h1>
            </div>

            <form onSubmit={handleSubmit} className="bg-[#111] border border-white/5 rounded-2xl p-6 md:p-8 space-y-8">
                {/* Basic Info */}
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold border-b border-white/5 pb-2">Información Básica</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-300">Nombre del Lugar *</label>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-violet-500/50 transition"
                                placeholder="Ej. Bar Central"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-300">Dirección</label>
                            <input
                                type="text"
                                value={formData.address}
                                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-violet-500/50 transition"
                                placeholder="Calle Providencia 123..."
                            />
                        </div>
                        <div className="col-span-1 md:col-span-2 space-y-2">
                            <label className="text-sm font-medium text-gray-300">Descripción</label>
                            <textarea
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-violet-500/50 transition min-h-[100px]"
                                placeholder="Describe el ambiente y qué ofrece..."
                            />
                        </div>
                        <div className="col-span-1 md:col-span-2 space-y-2">
                            <label className="text-sm font-medium text-gray-300">URL de Imagen (Cover)</label>
                            <input
                                type="text"
                                value={formData.coverImage}
                                onChange={(e) => setFormData({ ...formData, coverImage: e.target.value })}
                                className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-violet-500/50 transition"
                                placeholder="https://..."
                            />
                        </div>
                    </div>
                </div>

                {/* Contact & Agreement */}
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold border-b border-white/5 pb-2">Contacto y Acuerdo</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-300">Nombre de Contacto</label>
                            <input
                                type="text"
                                value={formData.contactName}
                                onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                                className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-violet-500/50 transition"
                                placeholder="Ej. Juan Pérez (Gerente)"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-300">Teléfono / WhatsApp</label>
                            <input
                                type="text"
                                value={formData.contactPhone}
                                onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                                className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-violet-500/50 transition"
                                placeholder="+56 9..."
                            />
                        </div>
                        <div className="col-span-1 md:col-span-2 space-y-2">
                            <label className="text-sm font-medium text-gray-300">Detalles del Acuerdo</label>
                            <textarea
                                value={formData.agreementDetails}
                                onChange={(e) => setFormData({ ...formData, agreementDetails: e.target.value })}
                                className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-violet-500/50 transition min-h-[100px]"
                                placeholder="Ej. 2 tragos gratis por creador a cambio de 1 story..."
                            />
                            <p className="text-xs text-gray-500">Esta información solo es visible para administradores.</p>
                        </div>
                    </div>
                </div>

                <div className="flex justify-end pt-4">
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="px-8 py-3 bg-violet-600 hover:bg-violet-500 text-white font-bold rounded-xl transition flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" /> Guardando...
                            </>
                        ) : (
                            <>
                                <Save className="w-5 h-5" /> Guardar Lugar
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    )
}
