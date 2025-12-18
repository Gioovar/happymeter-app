'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp, Book, CreditCard, BarChart2, MessageSquare } from 'lucide-react'

// Article Data
const CATEGORIES = [
    {
        id: 'start',
        title: 'Primeros Pasos',
        icon: Book,
        color: 'text-blue-400 bg-blue-500/10',
        articles: [
            {
                title: '¿Cómo crear mi primera encuesta?',
                content: 'Ve al menú "Crear Nueva", selecciona una plantilla (ej. Satisfacción General), personaliza los colores y guarda. ¡Tendrás tu QR listo al instante!'
            },
            {
                title: '¿Cómo imprimo mi código QR?',
                content: 'En la lista de "Mis Encuestas", haz clic en el icono "Compartir" de la encuesta que desees. Podrás descargar el QR en imagen o PDF para imprimirlo en alta calidad.'
            }
        ]
    },
    {
        id: 'reports',
        title: 'Reportes e Inteligencia Artificial',
        icon: BarChart2,
        color: 'text-violet-400 bg-violet-500/10',
        articles: [
            {
                title: '¿Qué son los Planes de Acción con IA?',
                content: 'HappyMeter no solo muestra gráficas. Ve a la sección "Reportes", selecciona un rango de fechas y haz clic en "Crear Reporte". Nuestra IA analizará todos los comentarios y generará un plan paso a paso para mejorar tu negocio.'
            },
            {
                title: '¿Cómo funcionan las Alertas de Crisis?',
                content: 'Si un cliente califica con 1 o 2 estrellas, el sistema detecta una "Crisis". Puede enviarte un correo o notificación al instante para que actúes rápido antes de que dejen una mala reseña pública.'
            }
        ]
    },
    {
        id: 'billing',
        title: 'Facturación y Planes',
        icon: CreditCard,
        color: 'text-emerald-400 bg-emerald-500/10',
        articles: [
            {
                title: '¿Cómo cancelo mi suscripción?',
                content: 'Puedes gestionar tu plan en Configuración > Suscripción. Ahí encontrarás un botón para acceder al portal de cliente y modificar o cancelar tu plan.'
            },
            {
                title: '¿Qué incluye el plan Pro?',
                content: 'El plan Pro incluye encuestas ilimitadas, análisis con Inteligencia Artificial, alertas de crisis y personalización avanzada de marca.'
            }
        ]
    },
    {
        id: 'staff',
        title: 'Buzón de Empleados',
        icon: MessageSquare,
        color: 'text-amber-400 bg-amber-500/10',
        articles: [
            {
                title: '¿El Buzón Staff es realmente anónimo?',
                content: 'Sí, 100%. No guardamos la IP, ni pedimos correo o nombre. Está diseñado para que tu equipo reporte problemas de mantenimiento o seguridad con total confianza.'
            }
        ]
    }
]

export default function KnowledgeBase() {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {CATEGORIES.map((cat) => (
                <div key={cat.id} className="bg-[#111] border border-white/5 rounded-2xl p-6 space-y-4">
                    <div className="flex items-center gap-3 mb-4">
                        <div className={`p-2 rounded-lg ${cat.color}`}>
                            <cat.icon className="w-5 h-5" />
                        </div>
                        <h3 className="font-bold text-lg">{cat.title}</h3>
                    </div>

                    <div className="space-y-3">
                        {cat.articles.map((article, idx) => (
                            <AccordionItem key={idx} title={article.title} content={article.content} />
                        ))}
                    </div>
                </div>
            ))}
        </div>
    )
}

function AccordionItem({ title, content }: { title: string, content: string }) {
    const [isOpen, setIsOpen] = useState(false)

    return (
        <div className="border border-white/5 bg-white/5 rounded-xl overflow-hidden transition-all">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between p-4 text-left hover:bg-white/5 transition"
            >
                <span className="text-sm font-medium text-gray-200">{title}</span>
                {isOpen ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
            </button>
            {isOpen && (
                <div className="p-4 pt-0 text-sm text-gray-400 leading-relaxed border-t border-white/5 mt-2">
                    {content}
                </div>
            )}
        </div>
    )
}
