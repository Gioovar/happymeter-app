import { getAcademyData } from '@/actions/academy'
import Link from 'next/link'
import { Play, ArrowRight, BookOpen } from 'lucide-react'

export default async function AcademyIndexPage() {
    const courses = await getAcademyData()

    return (
        <div className="p-8 max-w-7xl mx-auto min-h-screen">
            <header className="mb-12">
                <h1 className="text-4xl font-bold text-white mb-2">HappyMeter Academy</h1>
                <p className="text-gray-400 text-lg">
                    Domina el arte de la retención y facturación con nuestros cursos exclusivos.
                </p>
                <div className="h-1 w-24 bg-gradient-to-r from-violet-500 to-fuchsia-500 rounded-full mt-6" />
            </header>

            {courses.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-24 border border-white/10 rounded-3xl bg-[#111] text-center">
                    <BookOpen className="w-16 h-16 text-gray-600 mb-6" />
                    <h2 className="text-2xl font-bold text-white mb-2">Próximamente</h2>
                    <p className="text-gray-400 max-w-md">
                        Estamos preparando el mejor contenido para ti. Vuelve pronto para acceder a los cursos.
                    </p>
                </div>
            ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {courses.map((course) => (
                        <Link
                            key={course.id}
                            href={`/dashboard/academy/${course.slug}`}
                            className="group bg-[#111] border border-white/10 rounded-2xl overflow-hidden hover:border-violet-500/50 hover:shadow-2xl hover:shadow-violet-900/10 transition-all duration-300 flex flex-col"
                        >
                            {/* Course Cover Placeholder if no image */}
                            <div className="aspect-video bg-gradient-to-br from-violet-900/20 to-fuchsia-900/20 relative group-hover:scale-105 transition-transform duration-500 flex items-center justify-center">
                                {course.coverImage ? (
                                    <div className="relative w-full h-full">
                                        {/* Assuming next/image, simplified for now w/ standard img or just div */}
                                        <img src={course.coverImage} alt={course.title} className="w-full h-full object-cover" />
                                    </div>
                                ) : (
                                    <Play className="w-12 h-12 text-white/20 group-hover:text-violet-400 transition-colors" />
                                )}
                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <span className="bg-white text-black font-bold px-6 py-2 rounded-full transform translate-y-4 group-hover:translate-y-0 transition-transform">
                                        Ver Curso
                                    </span>
                                </div>
                            </div>

                            <div className="p-6 flex-1 flex flex-col">
                                <h3 className="text-xl font-bold text-white mb-3 group-hover:text-violet-400 transition-colors">
                                    {course.title}
                                </h3>
                                <p className="text-gray-400 text-sm line-clamp-3 mb-6">
                                    {course.description || 'Aprende las mejores estrategias para crecer tu negocio.'}
                                </p>

                                <div className="mt-auto flex items-center justify-between text-xs text-gray-500 pt-4 border-t border-white/5">
                                    <span>{course.modules.length} Módulos</span>
                                    <span className="flex items-center text-violet-500 font-medium group-hover:translate-x-1 transition-transform">
                                        Empezar <ArrowRight className="w-3 h-3 ml-1" />
                                    </span>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    )
}
