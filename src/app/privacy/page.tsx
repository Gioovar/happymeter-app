import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export const metadata = {
    title: 'Política de Privacidad | HappyMeter & Happy RPS',
    description: 'Política de privacidad de HappyMeter y la aplicación Happy RPS desarrollada por HappyMeter.',
}

export default function PrivacyPage() {
    return (
        <div className="min-h-screen bg-[#0a0a0a] text-white font-sans selection:bg-violet-500/30">
            <div className="max-w-4xl mx-auto px-6 py-12">
                <Link href="/" className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-8 transition">
                    <ArrowLeft className="w-4 h-4" /> Volver al Inicio
                </Link>

                <h1 className="text-4xl font-bold mb-2 text-white">Política de Privacidad</h1>
                <p className="text-gray-400 mb-2">Aplicación: <strong className="text-white">Happy RPS</strong> y plataforma <strong className="text-white">HappyMeter</strong></p>
                <p className="text-gray-400 mb-2">Desarrollador / Empresa: <strong className="text-white">HappyMeter</strong></p>
                <p className="text-gray-500 mb-10 text-sm">Última actualización: 11 de abril de 2025</p>

                <div className="space-y-10 text-gray-300 leading-relaxed">

                    <section>
                        <h2 className="text-xl font-bold text-white mb-3">1. Introducción</h2>
                        <p>
                            Esta Política de Privacidad describe cómo <strong className="text-white">HappyMeter</strong> ("nosotros", "nuestro" o "la empresa") recopila, usa y protege la información personal de los usuarios de la aplicación <strong className="text-white">Happy RPS</strong> y de la plataforma web <strong className="text-white">HappyMeter</strong> (disponible en <span className="text-violet-400">https://www.happymeters.com</span>).
                        </p>
                        <p className="mt-3">
                            Al usar cualquiera de nuestros servicios, aceptas las prácticas descritas en esta política.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-white mb-3">2. Información que Recopilamos</h2>
                        <p className="mb-3">Recopilamos los siguientes tipos de información:</p>
                        <ul className="list-disc pl-5 space-y-2">
                            <li><strong className="text-white">Información de registro:</strong> Nombre completo, número de teléfono, correo electrónico y fotografía de perfil (opcional) al crear una cuenta en Happy RPS o HappyMeter.</li>
                            <li><strong className="text-white">Datos de actividad:</strong> Reservaciones generadas, asistentes confirmados, comisiones y estadísticas de desempeño dentro de la aplicación Happy RPS.</li>
                            <li><strong className="text-white">Información financiera:</strong> Número de cuenta bancaria o CLABE para el procesamiento de pagos y comisiones (almacenado de forma segura, nunca compartido con terceros sin consentimiento).</li>
                            <li><strong className="text-white">Datos de uso:</strong> Cómo interactúas con nuestra plataforma, páginas visitadas, funciones utilizadas y frecuencia de uso.</li>
                            <li><strong className="text-white">Datos del dispositivo:</strong> Tipo de dispositivo, sistema operativo y versión de la aplicación para brindarte soporte técnico.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-white mb-3">3. Cómo Usamos tu Información</h2>
                        <p>Utilizamos la información recopilada para:</p>
                        <ul className="list-disc pl-5 space-y-2 mt-3">
                            <li>Proveer, operar y mejorar la aplicación <strong className="text-white">Happy RPS</strong> y la plataforma <strong className="text-white">HappyMeter</strong>.</li>
                            <li>Gestionar tu perfil de Promotor de Relaciones Públicas (RP) y tu billetera de comisiones.</li>
                            <li>Procesar y registrar reservaciones y pagos de comisiones.</li>
                            <li>Enviarte notificaciones relacionadas con tu cuenta y actividad.</li>
                            <li>Calcular tu nivel de gamificación y ranking dentro del sistema.</li>
                            <li>Brindar soporte técnico y atención al cliente.</li>
                            <li>Cumplir con obligaciones legales aplicables.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-white mb-3">4. Compartir Información con Terceros</h2>
                        <p>
                            No vendemos ni alquilamos tu información personal a terceros. Podemos compartir datos en los siguientes casos limitados:
                        </p>
                        <ul className="list-disc pl-5 space-y-2 mt-3">
                            <li><strong className="text-white">Proveedores de servicio:</strong> Empresas que nos ayudan a operar la plataforma (ej. almacenamiento en la nube, procesamiento de pagos), sujetos a acuerdos de confidencialidad.</li>
                            <li><strong className="text-white">Negocios asociados:</strong> Los establecimientos (sucursales) con los que trabajas dentro de la plataforma pueden ver tus estadísticas de desempeño relevantes a tu rol.</li>
                            <li><strong className="text-white">Obligaciones legales:</strong> Cuando sea requerido por ley, orden judicial o autoridades competentes.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-white mb-3">5. Seguridad de los Datos</h2>
                        <p>
                            Implementamos medidas de seguridad técnicas y organizativas para proteger tu información contra acceso no autorizado, pérdida o alteración. Sin embargo, ningún sistema de transmisión de datos en internet es 100% seguro, por lo que no podemos garantizar seguridad absoluta.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-white mb-3">6. Retención de Datos</h2>
                        <p>
                            Conservamos tu información mientras tu cuenta esté activa o según sea necesario para proporcionar los servicios. Puedes solicitar la eliminación de tu cuenta y datos en cualquier momento a través de nuestra sección de soporte o enviando un correo a <span className="text-violet-400">privacidad@happymeter.com</span>.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-white mb-3">7. Tus Derechos</h2>
                        <p>Como usuario tienes derecho a:</p>
                        <ul className="list-disc pl-5 space-y-2 mt-3">
                            <li>Acceder a la información personal que tenemos sobre ti.</li>
                            <li>Corregir datos inexactos o incompletos.</li>
                            <li>Solicitar la eliminación de tu cuenta y datos personales.</li>
                            <li>Retirar tu consentimiento en cualquier momento.</li>
                        </ul>
                        <p className="mt-3">Para ejercer estos derechos, contáctanos en <span className="text-violet-400">privacidad@happymeter.com</span>.</p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-white mb-3">8. Cookies y Tecnologías Similares</h2>
                        <p>
                            Utilizamos cookies y tecnologías similares para autenticación de sesiones, preferencias del usuario y análisis de uso de la plataforma. Puedes controlar el uso de cookies desde la configuración de tu navegador.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-white mb-3">9. Menores de Edad</h2>
                        <p>
                            Nuestros servicios no están dirigidos a personas menores de 18 años. No recopilamos conscientemente información de menores de edad.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-white mb-3">10. Cambios a esta Política</h2>
                        <p>
                            Podemos actualizar esta política periódicamente. Te notificaremos sobre cambios significativos a través de la aplicación o por correo electrónico. El uso continuo de la aplicación <strong className="text-white">Happy RPS</strong> o la plataforma <strong className="text-white">HappyMeter</strong> después de los cambios implica tu aceptación.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-white mb-3">11. Contacto</h2>
                        <p>Si tienes preguntas o inquietudes sobre esta Política de Privacidad, contacta a:</p>
                        <div className="mt-4 p-4 bg-white/5 border border-white/10 rounded-xl space-y-1">
                            <p><strong className="text-white">Empresa:</strong> HappyMeter</p>
                            <p><strong className="text-white">Aplicación:</strong> Happy RPS</p>
                            <p><strong className="text-white">Correo:</strong> <span className="text-violet-400">privacidad@happymeter.com</span></p>
                            <p><strong className="text-white">Sitio web:</strong> <span className="text-violet-400">https://www.happymeters.com</span></p>
                        </div>
                    </section>

                </div>
            </div>
        </div>
    )
}
