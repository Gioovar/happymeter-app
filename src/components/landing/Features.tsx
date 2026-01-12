
import { Bot, MessageCircle, QrCode, BarChart3 } from 'lucide-react'

const features = [
    {
        icon: MessageCircle,
        title: "El Escudo Anti-Quejas",
        description: "Intercepta el mal servicio ANTES de que llegue a Google. Te aviso por WhatsApp al instante para que salves la mesa.",
        color: "text-red-400",
        bg: "bg-red-500/10"
    },
    {
        icon: Bot,
        title: "Tu Oído Absoluto (IA)",
        description: "Detecta lo que tus clientes realmente piensan. Nuestra IA analiza sentimientos y sabe qué falló sin que tú estés ahí.",
        color: "text-violet-400",
        bg: "bg-violet-500/10"
    },
    {
        icon: BarChart3,
        title: "Detector de Talento",
        description: "Ranking automático de empleados. Premia al mesero estrella y detecta quién te está costando dinero.",
        color: "text-blue-400",
        bg: "bg-blue-500/10"
    },
    {
        icon: QrCode,
        title: "Máquina de Lealtad",
        description: "Crea adicción en tus clientes. Un sistema de puntos automático que los obliga a volver una y otra vez.",
        color: "text-fuchsia-400",
        bg: "bg-fuchsia-500/10"
    }
]

export default function Features() {
    return (
        <section className="py-24 bg-black/50 relative">
            <div className="max-w-7xl mx-auto px-6">
                <div className="text-center max-w-3xl mx-auto mb-16">
                    <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">Todo lo que necesitas para crecer</h2>
                    <p className="text-gray-400 text-lg">HappyMeter no es solo una encuesta, es un sistema completo de inteligencia de clientes.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {features.map((feature, index) => {
                        const Icon = feature.icon
                        return (
                            <div key={index} className="p-8 rounded-3xl bg-[#111] border border-white/5 hover:border-white/10 transition group hover:-translate-y-1 duration-300">
                                <div className={`w-14 h-14 rounded-2xl ${feature.bg} ${feature.color} flex items-center justify-center mb-6 group-hover:scale-110 transition`}>
                                    <Icon className="w-7 h-7" />
                                </div>
                                <h3 className="text-xl font-bold text-white mb-3">{feature.title}</h3>
                                <p className="text-gray-400 leading-relaxed">
                                    {feature.description}
                                </p>
                            </div>
                        )
                    })}
                </div>
            </div>
        </section>
    )
}
