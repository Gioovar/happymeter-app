import Link from 'next/link';
import { Twitter, Instagram, Linkedin } from 'lucide-react';
import BrandLogo from '@/components/BrandLogo';

export function SupportFooter() {
    return (
        <footer className="w-full bg-black text-white">
            <div className="container mx-auto px-6 py-20 pb-12 max-w-6xl">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-12">
                    <div className="md:col-span-5">
                        <Link href="/" className="flex items-center mb-6">
                            <BrandLogo size="lg" variant="light" />
                        </Link>
                        <p className="text-sm text-slate-400 leading-relaxed max-w-sm font-medium">
                            La plataforma de gestión tecnológica y operativa más fácil y potente para negocios modernos.
                        </p>
                    </div>

                    <div className="md:col-span-4 md:col-start-7">
                        <h3 className="mb-6 text-[15px] font-bold text-white">Producto</h3>
                        <ul className="space-y-4 text-[15px] text-slate-300 font-medium">
                            <li>
                                <Link href="/pricing" className="hover:text-white transition-colors">Precios</Link>
                            </li>
                            <li>
                                <Link href="/afiliados" className="hover:text-white transition-colors">Afiliados</Link>
                            </li>
                            <li>
                                <Link href="/login" className="hover:text-white transition-colors">Iniciar Sesión</Link>
                            </li>
                        </ul>
                    </div>

                    <div className="md:col-span-2">
                        <h3 className="mb-6 text-[15px] font-bold text-white">Legal</h3>
                        <ul className="space-y-4 text-[15px] text-slate-300 font-medium">
                            <li>
                                <Link href="/support/privacy" className="hover:text-white transition-colors">Privacidad</Link>
                            </li>
                            <li>
                                <Link href="/support/terms" className="hover:text-white transition-colors">Términos</Link>
                            </li>
                        </ul>
                    </div>
                </div>

                <div className="mt-20 pt-8 border-t border-white/5 flex flex-col md:flex-row items-center justify-between text-sm text-slate-500 font-medium">
                    <p>© 2026 HappyMeter Inc. Todos los derechos reservados.</p>
                    <div className="flex items-center space-x-6 mt-4 md:mt-0">
                        <a href="https://twitter.com" target="_blank" rel="noreferrer" className="text-slate-500 hover:text-white transition-colors">
                            <Twitter className="h-5 w-5" />
                        </a>
                        <a href="https://instagram.com" target="_blank" rel="noreferrer" className="text-slate-500 hover:text-white transition-colors">
                            <Instagram className="h-5 w-5" />
                        </a>
                        <a href="https://linkedin.com" target="_blank" rel="noreferrer" className="text-slate-500 hover:text-white transition-colors">
                            <Linkedin className="h-5 w-5" />
                        </a>
                    </div>
                </div>
            </div>
        </footer>
    );
}
