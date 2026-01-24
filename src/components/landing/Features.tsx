
import { Bot, MessageCircle, QrCode, BarChart3, ClipboardCheck, CalendarDays, Megaphone, LayoutDashboard, Sparkles } from 'lucide-react'

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
    },
    {
        icon: ClipboardCheck,
        title: "Supervisor Digital",
        description: "Tus protocolos se cumplen o te enteras. El staff sube foto/video de cada tarea (limpieza, apertura) y tú apruebas.",
        color: "text-emerald-400",
        bg: "bg-emerald-500/10"
    },
    {
        icon: CalendarDays,
        title: "Sistema de Reservas",
        description: "Organiza tu flujo de clientes sin errores. Gestiona mesas y horarios desde tu propio centro de comando.",
        color: "text-amber-400",
        bg: "bg-amber-500/10"
    },
    {
        icon: Megaphone,
        title: "Motor de Ventas",
        description: "Tu base de datos trabaja para ti. Envía promociones a clientes dormidos y llénalos de nuevo en días flojos.",
        color: "text-cyan-400",
        bg: "bg-cyan-500/10"
    },
    {
        icon: LayoutDashboard,
        title: "Panel de Dueño (El Cerebro)",
        description: "Todo lo que pasa en tu negocio en una sola pantalla. Métricas reales para decisiones de millón de dólares.",
        color: "text-indigo-400",
        bg: "bg-indigo-500/10"
    },
    {
        icon: Sparkles,
        title: "Tu Propio Asistente IA",
        description: "Pregúntale lo que sea: '¿Por qué bajaron las ventas ayer?' o '¿Quién es mi mejor mesero?'. Te responde con datos.",
        color: "text-pink-400",
        bg: "bg-pink-500/10"
    }
]

export default function Features() {
    return (
        <section className="py-24 bg-black/50 relative">
            <div className="max-w-7xl mx-auto px-6">
                <div className="text-center max-w-3xl mx-auto mb-16">
                    <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">Los 9 Poderes de tu Sistema Operativo</h2>
                    <p className="text-gray-400 text-lg">HappyMeter no es solo una encuesta, es el arsenal completo para dominar tu mercado.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
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
