import CreatorOnboardingForm from '@/components/creators/OnboardingForm'
import { CheckCircle } from 'lucide-react'

export const metadata = {
    title: 'Completa tu Perfil | HappyMeter Creators'
}

export default function CreatorOnboardingPage() {
    return (
        <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-4 relative overflow-hidden">

            {/* Background Gradients */}
            <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-violet-600/20 rounded-full blur-[120px] -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
            <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[120px] translate-x-1/2 translate-y-1/2 pointer-events-none" />

            <div className="w-full max-w-2xl z-10">
                <div className="text-center mb-10 space-y-4">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-400 text-sm font-medium mb-4">
                        <CheckCircle className="w-4 h-4" /> Registro Inicial Completado
                    </div>
                    <h1 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
                        Solo unos pasos más...
                    </h1>
                    <p className="text-lg text-gray-400 max-w-lg mx-auto">
                        Necesitamos conocer más sobre tu contenido para asignarte las mejores ofertas y comisiones.
                    </p>
                </div>

                <CreatorOnboardingForm />
            </div>
        </div>
    )
}
