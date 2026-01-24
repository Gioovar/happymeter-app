import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function TermsPage() {
    return (
        <div className="min-h-screen bg-[#0a0a0a] text-white font-sans selection:bg-violet-500/30">
            <div className="max-w-4xl mx-auto px-6 py-12">
                <Link href="/" className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-8 transition">
                    <ArrowLeft className="w-4 h-4" /> Volver al Inicio
                </Link>

                <h1 className="text-4xl font-bold mb-8 text-white">Términos y Condiciones</h1>
                <p className="text-gray-400 mb-8">Última actualización: {new Date().toLocaleDateString()}</p>

                <div className="space-y-8 text-gray-300 leading-relaxed">
                    <section>
                        <h2 className="text-xl font-bold text-white mb-4">1. Aceptación de los Términos</h2>
                        <p>
                            Al acceder y utilizar HappyMeter, aceptas cumplir con estos términos y condiciones. Si no estás de acuerdo con alguna parte de estos términos, no podrás utilizar nuestros servicios.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-white mb-4">2. Descripción del Servicio</h2>
                        <p>
                            HappyMeter proporciona herramientas para la recolección, análisis y gestión de feedback de clientes a través de encuestas digitales, inteligencia artificial y dashboards de análisis.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-white mb-4">3. Cuentas y Suscripciones</h2>
                        <ul className="list-disc pl-5 space-y-2">
                            <li>Debes proporcionar información precisa y completa al crear tu cuenta.</li>
                            <li>Eres responsable de mantener la seguridad de tu contraseña.</li>
                            <li>Las suscripciones se facturan por adelantado y se renuevan automáticamente salvo cancelación.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-white mb-4">4. Propiedad Intelectual</h2>
                        <p>
                            El servicio y su contenido original, características y funcionalidad son propiedad exclusiva de HappyMeter y están protegidos por leyes de derechos de autor internacionales.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-white mb-4">5. Limitación de Responsabilidad</h2>
                        <p>
                            HappyMeter no será responsable por daños indirectos, incidentales, especiales, consecuentes o punitivos, incluyendo pérdida de beneficios, datos u otras pérdidas intangibles.
                        </p>
                    </section>
                </div>
            </div>
        </div>
    )
}
