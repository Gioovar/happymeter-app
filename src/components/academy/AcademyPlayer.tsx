'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { toggleLessonCompletion } from '@/actions/academy'
import { Play, CheckCircle, ChevronDown, ChevronRight, Menu, ArrowLeft, ArrowRight } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import Link from 'next/link'

interface Lesson {
    id: string
    title: string
    slug: string
    videoUrl: string
    content: string | null
    duration: number | null
    published: boolean
}

interface Module {
    id: string
    title: string
    lessons: Lesson[]
}

interface Course {
    id: string
    title: string
    slug: string
    modules: Module[]
}

export default function AcademyPlayer({ course, initialProgress }: { course: Course, initialProgress: string[] }) {
    const router = useRouter()
    const searchParams = useSearchParams()
    const lessonSlug = searchParams.get('lesson')

    // Find current lesson
    let activeLesson: Lesson | null = null
    let activeModule: Module | null = null

    // Flatten for navigation
    const allLessons: { lesson: Lesson, module: Module }[] = []
    course.modules.forEach(m => {
        m.lessons.forEach(l => {
            if (l.published) allLessons.push({ lesson: l, module: m })
        })
    })

    if (lessonSlug) {
        const found = allLessons.find(item => item.lesson.slug === lessonSlug)
        if (found) {
            activeLesson = found.lesson
            activeModule = found.module
        }
    } else if (allLessons.length > 0) {
        // Default to first
        activeLesson = allLessons[0].lesson
        activeModule = allLessons[0].module
    }

    // State
    const [completedLessonIds, setCompletedLessonIds] = useState<Set<string>>(new Set(initialProgress))
    const [isSidebarOpen, setSidebarOpen] = useState(true)
    const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set(activeModule ? [activeModule.id] : []))

    // Helper to get YouTube ID
    const getYoutubeId = (url: string) => {
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/
        const match = url.match(regExp)
        return (match && match[2].length === 11) ? match[2] : null
    }

    const handleLessonSelect = (slug: string) => {
        router.push(`/dashboard/academy/${course.slug}?lesson=${slug}`)
    }

    const toggleModule = (modId: string) => {
        const next = new Set(expandedModules)
        if (next.has(modId)) {
            next.delete(modId)
        } else {
            next.add(modId)
        }
        setExpandedModules(next)
    }

    const handleToggleComplete = async () => {
        if (!activeLesson) return

        // Optimistic update
        const next = new Set(completedLessonIds)
        if (next.has(activeLesson.id)) {
            next.delete(activeLesson.id)
        } else {
            next.add(activeLesson.id)
            // If completing, maybe auto-advance?
            // toast.success('Lección completada') 
        }
        setCompletedLessonIds(next)

        // Server action
        await toggleLessonCompletion(activeLesson.id)
    }

    // Navigation
    const currentIndex = allLessons.findIndex(item => item.lesson.id === activeLesson?.id)
    const nextLesson = currentIndex !== -1 && currentIndex < allLessons.length - 1 ? allLessons[currentIndex + 1] : null
    const prevLesson = currentIndex > 0 ? allLessons[currentIndex - 1] : null

    if (!activeLesson) return <div className="text-white p-8">No content available.</div>

    return (
        <div className="flex h-[calc(100vh-64px)] bg-[#050505] overflow-hidden">

            {/* Sidebar (Desktop) */}
            <div className={cn(
                "w-80 bg-[#0a0a0a] border-r border-white/10 flex flex-col transition-all duration-300 absolute md:relative z-20 h-full",
                !isSidebarOpen && "md:-ml-80"
            )}>
                <div className="p-4 border-b border-white/10 flex items-center justify-between">
                    <h2 className="font-bold text-white text-sm truncate pr-2">{course.title}</h2>
                    <button onClick={() => setSidebarOpen(false)} className="md:hidden text-gray-400">
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
                    {course.modules.map(module => (
                        <div key={module.id} className="mb-2">
                            <button
                                onClick={() => toggleModule(module.id)}
                                className="w-full flex items-center justify-between p-3 text-xs font-bold text-gray-400 uppercase tracking-wider hover:bg-white/5 rounded-lg transition"
                            >
                                <span>{module.title}</span>
                                {expandedModules.has(module.id) ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                            </button>

                            {expandedModules.has(module.id) && (
                                <div className="mt-1 space-y-1 pl-2">
                                    {module.lessons.map(lesson => (
                                        <button
                                            key={lesson.id}
                                            onClick={() => handleLessonSelect(lesson.slug)}
                                            className={cn(
                                                "w-full flex items-start text-left gap-3 p-3 rounded-lg transition text-sm relative group",
                                                activeLesson?.id === lesson.id
                                                    ? "bg-violet-500/10 text-violet-400"
                                                    : "text-gray-400 hover:text-white hover:bg-white/5"
                                            )}
                                        >
                                            {/* Status Icon */}
                                            <div className="mt-0.5">
                                                {completedLessonIds.has(lesson.id) ? (
                                                    <CheckCircle className="w-4 h-4 text-emerald-500" />
                                                ) : (
                                                    <div className={cn(
                                                        "w-4 h-4 rounded-full border-2 flex items-center justify-center",
                                                        activeLesson?.id === lesson.id ? "border-violet-500" : "border-gray-600 group-hover:border-gray-400"
                                                    )}>
                                                        {activeLesson?.id === lesson.id && <div className="w-1.5 h-1.5 bg-violet-500 rounded-full" />}
                                                    </div>
                                                )}
                                            </div>

                                            <span className="flex-1 leading-snug">{lesson.title}</span>

                                            {/* Simple duration (fake for now if null) */}
                                            <span className="text-[10px] text-gray-600 mt-1">{lesson.duration ? `${Math.floor(lesson.duration / 60)}m` : 'Video'}</span>

                                            {/* Active Indicator Bar */}
                                            {activeLesson?.id === lesson.id && (
                                                <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-violet-500 rounded-l-lg" />
                                            )}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                <div className="p-4 border-t border-white/10">
                    <div className="bg-white/5 rounded-lg p-3">
                        <div className="flex justify-between text-xs text-gray-400 mb-2">
                            <span>Tu Progreso</span>
                            <span>{Math.round((completedLessonIds.size / allLessons.length) * 100)}%</span>
                        </div>
                        <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-violet-500 to-fuchsia-500 transition-all duration-500"
                                style={{ width: `${(completedLessonIds.size / allLessons.length) * 100}%` }}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col h-full overflow-y-auto bg-[#050505] relative">

                {/* Top Toggle (Mobile/Desktop) */}
                <button
                    onClick={() => setSidebarOpen(!isSidebarOpen)}
                    className={cn(
                        "absolute top-4 left-4 z-10 p-2 bg-black/50 backdrop-blur rounded-lg text-white hover:bg-white/10 transition",
                        isSidebarOpen && "hidden md:block" // Hide on mobile if sidebar is open overlay (controlled by css classes above)
                    )}
                >
                    {isSidebarOpen ? <ArrowLeft className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                </button>

                {/* Video Container */}
                <div className="w-full bg-black aspect-video max-h-[70vh] flex items-center justify-center relative shadow-2xl z-0">
                    {getYoutubeId(activeLesson.videoUrl) ? (
                        <iframe
                            src={`https://www.youtube.com/embed/${getYoutubeId(activeLesson.videoUrl)}?rel=0`}
                            className="w-full h-full"
                            allowFullScreen
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        />
                    ) : (
                        <div className="text-gray-500 flex flex-col items-center">
                            <Play className="w-12 h-12 mb-4 opacity-50" />
                            <p>Video no disponible</p>
                        </div>
                    )}
                </div>

                {/* Lesson Details */}
                <div className="flex-1 max-w-5xl mx-auto w-full px-6 py-8">

                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-8 border-b border-white/10 mb-8">
                        <div>
                            <div className="text-sm text-violet-400 font-bold uppercase tracking-wider mb-2">
                                {activeModule?.title || 'Lección'}
                            </div>
                            <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">{activeLesson.title}</h1>
                        </div>

                        <div className="flex items-center gap-3">
                            <button
                                onClick={handleToggleComplete}
                                className={cn(
                                    "flex items-center gap-2 px-6 py-3 rounded-full font-bold transition-all active:scale-95",
                                    completedLessonIds.has(activeLesson.id)
                                        ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/50 hover:bg-emerald-500/30"
                                        : "bg-white text-black hover:bg-gray-200"
                                )}
                            >
                                {completedLessonIds.has(activeLesson.id) ? (
                                    <>
                                        <CheckCircle className="w-5 h-5" /> Completada
                                    </>
                                ) : (
                                    <>
                                        <div className="w-5 h-5 rounded-full border-2 border-black/30" /> Marcar como vista
                                    </>
                                )}
                            </button>

                            {nextLesson && (
                                <button
                                    onClick={() => handleLessonSelect(nextLesson.lesson.slug)}
                                    className="p-3 rounded-full bg-[#111] border border-white/10 text-white hover:bg-white/10 transition"
                                    title="Siguiente Lección"
                                >
                                    <ArrowRight className="w-5 h-5" />
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Markdown Content */}
                    <div className="prose prose-invert prose-violet max-w-none">
                        <ReactMarkdown>{activeLesson.content || ''}</ReactMarkdown>
                    </div>

                    {/* Navigation Footer */}
                    <div className="mt-20 flex justify-between gap-4">
                        {prevLesson ? (
                            <button
                                onClick={() => handleLessonSelect(prevLesson.lesson.slug)}
                                className="flex items-center gap-3 text-gray-400 hover:text-white transition group"
                            >
                                <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                                <div className="text-left">
                                    <div className="text-xs text-gray-500 uppercase">Anterior</div>
                                    <div className="font-medium">{prevLesson.lesson.title}</div>
                                </div>
                            </button>
                        ) : <div />}

                        {nextLesson && (
                            <button
                                onClick={() => handleLessonSelect(nextLesson.lesson.slug)}
                                className="flex items-center gap-3 text-gray-400 hover:text-white transition group text-right"
                            >
                                <div className="text-right">
                                    <div className="text-xs text-gray-500 uppercase">Siguiente</div>
                                    <div className="font-medium">{nextLesson.lesson.title}</div>
                                </div>
                                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                            </button>
                        )}
                    </div>

                </div>
            </div>
        </div>
    )
}
