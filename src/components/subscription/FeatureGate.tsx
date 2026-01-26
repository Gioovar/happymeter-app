'use client'

import { useState } from 'react'
import { Lock, Crown, ChevronRight } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useDashboard } from '@/context/DashboardContext'
// import { Dialog, DialogContent } from '@/components/ui/dialog' // Assuming accessible UI lib
// Using simple absolute overlay for now to be framework agnostic or standard tailwind

export default function FeatureGate({ children, featureName = "Función Premium" }: { children: React.ReactNode, featureName?: string }) {
    const { isLocked } = useDashboard()
    const [isOpen, setIsOpen] = useState(false)
    const router = useRouter()

    if (!isLocked) {
        return <>{children}</>
    }

    return (
        <div className="relative group" onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            setIsOpen(true)
        }}>
            {/* Disabled content */}
            <div className="pointer-events-none opacity-50 blur-[1px] select-none">
                {children}
            </div>

            {/* Lock Overlay Hook */}
            <div className="absolute inset-0 z-10 flex items-center justify-center cursor-pointer group-hover:bg-white/5 transition-all rounded-lg">
                <div className="bg-black/80 backdrop-blur-md p-2 rounded-full border border-white/20 shadow-lg group-hover:scale-110 transition-transform">
                    <Lock className="w-4 h-4 text-amber-400" />
                </div>
            </div>

            {/* Popup Modal (Custom Implementation) */}
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-[#111] border border-white/10 rounded-2xl w-full max-w-md p-6 relative shadow-2xl scale-100 animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>

                        <button
                            onClick={(e) => { e.stopPropagation(); setIsOpen(false); }}
                            className="absolute top-4 right-4 text-gray-500 hover:text-white"
                        >
                            ✕
                        </button>

                        <div className="w-12 h-12 bg-amber-500/10 rounded-xl flex items-center justify-center mb-4">
                            <Crown className="w-6 h-6 text-amber-400" />
                        </div>

                        <h3 className="text-xl font-bold text-white mb-2">Desbloquea {featureName}</h3>
                        <p className="text-gray-400 mb-6 font-light">
                            Esta función está disponible exclusivamente en nuestros planes PRO. Aumenta tus ventas y mejora la experiencia de tus clientes hoy mismo.
                        </p>

                        <button
                            onClick={() => router.push('/dashboard/settings')}
                            className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold py-3 rounded-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                        >
                            Actualizar Plan
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                    {/* Backdrop click to close */}
                    <div className="absolute inset-0 -z-10" onClick={() => setIsOpen(false)} />
                </div>
            )}
        </div>
    )
}
