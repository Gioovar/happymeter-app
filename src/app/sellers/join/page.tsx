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

    async function handleSubmit(formData: FormData) {
        setLoading(true)
        try {
            await joinAsSeller(formData)
            toast.success('¡Bienvenido Embajador!')
        } catch (error: any) {
            toast.error(error.message || 'Error al unirse')
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-[#111] border border-white/10 rounded-2xl p-8 shadow-2xl">
                <div className="flex justify-center mb-6">
                    <BrandLogo size="lg" />
                </div>
                <h1 className="text-2xl font-bold text-white text-center mb-2">Únete como Embajador</h1>
                <p className="text-gray-400 text-center text-sm mb-8">
                    Selecciona tu territorio para comenzar a vender y generar comisiones exclusivas.
                </p>

                <form action={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                        <Label>Selecciona tu Estado</Label>
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

                    <Button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold h-12">
                        {loading ? 'Procesando...' : 'Reclamar Territorio'}
                    </Button>
                </form>
            </div>
        </div>
    )
}
