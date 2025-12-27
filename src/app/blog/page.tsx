import Link from 'next/link'
import Image from 'next/image'
import { getAllPosts } from '@/lib/blog'
import { ArrowLeft, ArrowRight, Calendar, Clock, User } from 'lucide-react'
import { BackgroundLights } from '@/components/ui/BackgroundLights'

export default function BlogIndex() {
    const posts = getAllPosts([
        'title',
        'date',
        'slug',
        'author',
        'coverImage',
        'excerpt',
        'tags'
    ])

    return (
        <div className="min-h-screen bg-black text-white selection:bg-violet-500/30 relative">
            <BackgroundLights />

            {/* Header / Hero */}
            <div className="relative pt-32 pb-20 px-6 overflow-hidden z-10">
                <div className="max-w-6xl mx-auto relative text-center">
                    <Link href="/" className="inline-flex items-center text-sm text-gray-400 hover:text-white mb-6 transition">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Volver al inicio
                    </Link>
                    <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-white via-gray-200 to-gray-500 tracking-tight">
                        Blog & Recursos
                    </h1>
                    <p className="text-xl text-gray-400 max-w-2xl mx-auto">
                        Estrategias, guías y consejos para mejorar la satisfacción de tus clientes y potenciar a tu equipo.
                    </p>
                </div>
            </div>

            {/* Content Grid */}
            <div className="max-w-6xl mx-auto px-6 pb-32 relative z-10">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {posts.map((post) => (
                        <Link
                            key={post.slug}
                            href={`/blog/${post.slug}`}
                            className="group relative bg-[#111] border border-white/10 rounded-2xl overflow-hidden hover:border-violet-500/50 transition-colors duration-300 flex flex-col"
                        >
                            {/* Image */}
                            <div className="aspect-video relative overflow-hidden bg-gray-900">
                                <Image
                                    src={post.coverImage}
                                    alt={post.title}
                                    fill
                                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                                <div className="absolute bottom-4 left-4 flex gap-2">
                                    {(post.tags || []).slice(0, 2).map((tag: string) => (
                                        <span key={tag} className="text-[10px] font-bold uppercase tracking-wider bg-white/10 backdrop-blur-md px-2 py-1 rounded text-white group-hover:bg-violet-500 group-hover:text-white transition-colors">
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            {/* Content */}
                            <div className="p-6 flex-1 flex flex-col">
                                <div className="flex items-center gap-4 text-xs text-gray-500 mb-3">
                                    <span className="flex items-center gap-1">
                                        <Calendar className="w-3 h-3" />
                                        {new Date(post.date).toLocaleDateString()}
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <User className="w-3 h-3" />
                                        {post.author}
                                    </span>
                                </div>

                                <h2 className="text-xl font-bold text-white mb-3 group-hover:text-violet-400 transition-colors line-clamp-2">
                                    {post.title}
                                </h2>

                                <p className="text-gray-400 text-sm leading-relaxed mb-6 line-clamp-3">
                                    {post.excerpt}
                                </p>

                                <div className="mt-auto flex items-center text-violet-400 text-sm font-medium group-hover:translate-x-1 transition-transform">
                                    Leer artículo <ArrowRight className="w-4 h-4 ml-2" />
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>

            {/* Newsletter / CTA Section could go here */}
        </div>
    )
}
