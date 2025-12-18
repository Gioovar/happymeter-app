import { ArrowLeft, CheckCircle, ExternalLink, HelpCircle, Smartphone, Printer, QrCode } from 'lucide-react'
import Link from 'next/link'

export default function QRHelpPage() {
    return (
        <div className="min-h-screen bg-[#0a0a0a] text-white selection:bg-violet-500/30">
            {/* Header */}
            <header className="border-b border-white/5 bg-black/20 backdrop-blur-xl sticky top-0 z-50">
                <nav className="max-w-4xl mx-auto px-6 py-4 flex items-center gap-4">
                    <Link href="/dashboard">
                        <button className="p-2 rounded-lg hover:bg-white/10 transition text-gray-400 hover:text-white">
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                    </Link>
                    <h1 className="text-xl font-bold flex items-center gap-2">
                        <QrCode className="w-6 h-6 text-violet-500" />
                        Guía de Códigos QR
                    </h1>
                </nav>
            </header>

            <main className="max-w-4xl mx-auto px-6 py-12 space-y-12">

                {/* Intro */}
                <div className="space-y-4">
                    <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-violet-400 to-fuchsia-600">
                        Conecta el Mundo Físico con tu Encuesta
                    </h2>
                    <p className="text-gray-400 text-lg">
                        Los códigos QR son la forma más rápida para que tus clientes accedan a tu encuesta sin escribir nada. Aquí te enseñamos cómo usarlos.
                    </p>
                </div>

                {/* Steps */}
                <div className="space-y-8">

                    {/* Use Case 1: Mobile */}
                    <div className="bg-white/5 border border-white/5 rounded-2xl p-8 flex gap-6">
                        <div className="flex-shrink-0 w-12 h-12 rounded-full bg-violet-500/20 text-violet-400 flex items-center justify-center font-bold text-xl border border-violet-500/30">
                            <Smartphone className="w-6 h-6" />
                        </div>
                        <div className="space-y-4">
                            <h3 className="text-xl font-bold">Para Celular (Redes Sociales)</h3>
                            <p className="text-gray-300">
                                La opción <strong>"Para Celular"</strong> descarga una imagen vertical diseñada profesionalmente.
                                <br /><br />
                                <strong>Dónde usarla:</strong>
                                <ul className="list-disc list-inside mt-2 space-y-1 text-gray-400">
                                    <li>Estados de WhatsApp</li>
                                    <li>Historias de Instagram / Facebook</li>
                                    <li>Enviarla por chat directo a clientes</li>
                                </ul>
                            </p>
                        </div>
                    </div>

                    {/* Use Case 2: Print */}
                    <div className="bg-white/5 border border-white/5 rounded-2xl p-8 flex gap-6">
                        <div className="flex-shrink-0 w-12 h-12 rounded-full bg-violet-500/20 text-violet-400 flex items-center justify-center font-bold text-xl border border-violet-500/30">
                            <Printer className="w-6 h-6" />
                        </div>
                        <div className="space-y-4">
                            <h3 className="text-xl font-bold">Para Impresión (Diseñadores)</h3>
                            <p className="text-gray-300">
                                La opción <strong>"Para Impresión"</strong> te da el código QR limpio en alta calidad (PNG transparente o fondo blanco).
                                <br /><br />
                                <strong>Ideas para imprimir:</strong>
                                <ul className="list-disc list-inside mt-2 space-y-1 text-gray-400">
                                    <li>Stickers para pegar en las mesas</li>
                                    <li>Tarjetas de presentación que entregas con la cuenta</li>
                                    <li>Pósters en la entrada o caja</li>
                                    <li>Menús impresos</li>
                                </ul>
                            </p>
                        </div>
                    </div>

                    {/* Pro Tip */}
                    <div className="bg-gradient-to-br from-fuchsia-500/10 to-pink-500/10 border border-fuchsia-500/20 rounded-2xl p-8 flex gap-6">
                        <div className="flex-shrink-0 w-12 h-12 rounded-full bg-fuchsia-500/20 text-fuchsia-400 flex items-center justify-center font-bold text-xl border border-fuchsia-500/30">
                            <CheckCircle className="w-6 h-6" />
                        </div>
                        <div className="space-y-4">
                            <h3 className="text-xl font-bold text-fuchsia-400">Tip Pro: Incentivos</h3>
                            <p className="text-gray-300">
                                Coloca un pequeño texto debajo de tu QR impreso:
                                <br />
                                <em>"Escanea y recibe un postre gratis en tu próxima visita"</em>.
                                <br />
                                Esto aumenta drásticamente la tasa de respuesta.
                            </p>
                        </div>
                    </div>

                </div>
            </main>
        </div>
    )
}
