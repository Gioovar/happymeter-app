import { getPostBySlug, getAllPosts } from '@/lib/blog'
import { ArrowLeft, Calendar, User, Share2 } from 'lucide-react'
import Link from 'next/link'
import ReactMarkdown from 'react-markdown'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
    const post = getPostBySlug(params.slug, ['title', 'excerpt', 'coverImage'])

    if (!post) {
        return {
            title: 'Artículo no encontrado | HappyMeter',
        }
    }

    return {
        title: `${post.title} | HappyMeter Blog`,
        description: post.excerpt,
        openGraph: {
            title: post.title,
            description: post.excerpt,
            images: [post.coverImage],
        },
        twitter: {
            card: 'summary_large_image',
            title: post.title,
            description: post.excerpt,
            images: [post.coverImage],
        },
    }
}

export async function generateStaticParams() {
    const posts = getAllPosts(['slug'])
    return posts.map((post) => ({
        slug: post.slug,
    }))
}

export default async function BlogPost({ params }: { params: { slug: string } }) {
    const post = getPostBySlug(params.slug, [
        'title',
        'date',
        'slug',
        'author',
        'content',
        'coverImage',
        'tags'
    ])

    if (!post) {
        notFound()
    }

    return (
        <div className="min-h-screen bg-black text-white selection:bg-violet-500/30">
            {/* Minimal Header */}
            <div className="fixed top-0 left-0 w-full z-50 bg-black/80 backdrop-blur-md border-b border-white/5">
                <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
                    <Link href="/blog" className="text-sm text-gray-400 hover:text-white flex items-center transition">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Blog
                    </Link>
                    <span className="text-sm font-bold bg-clip-text text-transparent bg-gradient-to-r from-violet-400 to-fuchsia-400 hidden md:block">
                        HappyMeter
                    </span>
                    <button className="text-gray-400 hover:text-white transition">
                        <Share2 className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Article Content */}
            <article className="pt-32 pb-32 relative z-10">
                {/* Hero */}
                <header className="max-w-4xl mx-auto px-6 mb-12 text-center">
                    <div className="flex items-center justify-center gap-4 text-sm text-gray-500 mb-6">
                        <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {new Date(post.date).toLocaleDateString()}
                        </span>
                        <span className="w-1 h-1 bg-gray-600 rounded-full" />
                        <span className="flex items-center gap-1">
                            <User className="w-4 h-4" />
                            {post.author}
                        </span>
                    </div>

                    <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-8 leading-tight">
                        {post.title}
                    </h1>

                    <div className="flex flex-wrap justify-center gap-2 mb-12">
                        {(post.tags || []).map(tag => (
                            <span key={tag} className="text-xs font-bold uppercase tracking-wider border border-white/20 px-3 py-1 rounded-full text-gray-300">
                                {tag}
                            </span>
                        ))}
                    </div>

                    <div className="aspect-video relative rounded-2xl overflow-hidden shadow-2xl shadow-violet-900/20 max-w-4xl mx-auto border border-white/10">
                        <img
                            src={post.coverImage}
                            alt={post.title}
                            className="object-cover w-full h-full"
                        />
                    </div>
                </header>

                {/* Prose Body */}
                <div className="max-w-2xl mx-auto px-6">
                    <div className="prose prose-invert prose-lg prose-violet max-w-none">
                        <ReactMarkdown
                            components={{
                                h2: ({ node, ...props }) => <h2 className="text-3xl font-bold mt-12 mb-6 text-white" {...props} />,
                                h3: ({ node, ...props }) => <h3 className="text-2xl font-bold mt-8 mb-4 text-gray-200" {...props} />,
                                p: ({ node, ...props }) => <p className="text-gray-300 leading-relaxed mb-6" {...props} />,
                                ul: ({ node, ...props }) => <ul className="list-disc list-outside mb-6 text-gray-300 pl-4" {...props} />,
                                li: ({ node, ...props }) => <li className="mb-2" {...props} />,
                                blockquote: ({ node, ...props }) => (
                                    <blockquote className="border-l-4 border-violet-500 pl-6 py-2 my-8 italic text-xl text-gray-400 bg-white/5 rounded-r-lg" {...props} />
                                ),
                                code: ({ node, inline, className, children, ...props }) => { // Fixed signature with inline prop
                                    if (inline) {
                                        return <code className="bg-white/10 px-1 py-0.5 rounded text-fuchsia-300 font-mono text-sm" {...props}>{children}</code>
                                    }
                                    return <code className="block bg-[#111] p-4 rounded-lg text-sm text-gray-300 font-mono my-6 border border-white/10 overflow-x-auto" {...props}>{children}</code>
                                }
                            }}
                        >
                            {post.content}
                        </ReactMarkdown>
                    </div>

                    {/* Footer / CTA */}
                    <div className="mt-20 border-t border-white/10 pt-12">
                        <div className="bg-gradient-to-r from-violet-900/30 to-fuchsia-900/30 rounded-2xl p-8 text-center border border-white/10">
                            <h3 className="text-2xl font-bold mb-4">¿Te gustó este artículo?</h3>
                            <p className="text-gray-400 mb-6">
                                Prueba HappyMeter gratis y aplica estas estrategias en tu negocio hoy mismo.
                            </p>
                            <Link
                                href="/onboarding"
                                className="inline-block bg-white text-black font-bold px-8 py-3 rounded-full hover:bg-gray-200 transition"
                            >
                                Empezar Prueba Gratis
                            </Link>
                        </div>
                    </div>
                </div>
            </article>
        </div>
    )
}
