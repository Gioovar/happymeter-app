import { AppCard } from "@/components/support/AppCard";
import { Search, Settings, Building, Users, CreditCard } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function SupportPage() {
    return (
        <div className="flex flex-col min-h-screen">
            {/* Hero Section */}
            <section className="bg-primary/5 py-20 px-6 sm:px-12 text-center">
                <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-6 mt-12">
                    ¿En qué podemos ayudarte?
                </h1>
                <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
                    Happy es una plataforma tecnológica diseñada para la gestión de restaurantes, bares y centros de entretenimiento. Encuentra respuestas y soluciones para el ecosistema completo.
                </p>

                <div className="max-w-xl mx-auto flex items-center gap-2">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                        <Input
                            type="text"
                            placeholder="Ej. ¿Cómo crear una reservación?"
                            className="pl-10 h-12 text-base rounded-full border-primary/20 bg-background"
                        />
                    </div>
                    <Button size="lg" className="rounded-full px-8">Buscar</Button>
                </div>
            </section>

            {/* App Ecosystem Section */}
            <section className="py-20 px-6 sm:px-12 container mx-auto">
                <div className="text-center mb-16">
                    <h2 className="text-3xl font-bold tracking-tight mb-4">Ecosistema de Aplicaciones</h2>
                    <p className="text-muted-foreground max-w-2xl mx-auto">
                        Soluciones especializadas para cada parte de la operación de tu centro de entretenimiento o restaurante.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <Link href="/support/faq">
                        <AppCard
                            title="Happy OPS"
                            description="Aplicación para la gestión operativa y administración del restaurante."
                            icon={<Settings className="h-6 w-6 text-blue-600" />}
                            colorClass="bg-blue-100 dark:bg-blue-900/30"
                        />
                    </Link>
                    <Link href="/support/faq">
                        <AppCard
                            title="Happy Hostess"
                            description="Aplicación para el control de reservaciones, check-in de clientes y flujo de asistentes."
                            icon={<Building className="h-6 w-6 text-emerald-600" />}
                            colorClass="bg-emerald-100 dark:bg-emerald-900/30"
                        />
                    </Link>
                    <Link href="/support/faq">
                        <AppCard
                            title="Happy RPS"
                            description="Aplicación para promotores que generan reservaciones y clientes para los establecimientos."
                            icon={<Users className="h-6 w-6 text-purple-600" />}
                            colorClass="bg-purple-100 dark:bg-purple-900/30"
                        />
                    </Link>
                    <Link href="/support/faq">
                        <AppCard
                            title="Happy Loyalty"
                            description="Sistema de recompensas, tarjeta de lealtad digital y fidelización de clientes."
                            icon={<CreditCard className="h-6 w-6 text-orange-600" />}
                            colorClass="bg-orange-100 dark:bg-orange-900/30"
                        />
                    </Link>
                </div>
            </section>

            {/* Quick Links Section */}
            <section className="bg-muted/30 py-16 px-6 sm:px-12 border-t">
                <div className="container mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
                    <div className="p-6 rounded-2xl bg-background border shadow-sm">
                        <h3 className="text-xl font-semibold mb-3">Preguntas Frecuentes</h3>
                        <p className="text-muted-foreground mb-6 h-12">Encuentra respuestas rápidas a las dudas más comunes de nuestros usuarios.</p>
                        <Button variant="outline" asChild className="w-full">
                            <Link href="/support/faq">Visitar Centro de Ayuda</Link>
                        </Button>
                    </div>
                    <div className="p-6 rounded-2xl bg-background border shadow-sm">
                        <h3 className="text-xl font-semibold mb-3">Soporte Técnico</h3>
                        <p className="text-muted-foreground mb-6 h-12">¿Tienes un problema con tu cuenta o un error en la app? Escríbenos.</p>
                        <Button variant="outline" asChild className="w-full">
                            <Link href="/support/contact">Reportar un problema</Link>
                        </Button>
                    </div>
                    <div className="p-6 rounded-2xl bg-background border shadow-sm">
                        <h3 className="text-xl font-semibold mb-3">Documentación Legal</h3>
                        <p className="text-muted-foreground mb-6 h-12">Lee nuestros términos de servicio y políticas de manejo de datos.</p>
                        <Button variant="outline" asChild className="w-full">
                            <Link href="/support/privacy">Ver documentos</Link>
                        </Button>
                    </div>
                </div>
            </section>
        </div>
    );
}
