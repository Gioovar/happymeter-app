import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight, Calendar } from 'lucide-react'

interface Post {
    title: string
    date: string
    slug: string
    coverImage: string
    excerpt: string
}

export default function RelatedPosts({ posts }: { posts: Post[] }) {
    if (posts.length === 0) return null

    return (
        <section className="py-20 border-t border-white/10 bg-[#0a0a0a]">
            <div className="max-w-6xl mx-auto px-6">
                <h2 className="text-3xl font-bold mb-12 text-white">Artículos Relacionados</h2>

                <div className="grid md:grid-cols-3 gap-8">
                    {posts.map((post) => (
                        <Link
                            key={post.slug}
                            href={`/blog/${post.slug}`}
                            className="group flex flex-col bg-[#111] border border-white/10 rounded-2xl overflow-hidden hover:border-violet-500/50 hover:shadow-2xl hover:shadow-violet-900/10 transition-all duration-300"
                        >
                            <div className="aspect-[16/10] relative overflow-hidden">
                                <Image
                                    src={post.coverImage}
                                    alt={post.title}
                                    fill
                                    className="object-cover transition-transform duration-500 group-hover:scale-110"
                                />
                            </div>

                            <div className="p-6 flex flex-col flex-1">
                                <div className="flex items-center gap-2 text-xs text-gray-500 mb-4">
                                    <Calendar className="w-3 h-3" />
                                    {new Date(post.date).toLocaleDateString()}
                                </div>

                                <h3 className="text-xl font-bold text-white mb-3 leading-snug group-hover:text-violet-400 transition-colors">
                                    {post.title}
                                </h3>

                                <p className="text-gray-400 text-sm mb-6 line-clamp-3">
                                    {post.excerpt}
                                </p>

                                <div className="mt-auto flex items-center text-sm font-medium text-violet-400 group-hover:text-violet-300">
                                    Leer artículo
                                    <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
        </section>
    )
}
