import { X, BookOpen, BarChart3, Plus, FileText, Lightbulb, ArrowRight } from 'lucide-react'
import { useState } from 'react'

interface HelpModalProps {
    isOpen: boolean
    onClose: () => void
}

export default function HelpModal({ isOpen, onClose }: HelpModalProps) {
    const [activeTab, setActiveTab] = useState<'start' | 'data' | 'manual'>('start')

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-[#0a0a0a] border border-white/10 w-full max-w-4xl h-[80vh] rounded-2xl shadow-2xl flex overflow-hidden relative">

                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 rounded-full bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition z-10"
                >
                    <X className="w-5 h-5" />
                </button>

                {/* Sidebar Navigation */}
                <div className="w-64 bg-white/5 border-r border-white/5 p-6 flex flex-col gap-2">
                    <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                        <BookOpen className="w-6 h-6 text-violet-500" />
                        Centro de Ayuda
                    </h2>

                    <button
                        onClick={() => setActiveTab('start')}
                        className={`text-left px-4 py-3 rounded-xl text-sm font-medium transition flex items-center gap-3 ${activeTab === 'start' ? 'bg-violet-600 text-white' : 'text-gray-400 hover:bg-white/5 hover:text-white'
                            }`}
                    >
                        <Plus className="w-4 h-4" />
                        Cómo Crear Encuestas
                    </button>

                    <button
                        onClick={() => setActiveTab('data')}
                        className={`text-left px-4 py-3 rounded-xl text-sm font-medium transition flex items-center gap-3 ${activeTab === 'data' ? 'bg-violet-600 text-white' : 'text-gray-400 hover:bg-white/5 hover:text-white'
                            }`}
                    >
                        <BarChart3 className="w-4 h-4" />
                        Valor de los Datos
                    </button>

                    <button
                        onClick={() => setActiveTab('manual')}
                        className={`text-left px-4 py-3 rounded-xl text-sm font-medium transition flex items-center gap-3 ${activeTab === 'manual' ? 'bg-violet-600 text-white' : 'text-gray-400 hover:bg-white/5 hover:text-white'
                            }`}
                    >
                        <FileText className="w-4 h-4" />
                        Manual de Secciones
                    </button>
                </div>

                {/* Content Area */}
                <div className="flex-1 p-8 overflow-y-auto">
                    {activeTab === 'start' && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="mb-8">
                                <h3 className="text-2xl font-bold mb-2">Guía Rápida: Tu Primera Encuesta</h3>
                                <p className="text-gray-400">Aprende a configurar una encuesta efectiva en menos de 2 minutos.</p>
                            </div>

                            <div className="grid gap-4">
                                <div className="p-4 rounded-xl bg-white/5 border border-white/5 flex gap-4">
                                    <div className="w-8 h-8 rounded-full bg-violet-500/20 text-violet-400 flex items-center justify-center font-bold shrink-0">1</div>
                                    <div>
                                        <h4 className="font-bold text-white mb-1">Inicia el Proceso</h4>
                                        <p className="text-sm text-gray-400">Haz clic en el botón "Nueva Encuesta" en el dashboard principal o en la tarjeta de creación rápida.</p>
                                    </div>
                                </div>
                                <div className="p-4 rounded-xl bg-white/5 border border-white/5 flex gap-4">
                                    <div className="w-8 h-8 rounded-full bg-violet-500/20 text-violet-400 flex items-center justify-center font-bold shrink-0">2</div>
                                    <div>
                                        <h4 className="font-bold text-white mb-1">Personaliza tu Marca</h4>
                                        <p className="text-sm text-gray-400">Sube tu logotipo y define el nombre de tu sucursal. Esto genera confianza en el cliente.</p>
                                    </div>
                                </div>
                                <div className="p-4 rounded-xl bg-white/5 border border-white/5 flex gap-4">
                                    <div className="w-8 h-8 rounded-full bg-violet-500/20 text-violet-400 flex items-center justify-center font-bold shrink-0">3</div>
                                    <div>
                                        <h4 className="font-bold text-white mb-1">Define las Preguntas</h4>
                                        <p className="text-sm text-gray-400">Selecciona qué aspectos quieres evaluar: Servicio, Comida, Ambiente, etc. Mantén la encuesta corta (menos de 5 preguntas) para mayor conversión.</p>
                                    </div>
                                </div>
                                <div className="p-4 rounded-xl bg-white/5 border border-white/5 flex gap-4">
                                    <div className="w-8 h-8 rounded-full bg-violet-500/20 text-violet-400 flex items-center justify-center font-bold shrink-0">4</div>
                                    <div>
                                        <h4 className="font-bold text-white mb-1">Genera el QR</h4>
                                        <p className="text-sm text-gray-400">Al finalizar, obtendrás un código QR único. Imprímelo y colócalo en las mesas o en la cuenta.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'data' && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="mb-8">
                                <h3 className="text-2xl font-bold mb-2">El Valor de tus Datos</h3>
                                <p className="text-gray-400">Entiende por qué cada métrica es crucial para la rentabilidad de tu negocio.</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="p-5 rounded-xl bg-gradient-to-br from-blue-900/20 to-cyan-900/20 border border-blue-500/20">
                                    <div className="flex items-center gap-2 mb-3">
                                        <Lightbulb className="w-5 h-5 text-blue-400" />
                                        <h4 className="font-bold text-blue-100">NPS (Net Promoter Score)</h4>
                                    </div>
                                    <p className="text-sm text-gray-300">Mide la lealtad. Un cliente promotor (9-10) gasta un <strong>30% más</strong> y trae nuevos clientes gratis. Identificarlos es oro puro.</p>
                                </div>

                                <div className="p-5 rounded-xl bg-gradient-to-br from-green-900/20 to-emerald-900/20 border border-green-500/20">
                                    <div className="flex items-center gap-2 mb-3">
                                        <BarChart3 className="w-5 h-5 text-green-400" />
                                        <h4 className="font-bold text-green-100">Tasa de Respuesta</h4>
                                    </div>
                                    <p className="text-sm text-gray-300">Indica el "engagement". Si es baja (menos del 5%), tus meseros no están ofreciendo la encuesta o el incentivo no es atractivo.</p>
                                </div>

                                <div className="p-5 rounded-xl bg-gradient-to-br from-purple-900/20 to-pink-900/20 border border-purple-500/20">
                                    <div className="flex items-center gap-2 mb-3">
                                        <FileText className="w-5 h-5 text-purple-400" />
                                        <h4 className="font-bold text-purple-100">Comentarios de Texto</h4>
                                    </div>
                                    <p className="text-sm text-gray-300">La IA analiza esto para detectar patrones ocultos. Ejemplo: "La música está alta" repetido 5 veces es una acción correctiva inmediata.</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'manual' && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="mb-6">
                                <h3 className="text-2xl font-bold mb-2">Manual de Secciones</h3>
                                <p className="text-gray-400">Para qué sirve cada herramienta de tu dashboard.</p>
                            </div>

                            <div className="space-y-6">
                                <section>
                                    <h4 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                                        <span className="w-2 h-2 rounded-full bg-violet-500" />
                                        Reportes AI
                                    </h4>
                                    <p className="text-sm text-gray-400 pl-4 border-l-2 border-white/5 ml-1">
                                        Esta es tu consultora virtual. No solo te da gráficas, sino que <strong>genera planes de acción</strong>. Úsala semanalmente para ver tendencias y pedirle a "Giovar" (tu asistente IA) estrategias específicas para subir ventas o mejorar servicio.
                                    </p>
                                </section>

                                <section>
                                    <h4 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                                        <span className="w-2 h-2 rounded-full bg-pink-500" />
                                        Campañas de Marketing
                                    </h4>
                                    <p className="text-sm text-gray-400 pl-4 border-l-2 border-white/5 ml-1">
                                        Reactiva clientes antiguos. Si un cliente dejó su correo hace 3 meses y no ha vuelto, usa esta sección para enviarle un cupón automático de "Te extrañamos". Es 5 veces más barato retener que adquirir.
                                    </p>
                                </section>

                                <section>
                                    <h4 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                                        <span className="w-2 h-2 rounded-full bg-green-500" />
                                        Gestor de WhatsApp
                                    </h4>
                                    <p className="text-sm text-gray-400 pl-4 border-l-2 border-white/5 ml-1">
                                        Envía las encuestas directamente al WhatsApp del cliente si tienes su número (ej. pedidos a domicilio). Tiene una tasa de apertura del 98%, muy superior al email.
                                    </p>
                                </section>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
