'use client'

import { useRouter } from 'next/navigation'
import { Lock } from 'lucide-react'
import { SalesContent } from '../plans/SalesContent'

export default function TrialExpiredWall() {
    const router = useRouter()

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#050505] p-4 overflow-y-auto">
            {/* Background Effects */}
            <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-violet-600/10 blur-[120px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-blue-600/10 blur-[120px]" />
            </div>

            <div className="max-w-5xl w-full relative z-10 py-4 flex flex-col h-full md:h-auto">
                <div className="text-center mb-6">
                    <div className="w-12 h-12 bg-red-500/10 rounded-2xl mx-auto flex items-center justify-center mb-4 border border-red-500/20">
                        <Lock className="w-6 h-6 text-red-500" />
                    </div>

                    <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
                        Función Premium Bloqueada
                    </h2>
                    <p className="text-gray-400 text-sm max-w-xl mx-auto mb-4">
                        Tu plan actual no incluye esta herramienta. <br />
                        <span className="text-white font-medium">Configura tu plan ideal para desbloquearla ahora mismo.</span>
                    </p>
                </div>

                <div className="flex-1 bg-[#0a0a0a] border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
                    <SalesContent defaultPlan="POWER" showHeader={false} />
                </div>

                <p className="mt-6 text-center text-xs text-gray-500">
                    ¿Necesitas ayuda o crees que es un error? <span className="text-gray-400 underline cursor-pointer" onClick={() => window.open('https://wa.me/5211234567890')}>Contactar Soporte</span>
                </p>
            </div>
        </div>
    )
}


