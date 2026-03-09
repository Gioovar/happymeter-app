import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Mail, Clock, MapPin, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function ContactPage() {
    return (
        <div className="container mx-auto px-6 py-12 max-w-5xl">
            <div className="mb-8">
                <Button variant="ghost" asChild className="mb-6 -ml-4">
                    <Link href="/support" className="flex items-center text-muted-foreground">
                        <ArrowLeft className="mr-2 h-4 w-4" /> Volver al Centro de Soporte
                    </Link>
                </Button>
                <h1 className="text-4xl font-bold tracking-tight mb-4">Soporte y Contacto</h1>
                <p className="text-lg text-muted-foreground">
                    ¿Tienes algún problema con nuestras aplicaciones o necesitas asistencia técnica? Estamos aquí para ayudarte.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mt-12">
                {/* Contact Info Column */}
                <div className="md:col-span-1 space-y-8">
                    <div className="bg-muted/30 p-6 rounded-2xl border">
                        <h3 className="font-semibold text-lg mb-6">Información de Contacto</h3>

                        <div className="space-y-6">
                            <div className="flex items-start">
                                <Mail className="h-5 w-5 text-primary mt-0.5 mr-3" />
                                <div>
                                    <p className="font-medium">Correo Electrónico</p>
                                    <a href="mailto:soporte@happy.com" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                                        soporte@happy.com
                                    </a>
                                </div>
                            </div>

                            <div className="flex items-start">
                                <Clock className="h-5 w-5 text-primary mt-0.5 mr-3" />
                                <div>
                                    <p className="font-medium">Horario y Tiempos</p>
                                    <p className="text-sm text-muted-foreground">
                                        Lunes a Viernes: 9:00 AM - 6:00 PM<br />
                                        Tiempo de respuesta: 24-48 horas
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-start">
                                <MapPin className="h-5 w-5 text-primary mt-0.5 mr-3" />
                                <div>
                                    <p className="font-medium">Empresa</p>
                                    <p className="text-sm text-muted-foreground">
                                        Happy Platform Inc.<br />
                                        México
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Contact Form Column */}
                <div className="md:col-span-2">
                    <div className="bg-card border shadow-sm rounded-2xl p-8">
                        <h2 className="text-2xl font-semibold mb-6">Reportar un problema</h2>

                        <form className="space-y-6">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Nombre completo</Label>
                                    <Input id="name" placeholder="Tu nombre" required />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="email">Correo electrónico</Label>
                                    <Input id="email" type="email" placeholder="tu@correo.com" required />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="app">Aplicación relacionada</Label>
                                <Select required>
                                    <SelectTrigger id="app">
                                        <SelectValue placeholder="Selecciona la aplicación" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="ops">Happy OPS</SelectItem>
                                        <SelectItem value="hostess">Happy Hostess</SelectItem>
                                        <SelectItem value="rps">Happy RPS</SelectItem>
                                        <SelectItem value="loyalty">Happy Loyalty</SelectItem>
                                        <SelectItem value="dashboard">Panel Web / Administrador</SelectItem>
                                        <SelectItem value="other">Otra</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="issue">Tipo de problema</Label>
                                <Select required>
                                    <SelectTrigger id="issue">
                                        <SelectValue placeholder="Selecciona el problema" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="login">Problemas de acceso o login</SelectItem>
                                        <SelectItem value="reservation">Problemas con reservaciones</SelectItem>
                                        <SelectItem value="payment">Problemas con pagos o comisiones</SelectItem>
                                        <SelectItem value="bug">Error en la aplicación (Bug)</SelectItem>
                                        <SelectItem value="other">Otro</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="description">Descripción detallada</Label>
                                <Textarea
                                    id="description"
                                    placeholder="Explica qué estaba pasando, qué intentabas hacer y qué error recibiste..."
                                    className="min-h-[120px]"
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="screenshot">Adjuntar captura de pantalla (Opcional)</Label>
                                <Input id="screenshot" type="file" accept="image/*" className="cursor-pointer" />
                                <p className="text-xs text-muted-foreground mt-1">Una captura de pantalla nos ayuda a resolver el problema más rápido.</p>
                            </div>

                            <Button type="submit" className="w-full sm:w-auto" size="lg">Envíar Reporte</Button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}
