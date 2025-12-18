
import { QrCode, MessageSquare, TrendingUp } from 'lucide-react'

const steps = [
    {
        icon: QrCode,
        title: "1. Genera tu QR",
        description: "Crea un código QR único para tu negocio en segundos. Personalízalo con tu logo y colores.",
        color: "text-blue-400",
        bg: "bg-blue-500/10"
    },
    {
        icon: MessageSquare,
        title: "2. Recolecta Feedback",
        description: "Tus clientes escanean y dejan su opinión en una interfaz rápida y hermosa. Sin registros molestos.",
        color: "text-violet-400",
        bg: "bg-violet-500/10"
    },
    {
        icon: TrendingUp,
        title: "3. Analiza y Crece",
        description: "Nuestra IA analiza los comentarios y te dice exactamente qué mejorar para vender más.",
        color: "text-fuchsia-400",
        bg: "bg-fuchsia-500/10"
    }
]

export default function HowItWorks() {
    return (
        <section className="py-32 bg-[#050505] relative">
            <div className="max-w-7xl mx-auto px-6">
                <div className="text-center mb-20">
                    <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
                        Tan fácil como 1, 2, 3
                    </h2>
                    <p className="text-gray-400 text-lg max-w-2xl mx-auto">
                        Olvídate de configuraciones complejas. HappyMeter está diseñado para funcionar desde el primer día.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative">
                    {/* Connecting Line (Desktop) */}
                    <div className="hidden md:block absolute top-12 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-violet-500/20 to-transparent" />

                    {steps.map((step, index) => {
                        const Icon = step.icon
                        return (
                            <div key={index} className="relative z-10 flex flex-col items-center text-center group">
                                <div className={`w-24 h-24 rounded-3xl ${step.bg} ${step.color} flex items-center justify-center mb-8 border border-white/5 shadow-2xl group-hover:scale-110 transition duration-300`}>
                                    <Icon className="w-10 h-10" />
                                </div>
                                <h3 className="text-2xl font-bold text-white mb-4">{step.title}</h3>
                                <p className="text-gray-400 leading-relaxed max-w-sm">
                                    {step.description}
                                </p>
                            </div>
                        )
                    })}
                </div>
            </div>
        </section>
    )
}
