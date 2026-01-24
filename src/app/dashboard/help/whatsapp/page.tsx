import { ArrowLeft, CheckCircle, ExternalLink, HelpCircle, MessageCircle } from 'lucide-react'
import Link from 'next/link'

export default function WhatsAppHelpPage() {
    return (
        <div className="min-h-screen bg-[#0a0a0a] text-white selection:bg-green-500/30">
            {/* Header */}
            <header className="border-b border-white/5 bg-black/20 backdrop-blur-xl sticky top-0 z-50">
                <nav className="max-w-4xl mx-auto px-6 py-4 flex items-center gap-4">
                    <Link href="/dashboard">
                        <button className="p-2 rounded-lg hover:bg-white/10 transition text-gray-400 hover:text-white">
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                    </Link>
                    <h1 className="text-xl font-bold flex items-center gap-2">
                        <HelpCircle className="w-6 h-6 text-green-500" />
                        Centro de Ayuda WhatsApp
                    </h1>
                </nav>
            </header>

            <main className="max-w-4xl mx-auto px-6 py-12 space-y-12">

                {/* Intro */}
                <div className="space-y-4">
                    <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-green-400 to-emerald-600">
                        Domina WhatsApp Business para tu Negocio
                    </h2>
                    <p className="text-gray-400 text-lg">
                        Aprende a utilizar las herramientas de WhatsApp Business para gestionar tus comunidades y mejorar la atención al cliente.
                    </p>
                </div>

                {/* Steps */}
                <div className="space-y-8">

                    {/* Step 1: Import Contacts */}
                    <div className="bg-white/5 border border-white/5 rounded-2xl p-8 flex gap-6">
                        <div className="flex-shrink-0 w-12 h-12 rounded-full bg-green-500/20 text-green-400 flex items-center justify-center font-bold text-xl border border-green-500/30">
                            1
                        </div>
                        <div className="space-y-4">
                            <h3 className="text-xl font-bold">Importa tus Contactos</h3>
                            <p className="text-gray-300">
                                Descarga el archivo <strong>.VCF</strong> desde nuestro Dashboard. Envíalo a tu celular (por email o el mismo WhatsApp) y ábrelo.
                                <br />
                                Tu teléfono te preguntará si quieres guardar los contactos. Confirma para tenerlos listos en tu agenda.
                            </p>
                        </div>
                    </div>

                    {/* Step 2: Labels */}
                    <div className="bg-white/5 border border-white/5 rounded-2xl p-8 flex gap-6">
                        <div className="flex-shrink-0 w-12 h-12 rounded-full bg-green-500/20 text-green-400 flex items-center justify-center font-bold text-xl border border-green-500/30">
                            2
                        </div>
                        <div className="space-y-4">
                            <h3 className="text-xl font-bold">Usa Etiquetas (Labels)</h3>
                            <p className="text-gray-300">
                                En WhatsApp Business, mantén presionado un chat o contacto y selecciona "Etiquetar chat".
                                <br />
                                Crea etiquetas como <span className="text-yellow-400 font-bold">"Cliente VIP"</span> o <span className="text-red-400 font-bold">"Pendiente Soporte"</span> para organizarlos visualmente.
                            </p>
                        </div>
                    </div>

                    {/* Step 3: Broadcast Lists */}
                    <div className="bg-white/5 border border-white/5 rounded-2xl p-8 flex gap-6">
                        <div className="flex-shrink-0 w-12 h-12 rounded-full bg-green-500/20 text-green-400 flex items-center justify-center font-bold text-xl border border-green-500/30">
                            3
                        </div>
                        <div className="space-y-4">
                            <h3 className="text-xl font-bold">Crea Listas de Difusión</h3>
                            <p className="text-gray-300">
                                Para enviar ofertas sin crear un grupo (donde todos ven los números de todos), usa <strong>Listas de Difusión</strong>.
                                <br />
                                Ve a <em>Chats {'>'} Listas de difusión {'>'} Nueva lista</em>. Selecciona los contactos que importaste y envía tu mensaje. Les llegará como un mensaje privado.
                            </p>
                        </div>
                    </div>

                    {/* Step 4: Groups */}
                    <div className="bg-white/5 border border-white/5 rounded-2xl p-8 flex gap-6">
                        <div className="flex-shrink-0 w-12 h-12 rounded-full bg-green-500/20 text-green-400 flex items-center justify-center font-bold text-xl border border-green-500/30">
                            4
                        </div>
                        <div className="space-y-4">
                            <h3 className="text-xl font-bold">Crea Grupos Exclusivos</h3>
                            <p className="text-gray-300">
                                Para tus <strong>Clientes VIP</strong>, crea un grupo donde puedan interactuar.
                                <br />
                                Ve a <em>Nuevo Grupo</em>, selecciona los participantes y configura los permisos para que solo los administradores puedan enviar mensajes si deseas usarlo solo para anuncios.
                            </p>
                        </div>
                    </div>

                    {/* Pro Tip */}
                    <div className="bg-gradient-to-br from-blue-500/10 to-indigo-500/10 border border-blue-500/20 rounded-2xl p-8 flex gap-6">
                        <div className="flex-shrink-0 w-12 h-12 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-xl border border-blue-500/30">
                            <MessageCircle className="w-6 h-6" />
                        </div>
                        <div className="space-y-4">
                            <h3 className="text-xl font-bold text-blue-400">Tip Pro: Enlaces de Invitación</h3>
                            <p className="text-gray-300">
                                No necesitas agregar a todos manualmente. En la info del grupo, busca <strong>"Enlace de invitación"</strong>.
                                <br />
                                Copia ese link y envíalo automáticamente a tus clientes satisfechos al finalizar la encuesta (podemos configurar esto en el futuro).
                            </p>
                        </div>
                    </div>

                </div>
            </main>
        </div>
    )
}
