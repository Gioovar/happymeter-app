"use client";

import { AppCard } from "@/components/support/AppCard";
import { Search, Settings, Building, Users, CreditCard, HelpCircle, BookOpen, Clock } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { motion } from "framer-motion";

export default function SupportPage() {
    return (
        <div className="flex flex-col min-h-screen selection:bg-primary/20">
            {/* Hero Section with Premium Mesh/Gradient */}
            <section className="relative overflow-hidden bg-background py-24 px-6 sm:px-12 text-center isolate">
                {/* Background Gradients */}
                <div className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80" aria-hidden="true">
                    <div className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-primary to-[#9089fc] opacity-20 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]" style={{ clipPath: 'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)' }}></div>
                </div>

                <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                >
                    <div className="mx-auto max-w-2xl mt-8">
                        <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary ring-1 ring-inset ring-primary/20 mb-8">
                            Centro de Ayuda Oficial
                        </span>
                        <h1 className="text-5xl font-black tracking-tight sm:text-7xl text-balance">
                            ¿En qué podemos ayudarte?
                        </h1>
                        <p className="mt-6 text-lg leading-8 text-muted-foreground text-balance">
                            Happy es el ecosistema de tecnología operativa más avanzado para la gestión de restaurantes, bares y centros de entretenimiento. Encuentra respuestas y soluciones al instante.
                        </p>
                    </div>

                    <div className="mt-10 mx-auto max-w-xl flex items-center gap-x-2">
                        <div className="relative flex-1 group shadow-sm hover:shadow-primary/10 transition-shadow rounded-full">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                            <Input
                                type="text"
                                placeholder="Ej. ¿Cómo crear una reservación?"
                                className="pl-12 h-14 text-base rounded-full border-border/60 bg-background/80 backdrop-blur-md focus-visible:ring-primary/40 focus-visible:border-primary/50 transition-all font-medium"
                            />
                        </div>
                        <Button size="lg" className="rounded-full h-14 px-8 text-base font-semibold shadow-lg shadow-primary/20">
                            Buscar
                        </Button>
                    </div>
                </motion.div>
            </section>

            {/* App Ecosystem Section */}
            <section className="py-24 px-6 sm:px-12 container mx-auto">
                <div className="text-center mb-16">
                    <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4 text-balance">Plataformas Especializadas</h2>
                    <p className="text-lg text-muted-foreground max-w-2xl mx-auto text-balance">
                        Nuestros productos están diseñados para operar en perfecta sincronía, cubriendo cada área de tu negocio.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
                    <Link href="/support/faq" className="block h-full">
                        <AppCard
                            title="Happy OPS"
                            description="Panel central de control y gestión administrativa integral del corporativo."
                            icon={<Settings className="h-6 w-6 text-blue-500" />}
                            colorClass="bg-blue-500/10 dark:bg-blue-500/20 ring-1 ring-blue-500/20"
                            delay={0.1}
                        />
                    </Link>
                    <Link href="/support/faq" className="block h-full">
                        <AppCard
                            title="Happy Hostess"
                            description="Control de accesos (door), check-ins y mesa de reservaciones en tiempo real."
                            icon={<Building className="h-6 w-6 text-emerald-500" />}
                            colorClass="bg-emerald-500/10 dark:bg-emerald-500/20 ring-1 ring-emerald-500/20"
                            delay={0.2}
                        />
                    </Link>
                    <Link href="/support/faq" className="block h-full">
                        <AppCard
                            title="Happy RPS"
                            description="Automatización de RPs, tracking de enlaces, invitados y cálculo de comisiones."
                            icon={<Users className="h-6 w-6 text-indigo-500" />}
                            colorClass="bg-indigo-500/10 dark:bg-indigo-500/20 ring-1 ring-indigo-500/20"
                            delay={0.3}
                        />
                    </Link>
                    <Link href="/support/faq" className="block h-full">
                        <AppCard
                            title="Happy Loyalty"
                            description="Fidelización directa de consumo con tarjetas digitales Rewards Apple/Google."
                            icon={<CreditCard className="h-6 w-6 text-orange-500" />}
                            colorClass="bg-orange-500/10 dark:bg-orange-500/20 ring-1 ring-orange-500/20"
                            delay={0.4}
                        />
                    </Link>
                </div>
            </section>

            {/* Quick Links Section features glassmorphism */}
            <section className="bg-muted/50 py-24 px-6 sm:px-12 border-t border-border/40 relative overflow-hidden">
                {/* Subtle decorative blob */}
                <div className="absolute right-0 bottom-0 -z-10 translate-x-1/3 translate-y-1/4 transform-gpu blur-3xl" aria-hidden="true">
                    <div className="aspect-[1097/845] w-[68.5625rem] bg-gradient-to-tr from-primary to-[#ff80b5] opacity-10"></div>
                </div>

                <div className="container mx-auto">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="p-8 rounded-3xl bg-background/60 backdrop-blur-xl border border-border/50 shadow-sm flex flex-col h-full hover:bg-background/80 transition-colors">
                            <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-6">
                                <HelpCircle className="h-6 w-6 text-primary" />
                            </div>
                            <h3 className="text-xl font-bold tracking-tight mb-3">Preguntas Frecuentes</h3>
                            <p className="text-muted-foreground leading-relaxed flex-1 mb-8">Encuentra respuestas rápidas y guías paso a paso a las dudas más comunes de nuestra comunidad.</p>
                            <Button variant="outline" asChild className="w-full font-medium h-12">
                                <Link href="/support/faq">Visitar Base de Conocimiento</Link>
                            </Button>
                        </div>

                        <div className="p-8 rounded-3xl bg-background/60 backdrop-blur-xl border border-border/50 shadow-sm flex flex-col h-full hover:bg-background/80 transition-colors">
                            <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-6">
                                <Clock className="h-6 w-6 text-primary" />
                            </div>
                            <h3 className="text-xl font-bold tracking-tight mb-3">Soporte Técnico Especializado</h3>
                            <p className="text-muted-foreground leading-relaxed flex-1 mb-8">¿Un error en la aplicación o problema de acceso? Nuestro equipo de ingenieros lo resolverá hoy mismo.</p>
                            <Button asChild className="w-full font-medium h-12 shadow-md">
                                <Link href="/support/contact">Abrir un Ticket</Link>
                            </Button>
                        </div>

                        <div className="p-8 rounded-3xl bg-background/60 backdrop-blur-xl border border-border/50 shadow-sm flex flex-col h-full hover:bg-background/80 transition-colors">
                            <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-6">
                                <BookOpen className="h-6 w-6 text-primary" />
                            </div>
                            <h3 className="text-xl font-bold tracking-tight mb-3">Documentación Legal</h3>
                            <p className="text-muted-foreground leading-relaxed flex-1 mb-8">Asuntos de cumplimiento, manejo ético de datos, términos de servicio y políticas de seguridad.</p>
                            <Button variant="outline" asChild className="w-full font-medium h-12">
                                <Link href="/support/privacy">Revisar Políticas</Link>
                            </Button>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
