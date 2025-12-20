'use client'

import { updateSettings } from '@/actions/settings'
import { Loader2, Save, Store, Phone, Instagram, Facebook } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

export function SettingsForm({ userSettings }: { userSettings: any }) {
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (formData: FormData) => {
        setLoading(true)
        try {
            const result = await updateSettings(formData)
            if (result.success) {
                toast.success('Configuración actualizada correctamente')
            } else {
                toast.error(`Error: ${result.error}`)
            }
        } catch (error) {
            toast.error('Error inesperado al conectar con el servidor')
        } finally {
            setLoading(false)
        }
    }

    return (
        <form action={handleSubmit} className="space-y-8">
            {/* Business Info Section */}
            <div className="space-y-6">
                <h3 className="text-xl font-bold text-white flex items-center gap-2 border-b border-white/5 pb-2">
                    <Store className="w-5 h-5 text-violet-400" /> Información del Negocio
                </h3>

                <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-300">Nombre del Negocio</label>
                        <input
                            type="text"
                            name="businessName"
                            defaultValue={userSettings.businessName || ''}
                            required
                            className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-violet-500 transition placeholder:text-gray-600"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-300">Giro (Industria)</label>
                        <div className="relative">
                            <select
                                name="industry"
                                defaultValue={userSettings.industry || 'restaurant'}
                                required
                                className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-violet-500 transition appearance-none cursor-pointer"
                            >
                                <option value="restaurant">Restaurante / Cafetería</option>
                                <option value="bar">Bar / Antro / Vida Nocturna</option>
                                <option value="hotel">Hotel / Hospitalidad</option>
                                <option value="retail">Tienda / Retail / Moda</option>
                                <option value="medical">Salud / Clínica / Consultorio</option>
                                <option value="service">Otro Servicio</option>
                            </select>
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>
                            </div>
                        </div>
                        <p className="text-xs text-gray-500">Esto ayuda a la IA a generar estrategias más precisas.</p>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-300">WhatsApp / Teléfono</label>
                        <input
                            type="tel"
                            name="phone"
                            defaultValue={userSettings.phone || ''}
                            className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-violet-500 transition placeholder:text-gray-600"
                        />
                    </div>
                </div>
            </div>

            {/* Social Media Section */}
            <div className="space-y-6">
                <h3 className="text-xl font-bold text-white flex items-center gap-2 border-b border-white/5 pb-2">
                    <Instagram className="w-5 h-5 text-pink-400" /> Redes Sociales
                </h3>

                <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-300">Instagram</label>
                        <input
                            type="text"
                            name="instagram"
                            defaultValue={userSettings.socialLinks?.instagram || ''}
                            placeholder="@usuario"
                            className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-violet-500 transition placeholder:text-gray-600"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-300">Facebook</label>
                        <input
                            type="text"
                            name="facebook"
                            defaultValue={userSettings.socialLinks?.facebook || ''}
                            placeholder="Usuario o Link"
                            className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-violet-500 transition placeholder:text-gray-600"
                        />
                    </div>
                </div>
            </div>

            {/* Notifications Section */}
            <div className="space-y-6">
                <h3 className="text-xl font-bold text-white flex items-center gap-2 border-b border-white/5 pb-2">
                    <Phone className="w-5 h-5 text-green-500" /> Notificaciones
                </h3>

                <div className="bg-green-500/5 border border-green-500/10 rounded-xl p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h4 className="text-white font-bold flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                Alertas por WhatsApp
                            </h4>
                            <p className="text-gray-400 text-sm mt-1">
                                Recibe alertas inmediatas cuando un cliente deje una calificación baja o complete una encuesta importante.
                            </p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                name="whatsappEnabled"
                                checked={true}
                                readOnly
                                className="sr-only peer"
                            />
                            {/* Hidden input to ensure 'on' is sent since checkbox is readOnly/disabled often don't send */}
                            <input type="hidden" name="whatsappEnabled" value="on" />
                            <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
                        </label>
                    </div>
                </div>
            </div>

            <div className="pt-4 flex justify-end">
                <button
                    type="submit"
                    disabled={loading}
                    className="flex items-center gap-2 px-8 py-3 bg-violet-600 hover:bg-violet-500 text-white font-bold rounded-xl transition shadow-lg hover:shadow-violet-600/20 disabled:opacity-50"
                >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                    Guardar Cambios
                </button>
            </div>
        </form>
    )
}
