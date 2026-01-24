import Link from 'next/link'
import { AlertTriangle, Home } from 'lucide-react'

export default function NotFound() {
    return (
        <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center p-4 relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-violet-600/20 blur-[120px] rounded-full pointer-events-none" />

            <div className="relative z-10 text-center space-y-6 max-w-lg">
                <div className="mx-auto w-24 h-24 bg-white/5 border border-white/10 rounded-full flex items-center justify-center mb-6">
                    <AlertTriangle className="w-10 h-10 text-yellow-500" />
                </div>

                <h1 className="text-7xl font-black text-white tracking-tighter">404</h1>
                <h2 className="text-2xl font-bold text-gray-300">Página No Encontrada</h2>

                <p className="text-gray-500 text-lg leading-relaxed">
                    Lo sentimos, parece que te has perdido en el espacio digital. La página que buscas no existe o ha sido movida.
                </p>

                <div className="pt-6">
                    <Link
                        href="/dashboard"
                        className="inline-flex items-center gap-2 px-8 py-3 bg-white text-black font-bold rounded-xl hover:bg-gray-200 transition-colors"
                    >
                        <Home className="w-4 h-4" />
                        <span>Volver al Inicio</span>
                    </Link>
                </div>
            </div>
        </div>
    )
}
