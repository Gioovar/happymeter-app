import { Button } from "@/components/ui/button";
import { ArrowLeft, Edit } from "lucide-react";
import Link from "next/link";

export default function PrivacyPage() {
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
                    <h1 className="text-4xl font-bold tracking-tight">Política de Privacidad</h1>
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
                        En Happy Platform Inc. ("nosotros", "nuestro" o "la Plataforma"), operadora de Happy OPS, Happy Hostess, Happy RPS y Happy Loyalty, está comprometida con la protección de su privacidad y el manejo responsable de su información personal.
                    </p>
                </section>

                <section className="space-y-4">
                    <h2 className="text-2xl font-semibold border-b pb-2">1. Qué datos recopilamos</h2>
                    <p>
                        Recopilamos la información estrictamente necesaria para brindar nuestros servicios operativos y de reservaciones:
                    </p>
                    <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                        <li><strong>Datos de cuenta y perfil:</strong> Nombre, correo electrónico, número de teléfono y fotografía de perfil (si se proporciona).</li>
                        <li><strong>Datos de reservaciones:</strong> Historial de visitas, cancelaciones, número de personas por reservación y preferencias operativas de las sucursales.</li>
                        <li><strong>Datos operativos y financieros:</strong> Para los usuarios de Happy RPS, recopilamos información de comisiones, balances y retiros, los cuales pueden ser resguardados hasta por 5 años por motivos de auditoría.</li>
                        <li><strong>Datos del dispositivo:</strong> Información técnica sobre el dispositivo utilizado, identificadores publicitarios genéricos y tokens de notificaciones push para proveer alertas importantes.</li>
                    </ul>
                </section>

                <section className="space-y-4">
                    <h2 className="text-2xl font-semibold border-b pb-2">2. Uso de la Información</h2>
                    <p>La información recopilada es utilizada para:</p>
                    <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                        <li>Facilitar y confirmar la creación de reservaciones y check-ins en los establecimientos aliados.</li>
                        <li>Administrar y liquidar pagos de comisiones a los Promotores (RPS).</li>
                        <li>Proveer soporte técnico y responder a dudas operativas.</li>
                        <li>Detectar, prevenir e investigar actividades fraudulentas o violaciones de nuestros Términos de Servicio.</li>
                    </ul>
                </section>

                <section className="space-y-4">
                    <h2 className="text-2xl font-semibold border-b pb-2">3. Compartición de datos con terceros</h2>
                    <p className="text-muted-foreground">
                        No vendemos, rentamos ni comercializamos sus datos personales. Sus datos operacionales únicamente se comparten de manera encriptada con:
                    </p>
                    <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                        <li><strong>Establecimientos u Operativas Restaruanteras:</strong> Sus datos de nombre y contacto se comparten con el lugar donde ha realizado una reservación, exclusivamente para efectos de control de su llegada (Hostess).</li>
                        <li><strong>Proveedores de Servicio Técnico:</strong> Infraestructuras de nube y bases de datos certificadas que operan la estabilidad técnica de Happy, estrictamente bajo acuerdos vinculantes de confidencialidad.</li>
                    </ul>
                </section>

                <section className="space-y-4">
                    <h2 className="text-2xl font-semibold border-b pb-2">4. Sus Derechos de Privacidad</h2>
                    <p className="text-muted-foreground">
                        Bajo las normativas globales de privacidad, usted tiene el derecho absoluto a acceder, rectificar, portar o solicitar la eliminación total de sus datos almacenados.
                    </p>
                    <p className="text-muted-foreground">
                        Para ejercer su derecho a la supresión de datos y el cierre de su cuenta, diríjase a nuestro portal automatizado de <Link href="/support/delete-account" className="text-primary hover:underline">Eliminación de Cuenta</Link> o contacte a nuestro equipo de privacidad en <a href="mailto:soporte@happy.com" className="text-primary hover:underline">soporte@happy.com</a>.
                    </p>
                </section>
            </div>
        </div>
    );
}
