import { Button } from "@/components/ui/button";
import { ArrowLeft, Lock, ShieldCheck, Key, FileCheck } from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function SecurityPage() {
    return (
        <div className="container mx-auto px-6 py-12 max-w-4xl">
            <div className="mb-8">
                <Button variant="ghost" asChild className="mb-6 -ml-4">
                    <Link href="/support" className="flex items-center text-muted-foreground">
                        <ArrowLeft className="mr-2 h-4 w-4" /> Volver al Centro de Soporte
                    </Link>
                </Button>
                <div className="flex items-center space-x-3 mb-4">
                    <ShieldCheck className="h-10 w-10 text-primary" />
                    <h1 className="text-4xl font-bold tracking-tight">Seguridad y Protección de Datos</h1>
                </div>
                <p className="text-lg text-muted-foreground">
                    En Happy priorizamos la seguridad e integridad del ecosistema de tu negocio. Conoce las medidas tecnológicas implementadas para garantizar tu privacidad.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-12">
                <Card className="border-border/50 bg-background/50">
                    <CardHeader>
                        <Lock className="h-8 w-8 text-blue-600 mb-2" />
                        <CardTitle className="text-xl">Cifrado de Extremo a Extremo</CardTitle>
                    </CardHeader>
                    <CardContent className="text-muted-foreground text-sm">
                        Toda la información que transita entre las aplicaciones móviles, el dashboard en la web y nuestros servidores está protegida mediante encriptación SSL/TLS de 256 bits, asegurando que ningún tercero intercepte el flujo de reservaciones, reportes financieros u operaciones de tu negocio.
                    </CardContent>
                </Card>

                <Card className="border-border/50 bg-background/50">
                    <CardHeader>
                        <Key className="h-8 w-8 text-emerald-600 mb-2" />
                        <CardTitle className="text-xl">Autenticación Segura</CardTitle>
                    </CardHeader>
                    <CardContent className="text-muted-foreground text-sm">
                        Nuestro sistema de inicio de sesión no guarda contraseñas en texto plano. Las identificaciones de Promotores (PINs de RPS) generan y validan perfiles a través de tokens cifrados expirables, mitigando drásticamente accesos no autorizados en terminales operativas de terceros.
                    </CardContent>
                </Card>

                <Card className="border-border/50 bg-background/50">
                    <CardHeader>
                        <Database className="h-8 w-8 text-purple-600 mb-2" />
                        <CardTitle className="text-xl">Alojamiento de Datos Certificado</CardTitle>
                    </CardHeader>
                    <CardContent className="text-muted-foreground text-sm">
                        Nuestras bases de datos maestras están alojadas en infraestructuras de nube de categoría empresarial que cumplen con estándares como SOC 2, ISO 27001 y PCI-DSS. Todos tus registros cuentan con tolerancia a fallas y copias de seguridad (backups) automáticas y periódicas.
                    </CardContent>
                </Card>

                <Card className="border-border/50 bg-background/50">
                    <CardHeader>
                        <FileCheck className="h-8 w-8 text-orange-600 mb-2" />
                        <CardTitle className="text-xl">Compliance Legal</CardTitle>
                    </CardHeader>
                    <CardContent className="text-muted-foreground text-sm">
                        Mantenemos protocolos estrictos exigidos por las tiendas de aplicaciones globales (Apple App Store & Google Play) incluyendo revisiones de vulnerabilidad constantes, herramientas para solicitud rápida de eliminación de datos y recolección mínima estrictamente necesaria.
                    </CardContent>
                </Card>
            </div>

            <div className="mt-16 bg-muted/30 p-8 rounded-2xl border text-center">
                <h3 className="text-2xl font-semibold mb-4">Reportar Vulnerabilidades</h3>
                <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
                    ¿Encontraste un bug de seguridad o comportamiento no deseado en alguna de nuestras herramientas? Apreciamos el aviso de investigadores de seguridad y tomamos acción inmediata.
                </p>
                <Button size="lg" asChild>
                    <a href="mailto:soporte@happy.com">Contactar a Operaciones de Seguridad</a>
                </Button>
            </div>
        </div>
    );
}

function Database(props: React.SVGProps<SVGSVGElement>) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
            <ellipse cx="12" cy="5" rx="9" ry="3" />
            <path d="M3 5V19A9 3 0 0 0 21 19V5" />
            <path d="M3 12A9 3 0 0 0 21 12" />
        </svg>
    );
}
