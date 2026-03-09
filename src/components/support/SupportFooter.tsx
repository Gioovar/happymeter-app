import Link from 'next/link';
import { Mail, Shield, AlertTriangle, Layers } from 'lucide-react';

export function SupportFooter() {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="w-full border-t bg-background">
            <div className="container py-10 md:py-16">
                <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
                    <div className="md:col-span-2">
                        <Link href="/support" className="flex items-center space-x-2 w-fit">
                            <Layers className="h-6 w-6 text-primary" />
                            <span className="font-bold text-lg">Happy Support Center</span>
                        </Link>
                        <p className="mt-4 text-sm text-muted-foreground w-full md:w-3/4">
                            La plataforma tecnológica oficial de Happy para gestión de restaurantes, bares y centros de entretenimiento. Diseñada para garantizar experiencias increíbles.
                        </p>
                    </div>

                    <div>
                        <h3 className="mb-4 text-sm font-semibold">Legal y Privacidad</h3>
                        <ul className="space-y-3 text-sm text-muted-foreground">
                            <li>
                                <Link href="/support/terms" className="hover:text-foreground hover:underline underline-offset-4">Términos y Condiciones</Link>
                            </li>
                            <li>
                                <Link href="/support/privacy" className="hover:text-foreground hover:underline underline-offset-4">Política de Privacidad</Link>
                            </li>
                            <li>
                                <Link href="/support/security" className="hover:text-foreground hover:underline underline-offset-4 flex items-center gap-1">
                                    Protección de Datos
                                </Link>
                            </li>
                        </ul>
                    </div>

                    <div>
                        <h3 className="mb-4 text-sm font-semibold">Soporte Técnico</h3>
                        <ul className="space-y-3 text-sm text-muted-foreground">
                            <li>
                                <Link href="/support/faq" className="hover:text-foreground hover:underline underline-offset-4">Centro de Ayuda</Link>
                            </li>
                            <li>
                                <Link href="/support/contact" className="hover:text-foreground hover:underline underline-offset-4 flex items-center gap-1">
                                    Contactar Soporte
                                </Link>
                            </li>
                            <li>
                                <Link href="/support/delete-account" className="hover:text-foreground hover:underline underline-offset-4 text-red-500/80 hover:text-red-500 flex items-center gap-1">
                                    Eliminar mi cuenta
                                </Link>
                            </li>
                        </ul>
                    </div>
                </div>

                <div className="mt-12 flex flex-col items-center justify-between border-t border-border/40 pt-8 sm:flex-row text-sm text-muted-foreground">
                    <p>© {currentYear} Happy Platform Inc. Todos los derechos reservados.</p>
                    <div className="mt-4 flex items-center space-x-4 sm:mt-0">
                        <span>Soporte 24/7 (SLA: 24-48hrs)</span>
                        <span className="hidden sm:inline">|</span>
                        <a href="mailto:soporte@happy.com" className="hover:text-primary">soporte@happy.com</a>
                    </div>
                </div>
            </div>
        </footer>
    );
}
