import { Button } from "@/components/ui/button";
import { ArrowLeft, Edit } from "lucide-react";
import Link from "next/link";

export default function TermsPage() {
    const lastUpdated = "Mayo 2026";

    return (
        <div className="container mx-auto px-6 py-12 max-w-4xl">
            <div className="mb-8">
                <Button variant="ghost" asChild className="mb-6 -ml-4">
                    <Link href="/support" className="flex items-center text-muted-foreground">
                        <ArrowLeft className="mr-2 h-4 w-4" /> Volver al Centro de Soporte
                    </Link>
                </Button>
                <div className="flex items-center justify-between mb-4">
                    <h1 className="text-4xl font-bold tracking-tight">Términos y Condiciones de Uso</h1>
                    <Button variant="outline" size="sm" className="hidden sm:flex">
                        <Edit className="h-4 w-4 mr-2" /> Descargar PDF
                    </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                    Última actualización: {lastUpdated}
                </p>
            </div>

            <div className="prose prose-slate dark:prose-invert max-w-none space-y-8">
                <section>
                    <p className="text-lg leading-relaxed text-muted-foreground">
                        Bienvenido a las plataformas operativas ("Happy", "nosotros" o "nuestra"). Este acuerdo rige el acceso y uso de las aplicaciones Happy OPS, Happy Hostess, Happy RPS, y el sistema de puntos Happy Loyalty. Lea detenidamente estos Términos, ya que constituyen un acuerdo vinculante.
                    </p>
                </section>

                <section className="space-y-4">
                    <h2 className="text-2xl font-semibold border-b pb-2">1. Uso Permitido</h2>
                    <p className="text-muted-foreground">Happy es un ecosistema tecnológico diseñado para la gestión de reservaciones, fidelización de clientes, control operativo de establecimientos y administración de promotores. Su uso debe ceñirse a propósitos lícitos y respetar las normas operativas establecidas.</p>
                </section>

                <section className="space-y-4">
                    <h2 className="text-2xl font-semibold border-b pb-2">2. Naturaleza del Servicio</h2>
                    <p className="text-muted-foreground">
                        <strong>Declaramos expresamente que la Plataforma es únicamente una herramienta tecnológica:</strong> Nosotros proporcionamos el software para la gestión de reservaciones, personal y recompensas de lealtad. No somos propietarios de los establecimientos, restaurantes o bares en la aplicación y por ende, <strong>no somos responsables por retrasos, negaciones de servicio, políticas de acceso, precios de menús o calidad de productos</strong> decididas por terceros establecimientos de manera ajena.
                    </p>
                </section>

                <section className="space-y-4">
                    <h2 className="text-2xl font-semibold border-b pb-2">3. Responsabilidades del Promotor (RPS)</h2>
                    <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                        <li><strong>Obligaciones:</strong> Los Promotores deben utilizar las herramientas de marketing, QR y enlaces de referidos de manera ética, en cumplimiento estricto con las políticas antispam y reglamentos comerciales locales.</li>
                        <li><strong>Comisiones:</strong> Las políticas de comisiones, balances mínimos de retiro y pagos, se rigen por los establecimientos dueños de la campaña. Happy facilita la tecnología e interfaz financiera, pero la liquidación final puede sujetarse a políticas contables del recinto o dueño final.</li>
                    </ul>
                </section>

                <section className="space-y-4">
                    <h2 className="text-2xl font-semibold border-b pb-2">4. Suspensión o Cierre de Cuentas</h2>
                    <p className="text-muted-foreground">Nos reservamos el derecho de desactivar o cancelar cuentas, sin previo aviso, cuando detectemos:</p>
                    <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                        <li>Creación intencional de cuentas o reservas fraudulentas (spam/bots).</li>
                        <li>Violaciones de seguridad para manipular el conteo de puntos (Loyalty) o reservas cobrables (RPS).</li>
                        <li>Inactividad prolongada y falta de respuesta a avisos operativos previos.</li>
                    </ul>
                </section>

                <section className="space-y-4">
                    <h2 className="text-2xl font-semibold border-b pb-2">5. Limitación de Responsabilidad</h2>
                    <p className="text-muted-foreground">La Plataforma se provee "tal cual" (As-Is). En la medida máxima permitida por la ley, Happy Platform Inc. no garantiza disponibilidad ininterrumpida, ni será responsable de lucro cesante a usuarios debido a mantenimientos programados, fallas de internet de proveedores externos o eventos de fuerza mayor.</p>
                </section>
            </div>
        </div>
    );
}
