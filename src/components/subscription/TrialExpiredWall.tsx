'use client'

import { useRouter } from 'next/navigation'
import { Lock, Star, ChevronRight, Zap } from 'lucide-react'

export default function TrialExpiredWall() {
    const router = useRouter()

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0a0a0a]/95 backdrop-blur-sm p-4">
            <div className="w-full max-w-2xl bg-[#111] border border-white/10 rounded-3xl shadow-2xl overflow-hidden relative">
                {/* Background Glow */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/10 rounded-full blur-[100px] pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/10 rounded-full blur-[100px] pointer-events-none" />

                <div className="p-8 md:p-12 text-center relative z-10">
                    <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-blue-600 rounded-2xl mx-auto flex items-center justify-center mb-6 shadow-lg shadow-purple-500/20">
                        <Lock className="w-10 h-10 text-white" />
                    </div>

                    <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                        Tu periodo de prueba ha finalizado
                    </h2>
                    <p className="text-gray-400 text-lg mb-8 max-w-lg mx-auto">
                        Esperamos que hayas disfrutado de HappyMeter. Para seguir accediendo a tu dashboard, recolectando feedback y aumentando tus ventas, actualiza a un plan PRO.
                    </p>

                    <div className="grid md:grid-cols-2 gap-4 mb-8 text-left max-w-lg mx-auto">
                        <BenefitItem text="Encuestas ilimitadas" />
                        <BenefitItem text="Análisis con IA avanzado" />
                        <BenefitItem text="Integración con WhatsApp" />
                        <BenefitItem text="Soporte prioritario" />
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <button
                            onClick={() => router.push('/dashboard/settings')}
                            className="bg-white text-black px-8 py-4 rounded-xl font-bold text-lg hover:bg-gray-100 transition-all flex items-center justify-center gap-2 group"
                        >
                            <Zap className="w-5 h-5 fill-black" />
                            Ver Planes Disponibles
                            <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </button>
                        <button
                            onClick={() => window.open('https://wa.me/5211234567890', '_blank')}
                            className="bg-[#222] text-white px-8 py-4 rounded-xl font-medium text-lg hover:bg-[#333] transition-all border border-white/5"
                        >
                            Contactar Soporte
                        </button>
                    </div>

                    <p className="mt-8 text-xs text-gray-500">
                        ¿Crees que es un error? Revisa tu facturación o contáctanos.
                    </p>
                </div>
            </div>
        </div>
    )
}

function BenefitItem({ text }: { text: string }) {
    return (
        <div className="flex items-center gap-3 bg-white/5 p-3 rounded-lg">
            <div className="p-1 bg-green-500/20 rounded-full">
                <Star className="w-3 h-3 text-green-400 fill-green-400" />
            </div>
            <span className="text-gray-300 font-medium">{text}</span>
        </div>
    )
}
