'use client'

import { useState } from 'react'
import { joinAsSeller } from '@/actions/join-seller'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import BrandLogo from '@/components/BrandLogo'

const STATES = [
    'Aguascalientes', 'Baja California', 'Baja California Sur', 'Campeche', 'Chiapas', 'Chihuahua',
    'Ciudad de México', 'Coahuila', 'Colima', 'Durango', 'Guanajuato', 'Guerrero', 'Hidalgo', 'Jalisco',
    'México', 'Michoacán', 'Morelos', 'Nayarit', 'Nuevo León', 'Oaxaca', 'Puebla', 'Querétaro',
    'Quintana Roo', 'San Luis Potosí', 'Sinaloa', 'Sonora', 'Tabasco', 'Tamaulipas', 'Tlaxcala',
    'Veracruz', 'Yucatán', 'Zacatecas'
]

export default function SellerJoinPage() {
    const [loading, setLoading] = useState(false)
    const [sent, setSent] = useState(false)

    async function handleSubmit(formData: FormData) {
        setLoading(true)
        try {
            await joinAsSeller(formData)
            setSent(true)
            toast.success('¡Solicitud enviada!')
        } catch (error: any) {
            toast.error(error.message || 'Error al enviar solicitud')
            setLoading(false)
        }
    }

    if (sent) {
        return (
            <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
                <div className="max-w-md w-full bg-[#111] border border-white/10 rounded-2xl p-8 shadow-2xl text-center">
                    <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                        <span className="text-3xl">✅</span>
                    </div>
                    <h1 className="text-2xl font-bold text-white mb-2">Solicitud Recibida</h1>
                    <p className="text-gray-400 mb-6">
                        Hemos recibido tus datos. Nuestro equipo "Modo Dios" revisará tu perfil y te notificaremos si eres aceptado como Embajador.
                    </p>
                    <Button variant="outline" className="w-full" onClick={() => window.location.href = '/dashboard'}>
                        Volver al Dashboard
                    </Button>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-[#111] border border-white/10 rounded-2xl p-8 shadow-2xl">
                <div className="flex justify-center mb-6">
                    <BrandLogo size="lg" />
                </div>
                <h1 className="text-2xl font-bold text-white text-center mb-2">Postúlate como Embajador</h1>
                <p className="text-gray-400 text-center text-sm mb-8">
                    Completa tu perfil para entrevista. Solo aceptamos 50 representantes por estado.
                </p>

                <form action={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label>Nombre Completo</Label>
                        <Input name="name" placeholder="Tu nombre legal" required />
                    </div>

                    <div className="space-y-2">
                        <Label>Teléfono / WhatsApp</Label>
                        <Input name="phone" placeholder="+52..." required />
                    </div>

                    <div className="space-y-2">
                        <Label>Red Social Principal (Link)</Label>
                        <Input name="socialLink" placeholder="Instagram, LinkedIn..." required />
                    </div>

                    <div className="space-y-2">
                        <Label>Estado / Territorio</Label>
                        <select
                            name="state"
                            required
                            className="bg-black/50 border border-white/10 text-white w-full rounded-md h-10 px-3 text-sm focus:outline-none focus:border-blue-500"
                        >
                            <option value="">-- Seleccionar --</option>
                            {STATES.map(state => (
                                <option key={state} value={state}>{state}</option>
                            ))}
                        </select>
                    </div>

                    <div className="space-y-2">
                        <Label>¿Por qué deberíamos aceptarte?</Label>
                        <textarea
                            name="experience"
                            className="bg-black/50 border border-white/10 text-white w-full rounded-md p-3 text-sm focus:outline-none focus:border-blue-500 min-h-[100px]"
                            placeholder="Cuéntanos tu experiencia en ventas..."
                            required
                        />
                    </div>

                    <Button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold h-12">
                        {loading ? 'Enviando Solicitud...' : 'Enviar Solicitud'}
                    </Button>
                </form>
            </div>
        </div>
    )
}
