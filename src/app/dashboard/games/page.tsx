'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Utensils, Wine, ShoppingBag, Coffee, Hotel, MoreHorizontal, ArrowRight } from 'lucide-react'

const industries = [
    {
        id: 'restaurants',
        title: 'Restaurantes',
        description: 'Juegos para espera de mesa, post-comida y fidelización.',
        icon: Utensils,
        color: 'from-orange-500 to-red-500',
        active: true
    },
    {
        id: 'bars',
        title: 'Bares y Antros',
        description: 'Dinámicas de shots, retos y promociones en tiempo real.',
        icon: Wine,
        color: 'from-purple-500 to-pink-500',
        active: true
    },
    {
        id: 'cafes',
        title: 'Cafeterías',
        description: 'Recompensas por visitas frecuentes y juegos relajantes.',
        icon: Coffee,
        color: 'from-amber-500 to-orange-400',
        active: true
    },
    {
        id: 'retail',
        title: 'Tiendas / Retail',
        description: 'Ruletas de descuentos y premios por compra.',
        icon: ShoppingBag,
        color: 'from-blue-500 to-cyan-500',
        active: false
    },
    {
        id: 'hotels',
        title: 'Hoteles',
        description: 'Encuestas gamificadas de check-out y servicios.',
        icon: Hotel,
        color: 'from-emerald-500 to-teal-500',
        active: true
    },
    {
        id: 'other',
        title: 'Otros Negocios',
        description: 'Juegos genéricos adaptables a cualquier rubro.',
        icon: MoreHorizontal,
        color: 'from-gray-500 to-gray-700',
        active: false
    }
]

export default function GamesHubPage() {
    const router = useRouter()

    const handleSelect = (id: string) => {
        if (id === 'bars') {
            router.push('/dashboard/games/bars')
        } else if (id === 'restaurants') {
            router.push('/dashboard/games/restaurants')
        } else if (id === 'cafes') {
            router.push('/dashboard/games/cafes')
        } else if (id === 'hotels') {
            router.push('/dashboard/games/hotels')
        } else {
            alert("¡Próximamente! Estamos trabajando en los juegos para esta categoría.")
        }
    }

    return (
        <div className="p-8 max-w-7xl mx-auto min-h-screen">
            <div className="mb-10">
                <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-violet-400 to-fuchsia-400 mb-2">
                    Centro de Juegos y Gamificación
                </h1>
                <p className="text-gray-400 text-lg">
                    Selecciona el giro de tu negocio para ver el catálogo de juegos disponibles.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {industries.map((industry) => (
                    <div
                        key={industry.id}
                        onClick={() => handleSelect(industry.id)}
                        className={`
                            group relative overflow-hidden rounded-2xl border border-white/5 bg-white/5 p-6 
                            cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:border-white/10 hover:shadow-2xl
                        `}
                    >
                        {/* Background Gradient */}
                        <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${industry.color} opacity-10 blur-[40px] rounded-full group-hover:opacity-20 transition-opacity`} />

                        <div className="relative z-10">
                            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${industry.color} flex items-center justify-center mb-4 shadow-lg`}>
                                <industry.icon className="w-6 h-6 text-white" />
                            </div>

                            <h3 className="text-xl font-bold text-white mb-2">{industry.title}</h3>
                            <p className="text-gray-400 text-sm mb-6 min-h-[40px]">{industry.description}</p>

                            <div className="flex items-center justify-between">
                                <span className={`text-xs font-medium px-2 py-1 rounded-full ${industry.active ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-gray-500/10 text-gray-500 border border-gray-500/20'}`}>
                                    {industry.active ? 'Disponible' : 'Próximamente'}
                                </span>
                                <div className={`w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-white/50 group-hover:bg-violet-500 group-hover:text-white transition-colors duration-300`}>
                                    <ArrowRight className="w-4 h-4" />
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
