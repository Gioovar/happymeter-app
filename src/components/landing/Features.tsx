
import { Bot, MessageCircle, QrCode, BarChart3 } from 'lucide-react'

const features = [
    {
        icon: Bot,
        title: "Análisis con IA",
        description: "Nuestra IA lee cada comentario y detecta el sentimiento (positivo, neutral, negativo) automáticamente.",
        color: "text-violet-400",
        bg: "bg-violet-500/10"
    },
    {
        icon: MessageCircle,
        title: "Reportes por WhatsApp",
        description: "Recibe resúmenes semanales y alertas críticas directamente en tu WhatsApp. No más emails perdidos.",
        color: "text-green-400",
        bg: "bg-green-500/10"
    },
    {
        icon: QrCode,
        title: "Códigos QR Dinámicos",
        description: "Genera QRs únicos para cada mesa, producto o sucursal. Imprímelos y empieza a medir hoy.",
        color: "text-blue-400",
        bg: "bg-blue-500/10"
    },
    {
        icon: BarChart3,
        title: "Métricas en Tiempo Real",
        description: "Visualiza tu NPS (Net Promoter Score) y tendencias de satisfacción al instante.",
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
