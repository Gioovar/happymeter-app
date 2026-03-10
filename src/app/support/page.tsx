"use client";

import { AppCard } from "@/components/support/AppCard";
import { Search, Settings, Building, Users, CreditCard, HelpCircle, BookOpen, Clock, Smile } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { motion } from "framer-motion";

export default function SupportPage() {
    return (
        <div className="flex flex-col min-h-screen selection:bg-fuchsia-500/30 bg-[#0B0F19] text-slate-200">
            {/* Hero Section with Premium Mesh/Gradient */}
            <section className="relative overflow-hidden py-24 px-6 sm:px-12 text-center isolate">
                {/* Background Gradients - Neon Purple Glow */}
                <div className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80" aria-hidden="true">
                    <div className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-br from-indigo-500 via-fuchsia-500 to-purple-600 opacity-20 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]" style={{ clipPath: 'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)' }}></div>
                </div>

                <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                >
                    <div className="mx-auto max-w-2xl mt-8">
                        <div className="inline-flex items-center gap-2.5 rounded-full bg-[#131620] border border-white/5 px-5 py-2 mb-8 shadow-sm hover:border-fuchsia-500/30 transition-colors">
                            <div className="h-2.5 w-2.5 rounded-full bg-[#A855F7]"></div>
                            <span className="text-[15px] font-medium text-[#E9D5FF] tracking-wide">
                                No es software. Es tu Propio Cerebro Digital.
                            </span>
                        </div>
                        <h1 className="text-5xl font-black tracking-tight sm:text-7xl text-balance text-white">
                            ¿En qué podemos <span className="text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-400 to-purple-600">ayudarte?</span>
                        </h1>
                        <p className="mt-6 text-lg leading-8 text-slate-300 text-balance font-medium">
                            Happy es el ecosistema de tecnología operativa más avanzado para la gestión de restaurantes, bares y centros de entretenimiento. Encuentra respuestas y soluciones al instante.
                        </p>
                    </div>

                    <div className="mt-12 mx-auto max-w-2xl flex flex-col sm:flex-row items-center gap-4">
                        <div className="relative w-full group shadow-lg shadow-fuchsia-500/5 transition-shadow rounded-full">
                            <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-fuchsia-400 transition-colors" />
                            <Input
                                type="text"
                                placeholder="Ej. ¿Cómo crear una reservación?"
                                className="pl-14 h-16 w-full text-lg rounded-[2rem] border-slate-700/50 bg-[#1A1F2E]/80 backdrop-blur-xl focus-visible:ring-fuchsia-500/50 focus-visible:border-fuchsia-500/50 transition-all font-medium text-white placeholder:text-slate-500"
                            />
                        </div>
                        <Button
                            size="lg"
                            className="w-full sm:w-auto rounded-[2.5rem] h-16 px-6 sm:px-8 text-lg font-bold bg-black text-white hover:bg-black/90 border border-fuchsia-500/30 shadow-[0_0_25px_rgba(217,70,239,0.25)] hover:shadow-[0_0_35px_rgba(217,70,239,0.35)] hover:border-fuchsia-400 transition-all flex items-center justify-center gap-3 sm:gap-4 shrink-0"
                        >
                            <Smile className="h-6 w-6 text-slate-300 hidden sm:block" strokeWidth={1.5} />
                            <span>Hablar</span>
                            <span className="h-6 w-px bg-slate-700 block mx-1"></span>
                            <div className="flex items-center gap-2 text-[14px] sm:text-[15px] font-bold tracking-widest text-[#B392F0] uppercase">
                                <div className="h-3 w-3 rounded-full bg-[#10B981] shadow-[0_0_8px_rgba(16,185,129,0.8)] animate-pulse"></div>
                                Online
                            </div>
                        </Button>
                    </div>
                </motion.div>
            </section>

            {/* App Ecosystem Section */}
            <section className="py-24 px-6 sm:px-12 container mx-auto">
                <div className="text-center mb-16">
                    <h2 className="text-4xl font-bold tracking-tight sm:text-5xl mb-6 text-white">Plataformas Especializadas</h2>
                    <p className="text-xl text-slate-300 max-w-2xl mx-auto text-balance font-medium">
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
            <section className="bg-[#101420] py-24 px-6 sm:px-12 border-t border-slate-800 relative overflow-hidden">
                {/* Subtle decorative blob */}
                <div className="absolute right-0 bottom-0 -z-10 translate-x-1/3 translate-y-1/4 transform-gpu blur-3xl" aria-hidden="true">
                    <div className="aspect-[1097/845] w-[68.5625rem] bg-gradient-to-tr from-fuchsia-600 to-indigo-600 opacity-20"></div>
                </div>

                <div className="container mx-auto">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="p-8 rounded-[2rem] bg-[#1A1F2E]/60 backdrop-blur-xl border border-slate-800 shadow-xl shadow-black/20 flex flex-col h-full hover:bg-[#1A1F2E] transition-colors group">
                            <div className="h-14 w-14 rounded-2xl bg-fuchsia-500/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                <HelpCircle className="h-7 w-7 text-fuchsia-400" />
                            </div>
                            <h3 className="text-2xl font-bold tracking-tight mb-4 text-white">Preguntas Frecuentes</h3>
                            <p className="text-slate-300 leading-relaxed flex-1 mb-8 text-lg">Encuentra respuestas rápidas y guías paso a paso a las dudas más comunes de nuestra comunidad.</p>
                            <Button variant="outline" asChild className="w-full font-bold h-14 rounded-2xl border-slate-700 bg-transparent text-white hover:bg-slate-800 hover:text-white">
                                <Link href="/support/faq">Visitar Base de Conocimiento</Link>
                            </Button>
                        </div>

                        <div className="p-8 rounded-[2rem] bg-[#1A1F2E]/60 backdrop-blur-xl border border-slate-800 shadow-xl shadow-black/20 flex flex-col h-full hover:bg-[#1A1F2E] transition-colors group relative overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-b from-fuchsia-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                            <div className="h-14 w-14 rounded-2xl bg-indigo-500/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform relative z-10">
                                <Clock className="h-7 w-7 text-indigo-400" />
                            </div>
                            <h3 className="text-2xl font-bold tracking-tight mb-4 text-white relative z-10">Soporte Especializado</h3>
                            <p className="text-slate-300 leading-relaxed flex-1 mb-8 text-lg relative z-10">¿Un error en la aplicación o problema de acceso? Nuestro equipo de ingenieros lo resolverá hoy mismo.</p>
                            <Button asChild className="w-full font-bold h-14 rounded-2xl shadow-lg bg-white text-black hover:bg-slate-200 relative z-10">
                                <Link href="/support/contact">Abrir un Ticket</Link>
                            </Button>
                        </div>

                        <div className="p-8 rounded-[2rem] bg-[#1A1F2E]/60 backdrop-blur-xl border border-slate-800 shadow-xl shadow-black/20 flex flex-col h-full hover:bg-[#1A1F2E] transition-colors group">
                            <div className="h-14 w-14 rounded-2xl bg-blue-500/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                <BookOpen className="h-7 w-7 text-blue-400" />
                            </div>
                            <h3 className="text-2xl font-bold tracking-tight mb-4 text-white">Documentación Legal</h3>
                            <p className="text-slate-300 leading-relaxed flex-1 mb-8 text-lg">Asuntos de cumplimiento, manejo ético de datos, términos de servicio y políticas de seguridad.</p>
                            <Button variant="outline" asChild className="w-full font-bold h-14 rounded-2xl border-slate-700 bg-transparent text-white hover:bg-slate-800 hover:text-white">
                                <Link href="/support/privacy">Revisar Políticas</Link>
                            </Button>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
