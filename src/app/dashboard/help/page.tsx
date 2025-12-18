import { ArrowLeft, Video, BookOpen, MessageCircle } from 'lucide-react'
import Link from 'next/link'
import SupportChat from '@/components/SupportChat'
import KnowledgeBase from '@/components/help/KnowledgeBase'

export default function HelpPage() {
    return (
        <div className="min-h-screen bg-[#0a0a0a] text-white selection:bg-violet-500/30">
            {/* Header */}
            <header className="border-b border-white/5 bg-black/20 backdrop-blur-xl sticky top-0 z-50">
                <nav className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/dashboard">
                            <button className="p-2 rounded-lg hover:bg-white/10 transition text-gray-400 hover:text-white">
                                <ArrowLeft className="w-5 h-5" />
                            </button>
                        </Link>
                        <h1 className="text-xl font-bold flex items-center gap-2">
                            <div className="p-1.5 bg-violet-500 rounded-lg">
                                <MessageCircle className="w-4 h-4 text-white" />
                            </div>
                            Centro de Ayuda
                        </h1>
                    </div>
                </nav>
            </header>

            <main className="max-w-7xl mx-auto px-6 py-12">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">

                    {/* Left Column: Knowledge Base (8 cols) */}
                    <div className="lg:col-span-8 space-y-12">
                        {/* Hero Section */}
                        <div className="space-y-4">
                            <h2 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-500">
                                ¿En qué podemos ayudarte?
                            </h2>
                            <p className="text-gray-400 text-lg">
                                Encuentra guías rápidas y respuestas a las preguntas más frecuentes.
                            </p>
                        </div>

                        {/* Knowledge Base Grid */}
                        <KnowledgeBase />

                        {/* Video Tutorials Section (Placeholder/Future) */}
                        <div className="bg-[#111] border border-white/5 rounded-2xl p-8 flex items-center justify-between">
                            <div className="space-y-2">
                                <h3 className="text-xl font-bold flex items-center gap-2">
                                    <Video className="w-5 h-5 text-pink-500" />
                                    Tutoriales en Video
                                </h3>
                                <p className="text-gray-400">Aprende a usar HappyMeter en minutos.</p>
                            </div>
                            <button className="px-5 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl font-medium transition">
                                Ver Playlist
                            </button>
                        </div>
                    </div>

                    {/* Right Column: AI Support Chat (Sticky) */}
                    <div className="lg:col-span-4">
                        <div className="sticky top-28 space-y-6">
                            <div className="p-4 bg-gradient-to-r from-violet-600/10 to-indigo-600/10 border border-violet-500/20 rounded-2xl">
                                <h3 className="font-bold text-violet-200 mb-1">Asistente Inteligente</h3>
                                <p className="text-xs text-violet-400/80">
                                    ¿Tienes dudas puntuales? Pregúntale a nuestra IA experta.
                                </p>
                            </div>
                            <SupportChat />
                        </div>
                    </div>

                </div>
            </main>
        </div>
    )
}

