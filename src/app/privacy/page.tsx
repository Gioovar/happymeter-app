import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function PrivacyPage() {
    return (
        <div className="min-h-screen bg-[#0a0a0a] text-white font-sans selection:bg-violet-500/30">
            <div className="max-w-4xl mx-auto px-6 py-12">
                <Link href="/" className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-8 transition">
                    <ArrowLeft className="w-4 h-4" /> Volver al Inicio
                </Link>

                <h1 className="text-4xl font-bold mb-8 text-white">Política de Privacidad</h1>
                <p className="text-gray-400 mb-8">Última actualización: {new Date().toLocaleDateString()}</p>

                <div className="space-y-8 text-gray-300 leading-relaxed">
                    <section>
                        <h2 className="text-xl font-bold text-white mb-4">1. Recolección de Información</h2>
                        <p>
                            Recolectamos información que nos proporcionas directamente al registrarte, como tu nombre, correo electrónico y datos de facturación. También recolectamos datos de uso y feedback de tus clientes a través de las encuestas.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-white mb-4">2. Uso de la Información</h2>
                        <p>Utilizamos la información para:</p>
                        <ul className="list-disc pl-5 space-y-2 mt-2">
                            <li>Proveer, mantener y mejorar nuestros servicios.</li>
                            <li>Procesar transacciones y enviar notificaciones relacionadas.</li>
                            <li>Analizar tendencias y comportamiento para mejorar la experiencia.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-white mb-4">3. Protección de Datos</h2>
                        <p>
                            Implementamos medidas de seguridad diseñadas para proteger tu información contra acceso no autorizado, alteración o destrucción. Tus datos y los de tus clientes son confidenciales.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-white mb-4">4. Cookies</h2>
                        <p>
                            Utilizamos cookies y tecnologías similares para mejorar la navegación, recordar tus preferencias y entender cómo interactúas con nuestro sitio.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-white mb-4">5. Contacto</h2>
                        <p>
                            Si tienes preguntas sobre esta política, contáctanos en <span className="text-violet-400">privacidad@happymeter.com</span>.
                        </p>
                    </section>
                </div>
            </div>
        </div>
    )
}
