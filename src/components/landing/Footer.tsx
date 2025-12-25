
import Link from 'next/link'
import { Twitter, Instagram, Linkedin } from 'lucide-react'

export default function Footer() {
    return (
        <footer className="border-t border-white/10 bg-black pt-20 pb-10">
            <div className="max-w-7xl mx-auto px-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
                    <div className="col-span-1 md:col-span-2">
                        <h3 className="text-2xl font-bold text-white mb-4">Happy<span className="bg-clip-text text-transparent bg-gradient-to-r from-violet-500 to-fuchsia-500 animate-text-gradient">Meter</span></h3>
                        <p className="text-gray-400 max-w-sm">
                            La plataforma de encuestas de satisfacción más fácil y potente para negocios modernos.
                        </p>
                    </div>

                    <div>
                        <h4 className="font-bold text-white mb-6">Producto</h4>
                        <ul className="space-y-4 text-gray-400">
                            <li><Link href="/pricing" className="hover:text-violet-400 transition">Precios</Link></li>
                            <li><Link href="/creators" className="hover:text-violet-400 transition">Afiliados</Link></li>
                            <li><Link href="/sign-in" className="hover:text-violet-400 transition">Iniciar Sesión</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="font-bold text-white mb-6">Legal</h4>
                        <ul className="space-y-4 text-gray-400">
                            <li><Link href="/privacy" className="hover:text-violet-400 transition">Privacidad</Link></li>
                            <li><Link href="/terms" className="hover:text-violet-400 transition">Términos</Link></li>
                        </ul>
                    </div>
                </div>

                <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4">
                    <p className="text-gray-500 text-sm">
                        © {new Date().getFullYear()} HappyMeter Inc. Todos los derechos reservados.
                    </p>
                    <div className="flex items-center gap-6">
                        <a href="#" className="text-gray-500 hover:text-white transition"><Twitter className="w-5 h-5" /></a>
                        <a href="#" className="text-gray-500 hover:text-white transition"><Instagram className="w-5 h-5" /></a>
                        <a href="#" className="text-gray-500 hover:text-white transition"><Linkedin className="w-5 h-5" /></a>
                    </div>
                </div>
            </div>
        </footer>
    )
}
