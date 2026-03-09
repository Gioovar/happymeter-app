import { FaqAccordion } from "@/components/support/FaqAccordion";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function FaqPage() {
    const accountFaqs = [
        {
            question: "¿Cómo contactar soporte si tengo problemas con mi cuenta?",
            answer: "Puedes comunicarte con nosotros directamente desde la aplicación yendo a Configuración > Ayuda, o enviando un correo a soporte@happy.com. Nuestro tiempo de respuesta es de 24 a 48 horas en días hábiles.",
        },
        {
            question: "¿Cómo puedo solicitar la eliminación de mi cuenta y mis datos?",
            answer: "Por respeto a tu privacidad, puedes solicitar la eliminación permanente de tu cuenta y de toda tu información en cualquier momento. \n\nPara hacerlo, visita la nuestra página de 'Eliminar mi cuenta' ubicada en el pie de página o directamente en https://happymeters.com/support/delete-account. Allí encontrarás el formulario de solicitud. El proceso puede tomar hasta 15 días hábiles en completarse.",
        },
    ];

    const reservationFaqs = [
        {
            question: "¿Cómo crear una reservación en el sistema?",
            answer: "Desde Happy Hostess o Happy OPS, selecciona la zona o mesa deseada, haz clic en el botón '+' o 'Nueva Reserva', e ingresa los datos del cliente (Nombre, Teléfono, Número de personas). Al guardar, el cliente recibirá una confirmación vía SMS o WhatsApp si el servicio está activado.",
        },
        {
            question: "¿Cómo modificar los asistentes de una reservación?",
            answer: "Abre el detalle de la reservación desde la pantalla principal de la aplicación. Haz clic en el ícono de edición junto al número de asistentes, ingresa la nueva cantidad y guarda los cambios. El sistema actualizará automáticamente la disponibilidad de la zona.",
        },
        {
            question: "¿Cómo escanear un código QR de un cliente?",
            answer: "En ambas aplicaciones (RPS y Hostess), encontrarás un botón de 'Escanear QR' en la parte inferior o superior de la pantalla. Dales permiso a la cámara e intenta que el código del cliente esté bien iluminado dentro del recuadro.",
        },
    ];

    const rpFaqs = [
        {
            question: "¿Cómo funcionan las comisiones de RPs?",
            answer: "Las comisiones se generan automáticamente cuando un cliente que reservó a través de tu enlace de RP o código QR asiste al establecimiento y realiza un consumo. Puedes ver el balance acumulado y el historial en la sección 'Wallet' o 'Mis Ganancias' dentro de la aplicación.",
        },
        {
            question: "¿Cómo ver los reportes de ingresos y analíticas?",
            answer: "Los administradores y dueños pueden acceder a reportes detallados desde el panel principal de Happy OPS o la versión web. Dirígete a la pestaña 'Reportes', donde podrás filtrar por fechas, zonas y promotores para analizar el rendimiento del negocio.",
        },
    ];

    return (
        <div className="container mx-auto px-6 py-12 max-w-4xl">
            <div className="mb-8">
                <Button variant="ghost" asChild className="mb-6 -ml-4">
                    <Link href="/support" className="flex items-center text-muted-foreground">
                        <ArrowLeft className="mr-2 h-4 w-4" /> Volver al Centro de Soporte
                    </Link>
                </Button>
                <h1 className="text-4xl font-bold tracking-tight mb-4">Preguntas Frecuentes</h1>
                <p className="text-lg text-muted-foreground">
                    Encuentra respuestas a las dudas comunes sobre el uso de la plataforma Happy y nuestras aplicaciones.
                </p>
            </div>

            <div className="space-y-12">
                <FaqAccordion
                    category="1. Gestión de Reservaciones y Operaciones (OPS & Hostess)"
                    items={reservationFaqs}
                />

                <FaqAccordion
                    category="2. Promotores y Ganancias (RPS)"
                    items={rpFaqs}
                />

                <FaqAccordion
                    category="3. Cuenta y Privacidad"
                    items={accountFaqs}
                />

                <div className="mt-12 p-6 bg-muted/50 rounded-2xl border text-center">
                    <h3 className="text-lg font-semibold mb-2">¿No encuentras lo que buscas?</h3>
                    <p className="text-muted-foreground mb-6">Estamos aquí para ayudarte. Ponte en contacto con nuestro equipo de soporte técnico.</p>
                    <Button asChild>
                        <Link href="/support/contact">Contactar a Soporte</Link>
                    </Button>
                </div>
            </div>
        </div>
    );
}
