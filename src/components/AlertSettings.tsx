
'use client'

import { useState, useEffect } from 'react'
import { Bell, Copy, Plus, Trash2, Save, Loader2, Phone, Mail, AlertTriangle, Send } from 'lucide-react'
import { toast } from 'sonner'

interface AlertConfig {
    enabled: boolean
    emails: string[]
    phones: string[]
    threshold: number
}

export default function AlertSettings({
    surveyId,
    initialConfig,
    onChange
}: {
    surveyId?: string
    initialConfig?: AlertConfig
    onChange?: (config: AlertConfig) => void
}) {
    const [config, setConfig] = useState<AlertConfig>(initialConfig || {
        enabled: false,
        emails: [],
        phones: [],
        threshold: 3
    })
    const [isLoading, setIsLoading] = useState(!!surveyId && !initialConfig)
    const [isSaving, setIsSaving] = useState(false)
    const [newEmail, setNewEmail] = useState('')
    const [newPhone, setNewPhone] = useState('')

    useEffect(() => {
        if (surveyId && !initialConfig) {
            fetchConfig()
        }
    }, [surveyId])

    // Propagate changes if onChange is provided
    useEffect(() => {
        if (onChange) {
            onChange(config)
        }
    }, [config])

    const fetchConfig = async () => {
        try {
            const res = await fetch(`/api/surveys/${surveyId}/alerts`)
            if (res.ok) {
                const data = await res.json()
                setConfig({
                    enabled: data.enabled ?? false,
                    emails: Array.isArray(data.emails) ? data.emails : [],
                    phones: Array.isArray(data.phones) ? data.phones : [],
                    threshold: data.threshold ?? 3
                })
            }
        } catch (error) {
            console.error(error)
        } finally {
            setIsLoading(false)
        }
    }

    const handleSave = async () => {
        if (onChange) {
            // In controlled mode, maybe just notify? Or do nothing as effect handles it.
            // But if user expects a "Saved" feedback even locally:
            toast.success('Configuración lista para guardarse con la encuesta')
            return
        }

        setIsSaving(true)
        try {
            const res = await fetch(`/api/surveys/${surveyId}/alerts`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(config)
            })
            if (res.ok) {
                toast.success('Configuración guardada')
            } else {
                toast.error('Error al guardar')
            }
        } catch (error) {
            toast.error('Error de conexión')
        } finally {
            setIsSaving(false)
        }
    }

    const addEmail = () => {
        if (!newEmail.includes('@')) return toast.error('Email inválido')
        setConfig(prev => ({ ...prev, emails: [...prev.emails, newEmail] }))
        setNewEmail('')
    }

    const addPhone = () => {
        const cleaned = newPhone.replace(/\D/g, '') // Basic clean
        if (cleaned.length < 10) return toast.error('Teléfono inválido (mínimo 10 dígitos)')
        setConfig(prev => ({ ...prev, phones: [...prev.phones, newPhone] })) // Keep original formatting or cleaned? preserving input usually better for display
        setNewPhone('')
    }

    const removeEmail = (email: string) => {
        setConfig(prev => ({ ...prev, emails: prev.emails.filter(e => e !== email) }))
    }

    const removePhone = (phone: string) => {
        setConfig(prev => ({ ...prev, phones: prev.phones.filter(p => p !== phone) }))
    }

    const handleTest = async (phone: string) => {
        if (!surveyId) {
            toast.error("Guarda la encuesta primero para probar las alertas.")
            return
        }
        const toastId = toast.loading("Enviando prueba...")
        try {
            const res = await fetch(`/api/surveys/${surveyId}/alerts/test`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone })
            })
            if (res.ok) {
                toast.success("Mensaje enviado. Revisa tu WhatsApp.", { id: toastId })
            } else {
                toast.error("Error al enviar. Revisa tus credenciales.", { id: toastId })
            }
        } catch (error) {
            toast.error("Error de conexión", { id: toastId })
        }
    }

    if (isLoading) return <div className="p-8 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-violet-500" /></div>

    return (
        <div className="bg-[#111] border border-white/5 rounded-2xl p-6 max-w-2xl mx-auto">
            {/* ... header ... */}
            <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-red-500/10 rounded-xl">
                    <Bell className="w-6 h-6 text-red-400" />
                </div>
                <div>
                    <h3 className="text-xl font-bold text-white">Alertas de Crisis</h3>
                    <p className="text-sm text-gray-400">Recibe notificaciones inmediatas cuando un cliente esté insatisfecho.</p>
                </div>
                <div className="ml-auto">
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input
                            type="checkbox"
                            className="sr-only peer"
                            checked={config.enabled}
                            onChange={(e) => setConfig(prev => ({ ...prev, enabled: e.target.checked }))}
                        />
                        <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-500"></div>
                    </label>
                </div>
            </div>

            {config.enabled && (
                <div className="space-y-6 animate-in fade-in slide-in-from-top-4 duration-300">
                    <div className="p-4 bg-red-500/5 border border-red-500/20 rounded-xl flex gap-3 text-sm text-red-200">
                        <AlertTriangle className="w-5 h-5 shrink-0" />
                        <p>Se enviará una alerta cuando la calificación sea igual o menor a <strong>{config.threshold} estrellas</strong>.</p>
                    </div>

                    {/* WhatsApp Numbers */}
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Números de WhatsApp</label>
                        <div className="flex gap-2 mb-3">
                            <input
                                type="text"
                                value={newPhone}
                                onChange={(e) => setNewPhone(e.target.value)}
                                placeholder="+52 123 456 7890"
                                className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-violet-500"
                            />
                            <button onClick={addPhone} className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition">
                                <Plus className="w-5 h-5 text-white" />
                            </button>
                        </div>
                        <div className="space-y-2">
                            {config.phones.map(phone => (
                                <div key={phone} className="flex justify-between items-center p-3 bg-white/5 rounded-lg border border-white/5">
                                    <div className="flex items-center gap-2">
                                        <Phone className="w-4 h-4 text-green-400" />
                                        <span className="text-gray-200">{phone}</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <button
                                            onClick={() => handleTest(phone)}
                                            className="text-gray-500 hover:text-green-400 p-2 rounded-lg hover:bg-white/5 transition"
                                            title="Probar WhatsApp"
                                        >
                                            <Send className="w-3.5 h-3.5" />
                                        </button>
                                        <button onClick={() => removePhone(phone)} className="text-gray-500 hover:text-red-400 p-2 rounded-lg hover:bg-white/5 transition">
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                            {config.phones.length === 0 && <p className="text-xs text-gray-500 italic">No hay números configurados.</p>}
                        </div>
                    </div>

                    {/* Emails */}
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Correos Electrónicos</label>
                        <div className="flex gap-2 mb-3">
                            <input
                                type="email"
                                value={newEmail}
                                onChange={(e) => setNewEmail(e.target.value)}
                                placeholder="gerente@restaurante.com"
                                className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-violet-500"
                            />
                            <button onClick={addEmail} className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition">
                                <Plus className="w-5 h-5 text-white" />
                            </button>
                        </div>
                        <div className="space-y-2">
                            {config.emails.map(email => (
                                <div key={email} className="flex justify-between items-center p-3 bg-white/5 rounded-lg border border-white/5">
                                    <div className="flex items-center gap-2">
                                        <Mail className="w-4 h-4 text-blue-400" />
                                        <span className="text-gray-200">{email}</span>
                                    </div>
                                    <button onClick={() => removeEmail(email)} className="text-gray-500 hover:text-red-400 transition">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                            {config.emails.length === 0 && <p className="text-xs text-gray-500 italic">No hay correos configurados.</p>}
                        </div>
                    </div>
                </div>
            )}

            <div className="mt-8 pt-6 border-t border-white/10 flex justify-end">
                <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white px-6 py-2 rounded-lg font-bold transition disabled:opacity-50"
                >
                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    {onChange ? 'Confirmar Alertas' : 'Guardar Configuración'}
                </button>
            </div>
        </div>
    )
}
