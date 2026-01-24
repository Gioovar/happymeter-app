'use client'

import React, { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { upsertPlace } from '@/actions/staff-places'
import { Loader2, Save, MapPin, ImageIcon, Phone, User, FileText, Clock, Link, Trash, Plus } from 'lucide-react'
import { toast } from 'sonner'

interface ManagePlaceModalProps {
    isOpen: boolean
    onClose: () => void
    placeToEdit?: any
    onSuccess: () => void
}

export default function ManagePlaceModal({ isOpen, onClose, placeToEdit, onSuccess }: ManagePlaceModalProps) {
    const [loading, setLoading] = useState(false)

    // Form State
    const [name, setName] = useState('')
    const [description, setDescription] = useState('')
    const [address, setAddress] = useState('')
    const [coverImage, setCoverImage] = useState('')
    const [contactName, setContactName] = useState('')
    const [contactPhone, setContactPhone] = useState('')
    const [agreementDetails, setAgreementDetails] = useState('')
    const [requiredDeliverables, setRequiredDeliverables] = useState('')
    const [exampleContentUrl, setExampleContentUrl] = useState('')
    const [exampleLinks, setExampleLinks] = useState<string[]>([])
    const [newExampleLink, setNewExampleLink] = useState('')
    const [contentIdeas, setContentIdeas] = useState('')
    const [contentGallery, setContentGallery] = useState<string[]>([])
    const [newGalleryImage, setNewGalleryImage] = useState('')

    // Schedule State
    const [allowedDays, setAllowedDays] = useState<number[]>([]) // 0=Sun, 1=Mon...
    const [startTime, setStartTime] = useState('')
    const [endTime, setEndTime] = useState('')

    useEffect(() => {
        if (isOpen) {
            if (placeToEdit) {
                setName(placeToEdit.name)
                setDescription(placeToEdit.description || '')
                setAddress(placeToEdit.address || '')
                setCoverImage(placeToEdit.coverImage || '')
                setContactName(placeToEdit.contactName || '')
                setContactPhone(placeToEdit.contactPhone || '')
                setAgreementDetails(placeToEdit.agreementDetails || '')
                setRequiredDeliverables(placeToEdit.requiredDeliverables || '')
                setExampleContentUrl(placeToEdit.exampleContentUrl || '')
                setExampleLinks(Array.isArray(placeToEdit.exampleLinks) ? placeToEdit.exampleLinks : [])
                setContentIdeas(placeToEdit.contentIdeas || '')
                setContentGallery(Array.isArray(placeToEdit.contentGallery) ? placeToEdit.contentGallery : [])

                // Load Schedule
                if (placeToEdit.scheduleConfig) {
                    const config = placeToEdit.scheduleConfig as any
                    setAllowedDays(config.allowedDays || [])
                    setStartTime(config.timeRange?.start || '')
                    setEndTime(config.timeRange?.end || '')
                } else {
                    setAllowedDays([])
                    setStartTime('')
                    setEndTime('')
                }
            } else {
                resetForm()
            }
        }
    }, [isOpen, placeToEdit])

    const resetForm = () => {
        setName('')
        setDescription('')
        setAddress('')
        setCoverImage('')
        setContactName('')
        setContactPhone('')
        setAgreementDetails('')
        setRequiredDeliverables('')
        setExampleContentUrl('')
        setExampleLinks([])
        setNewExampleLink('')
        setContentIdeas('')
        setContentGallery([])
        setNewGalleryImage('')
        setAllowedDays([])
        setStartTime('')
        setEndTime('')
    }

    const toggleDay = (dayIndex: number) => {
        setAllowedDays(prev =>
            prev.includes(dayIndex)
                ? prev.filter(d => d !== dayIndex)
                : [...prev, dayIndex]
        )
    }

    const addGalleryImage = () => {
        if (!newGalleryImage.trim()) return
        setContentGallery([...contentGallery, newGalleryImage.trim()])
        setNewGalleryImage('')
    }

    const removeGalleryImage = (index: number) => {
        setContentGallery(contentGallery.filter((_, i) => i !== index))
    }

    const addExampleLink = () => {
        if (!newExampleLink.trim()) return
        setExampleLinks([...exampleLinks, newExampleLink.trim()])
        setNewExampleLink('')
    }

    const removeExampleLink = (index: number) => {
        setExampleLinks(exampleLinks.filter((_, i) => i !== index))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!name.trim()) {
            toast.error('El nombre del lugar es requerido')
            return
        }

        setLoading(true)
        try {
            const result = await upsertPlace({
                id: placeToEdit?.id,
                name,
                description,
                address,
                coverImage,
                contactName,
                contactPhone,
                agreementDetails,
                requiredDeliverables,
                exampleContentUrl,
                exampleLinks,
                contentIdeas,
                contentGallery,
                scheduleConfig: {
                    allowedDays,
                    timeRange: { start: startTime, end: endTime }
                }
            })

            if (!result.success) {
                throw new Error(result.error)
            }

            toast.success(placeToEdit ? 'Lugar actualizado' : 'Lugar creado exitosamente')
            onSuccess()
            onClose()
        } catch (error: any) {
            toast.error(error.message || 'Error al guardar')
        } finally {
            setLoading(false)
        }
    }

    const DAYS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="bg-[#111] border-white/10 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{placeToEdit ? 'Editar Lugar / Acuerdo' : 'Agregar Nuevo Lugar'}</DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6 mt-4">
                    {/* Basic Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-400 flex items-center gap-2">
                                <MapPin className="w-3 h-3" /> Nombre del Lugar
                            </label>
                            <input
                                required
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Ej: Restaurante Nuba"
                                className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white focus:border-violet-500 transition"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-400 flex items-center gap-2">
                                <ImageIcon className="w-3 h-3" /> URL Imagen de Portada
                            </label>
                            <input
                                value={coverImage}
                                onChange={(e) => setCoverImage(e.target.value)}
                                placeholder="https://..."
                                className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white focus:border-violet-500 transition"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-400">Descripción Corta</label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Descripción breve del ambiente y tipo de lugar..."
                            className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white focus:border-violet-500 transition"
                            rows={2}
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-400">Dirección</label>
                        <input
                            value={address}
                            onChange={(e) => setAddress(e.target.value)}
                            placeholder="Calle 123, Col. Centro..."
                            className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white focus:border-violet-500 transition"
                        />
                    </div>

                    {/* Schedule Configuration */}
                    <div className="p-4 bg-white/5 border border-white/10 rounded-xl space-y-4">
                        <h3 className="text-sm font-bold text-white flex items-center gap-2">
                            <Clock className="w-4 h-4 text-violet-400" /> Disponibilidad para Creadores
                        </h3>
                        <div className="space-y-3">
                            <label className="text-xs font-bold text-gray-400">Días Permitidos</label>
                            <div className="flex flex-wrap gap-2">
                                {DAYS.map((day, index) => (
                                    <button
                                        key={day}
                                        type="button"
                                        onClick={() => toggleDay(index)}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${allowedDays.includes(index)
                                            ? 'bg-violet-600 text-white'
                                            : 'bg-white/5 text-gray-400 hover:bg-white/10'
                                            }`}
                                    >
                                        {day.slice(0, 3)}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-400">Hora Inicio</label>
                                <input
                                    type="time"
                                    value={startTime}
                                    onChange={(e) => setStartTime(e.target.value)}
                                    className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-400">Hora Fin</label>
                                <input
                                    type="time"
                                    value={endTime}
                                    onChange={(e) => setEndTime(e.target.value)}
                                    className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Contact & Agreement Section */}
                    <div className="p-4 bg-violet-900/10 border border-violet-500/20 rounded-xl space-y-4">
                        <h3 className="text-sm font-bold text-violet-400 flex items-center gap-2">
                            <FileText className="w-4 h-4" /> Datos del Acuerdo
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-400 flex items-center gap-2">
                                    <User className="w-3 h-3" /> Nombre de Contacto
                                </label>
                                <input
                                    value={contactName}
                                    onChange={(e) => setContactName(e.target.value)}
                                    placeholder="Gerente o Encargado"
                                    className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-400 flex items-center gap-2">
                                    <Phone className="w-3 h-3" /> Teléfono / WhatsApp
                                </label>
                                <input
                                    value={contactPhone}
                                    onChange={(e) => setContactPhone(e.target.value)}
                                    placeholder="+52..."
                                    className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-400">Detalles del Convenio (Visible para Staff)</label>
                            <textarea
                                value={agreementDetails}
                                onChange={(e) => setAgreementDetails(e.target.value)}
                                placeholder="Ej: $2000 MXN en consumo. Solo jueves a las 7pm. Mencionar a Pedro..."
                                className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white font-mono text-sm"
                                rows={4}
                            />
                            <p className="text-[10px] text-gray-500">
                                Describe exactamente qué se acordó: monto de intercambio, horarios permitidos, restricciones, etc.
                            </p>
                        </div>
                    </div>

                    {/* Content Requirements Section */}
                    <div className="p-4 bg-pink-900/10 border border-pink-500/20 rounded-xl space-y-4">
                        <h3 className="text-sm font-bold text-pink-400 flex items-center gap-2">
                            <FileText className="w-4 h-4" /> Entregables Requeridos (Visible para Creador)
                        </h3>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-400">Actividades a Realizar</label>
                            <textarea
                                value={requiredDeliverables}
                                onChange={(e) => setRequiredDeliverables(e.target.value)}
                                placeholder="Ej: 1 Reel de 60s, 3 Historias etiquetando a @lugar..."
                                className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white font-mono text-sm focus:border-pink-500 transition"
                                rows={3}
                            />
                            <p className="text-[10px] text-gray-500">
                                Especifica claramente qué contenido debe generar el creador a cambio del beneficio.
                            </p>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-400 flex items-center gap-2">
                                <Link className="w-3 h-3" /> Links de Ejemplos
                            </label>
                            <div className="flex gap-2">
                                <input
                                    value={newExampleLink}
                                    onChange={(e) => setNewExampleLink(e.target.value)}
                                    placeholder="https://..."
                                    className="flex-1 bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:border-pink-500 transition"
                                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addExampleLink())}
                                />
                                <button
                                    type="button"
                                    onClick={addExampleLink}
                                    className="px-3 py-2 bg-pink-600 hover:bg-pink-500 rounded-lg text-white transition"
                                >
                                    <Plus className="w-4 h-4" />
                                </button>
                            </div>
                            {exampleLinks.length > 0 && (
                                <ul className="space-y-1 mt-2">
                                    {exampleLinks.map((link, idx) => (
                                        <li key={idx} className="flex items-center justify-between text-xs bg-white/5 px-2 py-1.5 rounded border border-white/5">
                                            <span className="truncate max-w-[200px] text-blue-400">{link}</span>
                                            <button
                                                type="button"
                                                onClick={() => removeExampleLink(idx)}
                                                className="text-gray-500 hover:text-red-400"
                                            >
                                                <Trash className="w-3 h-3" />
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </div>

                    {/* Content Ideas - Extended */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-400 flex items-center gap-2">
                            <FileText className="w-3 h-3" /> Guía de Contenido / Ideas (Texto Largo)
                        </label>
                        <textarea
                            value={contentIdeas}
                            onChange={(e) => setContentIdeas(e.target.value)}
                            placeholder={`Ejemplo:\n🔥 1. Contenido MOTIVACIONAL\n🎥 "Nadie empieza fuerte..."\n\n2. Contenido EDUCATIVO\n...`}
                            className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white font-mono text-sm focus:border-pink-500 transition whitespace-pre-wrap"
                            rows={10}
                        />
                        <p className="text-[10px] text-gray-500">Usa emojis y espacios para estructurar las ideas.</p>
                    </div>

                    {/* Inspiration Gallery */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-400 flex items-center gap-2">
                            <ImageIcon className="w-3 h-3" /> Galería de Inspiración (Imágenes)
                        </label>

                        <div className="flex gap-2 items-center">
                            <label className="cursor-pointer px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg border border-white/10 flex items-center gap-2 transition text-sm font-bold text-gray-300 hover:text-white">
                                <ImageIcon className="w-4 h-4" />
                                Subir Imagen
                                <input
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={async (e) => {
                                        const file = e.target.files?.[0]
                                        if (!file) return

                                        const loadingToast = toast.loading('Subiendo imagen...')
                                        const formData = new FormData()
                                        formData.append('file', file)

                                        try {
                                            const res = await fetch('/api/upload', {
                                                method: 'POST',
                                                body: formData
                                            })
                                            const data = await res.json()

                                            if (data.url) {
                                                setContentGallery([...contentGallery, data.url])
                                                toast.dismiss(loadingToast)
                                                toast.success('Imagen subida')
                                            } else {
                                                throw new Error(data.error)
                                            }
                                        } catch (err) {
                                            toast.dismiss(loadingToast)
                                            toast.error('Error al subir imagen')
                                        }
                                        e.target.value = ''
                                    }}
                                />
                            </label>

                            {/* Hidden input for manual URL if needed, or remove completely if user wants strictly upload. 
                                User said "no pidas url" so I am removing the text input entirely. 
                            */}
                        </div>

                        {contentGallery.length > 0 && (
                            <div className="grid grid-cols-4 gap-2 mt-2">
                                {contentGallery.map((url, idx) => (
                                    <div key={idx} className="relative aspect-square group rounded-lg overflow-hidden border border-white/10 bg-black/50">
                                        <img src={url} alt="" className="w-full h-full object-cover" />
                                        <button
                                            type="button"
                                            onClick={() => removeGalleryImage(idx)}
                                            className="absolute top-1 right-1 bg-black/70 p-1 rounded-full text-white opacity-0 group-hover:opacity-100 transition hover:bg-red-600"
                                        >
                                            <Trash className="w-3 h-3" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="flex gap-3 justify-end pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white transition"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-6 py-2 bg-violet-600 hover:bg-violet-500 text-white font-bold rounded-lg flex items-center gap-2 transition shadow-lg shadow-violet-600/20"
                        >
                            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                            {placeToEdit ? 'Guardar Cambios' : 'Crear Lugar'}
                        </button>
                    </div>
                </form>
            </DialogContent>
        </Dialog >
    )
}
