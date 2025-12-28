'use client'

import { useState } from 'react'
import { createCourse, createModule, createLesson } from '@/actions/academy'
import { Plus, Video, LayoutList, BookOpen, Save, Check, Link as LinkIcon, Edit2, ChevronDown, ChevronRight } from 'lucide-react'
import { toast } from 'sonner'
import Image from 'next/image'

// Simplified types for the UI
type Course = {
    id: string
    title: string
    modules: Module[]
    slug: string
}

type Module = {
    id: string
    title: string
    lessons: Lesson[]
    order: number
}

type Lesson = {
    id: string
    title: string
    videoUrl: string
    published: boolean
}

export default function ContentManager({ initialCourses }: { initialCourses: any[] }) {
    const [courses, setCourses] = useState<Course[]>(initialCourses)

    // Selection state
    const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null)
    const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null)

    // Form states
    const [isCreatingCourse, setIsCreatingCourse] = useState(false)
    const [isCreatingModule, setIsCreatingModule] = useState(false)
    const [isCreatingLesson, setIsCreatingLesson] = useState(false)

    // Data buffers
    const [newCourse, setNewCourse] = useState({ title: '', description: '', slug: '' })
    const [newModule, setNewModule] = useState({ title: '' })
    const [newLesson, setNewLesson] = useState({ title: '', videoUrl: '', content: '', slug: '', duration: 0 })

    const activeCourse = courses.find(c => c.id === selectedCourseId)
    const activeModule = activeCourse?.modules.find(m => m.id === selectedModuleId)

    // --- Handlers ---

    async function handleCreateCourse() {
        if (!newCourse.title || !newCourse.slug) return toast.error('Título y Slug requeridos')

        const res = await createCourse(newCourse)
        if (res.success && res.data) {
            setCourses([res.data as any, ...courses])
            setNewCourse({ title: '', description: '', slug: '' })
            setIsCreatingCourse(false)
            toast.success('Curso creado')
        } else {
            toast.error('Error al crear curso')
        }
    }

    async function handleCreateModule() {
        if (!selectedCourseId || !newModule.title) return

        // Optimistic update could go here, but for now simple await
        const order = activeCourse?.modules.length || 0
        const res = await createModule({
            title: newModule.title,
            courseId: selectedCourseId,
            order
        })

        if (res.success && res.data) {
            // Update local state deeply... slightly complex, normally validatPath handles this but we want instant UI
            // For V1, let's just refresh page or hack the state
            const updatedCourses = courses.map(c => {
                if (c.id === selectedCourseId) {
                    return { ...c, modules: [...c.modules, { ...res.data, lessons: [] }] }
                }
                return c
            })
            // @ts-ignore
            setCourses(updatedCourses)
            setNewModule({ title: '' })
            setIsCreatingModule(false)
            toast.success('Módulo añadido')
        }
    }

    async function handleCreateLesson() {
        if (!selectedModuleId || !newLesson.title || !newLesson.videoUrl) return toast.error('Faltan datos')

        const order = activeModule?.lessons.length || 0
        const res = await createLesson({
            ...newLesson,
            moduleId: selectedModuleId,
            order,
            slug: newLesson.slug || newLesson.title.toLowerCase().replace(/ /g, '-')
        })

        if (res.success && res.data) {
            // Update local state deeply
            const updatedCourses = courses.map(c => {
                if (c.id === selectedCourseId) {
                    return {
                        ...c,
                        modules: c.modules.map(m => {
                            if (m.id === selectedModuleId) {
                                return { ...m, lessons: [...m.lessons, res.data] }
                            }
                            return m
                        })
                    }
                }
                return c
            })
            // @ts-ignore
            setCourses(updatedCourses)
            setNewLesson({ title: '', videoUrl: '', content: '', slug: '', duration: 0 })
            setIsCreatingLesson(false)
            toast.success('Lección creada')
        }
    }

    return (
        <div className="grid grid-cols-12 gap-6 h-[calc(100vh-200px)]">

            {/* Sidebar: Courses List */}
            <div className="col-span-3 bg-[#111] border border-white/10 rounded-2xl overflow-hidden flex flex-col">
                <div className="p-4 border-b border-white/10 flex justify-between items-center bg-[#151515]">
                    <h3 className="font-bold text-white flex items-center gap-2">
                        <BookOpen className="w-4 h-4 text-violet-500" />
                        Cursos
                    </h3>
                    <button
                        onClick={() => setIsCreatingCourse(true)}
                        className="p-1 hover:bg-white/10 rounded text-gray-400 hover:text-white transition"
                    >
                        <Plus className="w-5 h-5" />
                    </button>
                </div>

                {isCreatingCourse && (
                    <div className="p-4 bg-violet-500/10 border-b border-violet-500/20 space-y-3">
                        <input
                            className="w-full bg-[#0a0a0a] border border-white/10 rounded px-3 py-2 text-sm text-white"
                            placeholder="Título del Curso"
                            value={newCourse.title}
                            onChange={(e) => setNewCourse({ ...newCourse, title: e.target.value })}
                        />
                        <input
                            className="w-full bg-[#0a0a0a] border border-white/10 rounded px-3 py-2 text-sm text-white"
                            placeholder="URL Slug (ej: masterclass-ventas)"
                            value={newCourse.slug}
                            onChange={(e) => setNewCourse({ ...newCourse, slug: e.target.value })}
                        />
                        <button
                            onClick={handleCreateCourse}
                            className="w-full bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold py-2 rounded transition"
                        >
                            Guardar Curso
                        </button>
                    </div>
                )}

                <div className="flex-1 overflow-y-auto p-2 space-y-1">
                    {courses.map(course => (
                        <button
                            key={course.id}
                            onClick={() => setSelectedCourseId(course.id)}
                            className={`w-full text-left px-4 py-3 rounded-xl transition flex items-center justify-between group ${selectedCourseId === course.id ? 'bg-violet-600 text-white' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}
                        >
                            <span className="font-medium truncate">{course.title}</span>
                            <ChevronRight className={`w-4 h-4 ${selectedCourseId === course.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-50'}`} />
                        </button>
                    ))}
                </div>
            </div>

            {/* Middle: Modules List */}
            <div className="col-span-3 bg-[#111] border border-white/10 rounded-2xl overflow-hidden flex flex-col opacity-90">
                <div className="p-4 border-b border-white/10 flex justify-between items-center bg-[#151515]">
                    <h3 className="font-bold text-gray-200 flex items-center gap-2">
                        <LayoutList className="w-4 h-4 text-fuchsia-500" />
                        Módulos
                    </h3>
                    {selectedCourseId && (
                        <button
                            onClick={() => setIsCreatingModule(true)}
                            className="p-1 hover:bg-white/10 rounded text-gray-400 hover:text-white transition"
                        >
                            <Plus className="w-5 h-5" />
                        </button>
                    )}
                </div>

                {!selectedCourseId ? (
                    <div className="flex-1 flex items-center justify-center text-gray-600 text-sm p-8 text-center">
                        Selecciona un curso para ver sus módulos
                    </div>
                ) : (
                    <>
                        {isCreatingModule && (
                            <div className="p-4 bg-fuchsia-500/10 border-b border-fuchsia-500/20 space-y-3">
                                <input
                                    className="w-full bg-[#0a0a0a] border border-white/10 rounded px-3 py-2 text-sm text-white"
                                    placeholder="Nombre del Módulo"
                                    value={newModule.title}
                                    onChange={(e) => setNewModule({ ...newModule, title: e.target.value })}
                                />
                                <button
                                    onClick={handleCreateModule}
                                    className="w-full bg-fuchsia-600 hover:bg-fuchsia-700 text-white text-xs font-bold py-2 rounded transition"
                                >
                                    Añadir Módulo
                                </button>
                            </div>
                        )}
                        <div className="flex-1 overflow-y-auto p-2 space-y-1">
                            {activeCourse?.modules.map(mod => (
                                <button
                                    key={mod.id}
                                    onClick={() => setSelectedModuleId(mod.id)}
                                    className={`w-full text-left px-4 py-3 rounded-lg transition flex items-center justify-between group ${selectedModuleId === mod.id ? 'bg-white/10 text-white border border-white/20' : 'text-gray-400 hover:bg-white/5'}`}
                                >
                                    <span className="font-medium truncate text-sm">{mod.title}</span>
                                    <span className="text-xs bg-black/40 px-2 py-1 rounded text-gray-500">{mod.lessons.length} lecciones</span>
                                </button>
                            ))}
                        </div>
                    </>
                )}
            </div>

            {/* Right: Lesson Editor */}
            <div className="col-span-6 bg-[#0a0a0a] border border-white/10 rounded-2xl overflow-hidden flex flex-col relative">
                <div className="p-4 border-b border-white/10 flex justify-between items-center bg-[#151515]">
                    <h3 className="font-bold text-gray-200 flex items-center gap-2">
                        <Video className="w-4 h-4 text-emerald-500" />
                        Editor de Lección
                    </h3>
                </div>

                {!selectedModuleId ? (
                    <div className="flex-1 flex items-center justify-center text-gray-600 text-sm p-8 text-center bg-[#111]/50">
                        Selecciona un módulo para añadir lecciones
                    </div>
                ) : (
                    <div className="p-6 overflow-y-auto h-full space-y-6">
                        {/* New Lesson Form */}
                        <div className="bg-[#111] rounded-xl p-6 border border-white/10 space-y-4">
                            <h4 className="text-lg font-bold text-white mb-4">Nueva Lección</h4>

                            <div className="space-y-4">
                                <div>
                                    <label className="text-xs text-gray-400 block mb-1">Título del Video</label>
                                    <input
                                        className="w-full bg-[#0a0a0a] border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-emerald-500 transition"
                                        placeholder="Ej: Cómo crear tu primera campaña"
                                        value={newLesson.title}
                                        onChange={(e) => setNewLesson({ ...newLesson, title: e.target.value })}
                                    />
                                </div>

                                <div>
                                    <label className="text-xs text-gray-400 block mb-1 flex items-center gap-2">
                                        <LinkIcon className="w-3 h-3" /> Link de YouTube
                                    </label>
                                    <input
                                        className="w-full bg-[#0a0a0a] border border-white/10 rounded-lg px-4 py-3 text-white font-mono text-sm focus:outline-none focus:border-emerald-500 transition"
                                        placeholder="https://youtube.com/watch?v=..."
                                        value={newLesson.videoUrl}
                                        onChange={(e) => setNewLesson({ ...newLesson, videoUrl: e.target.value })}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs text-gray-400 block mb-1">Slug (URL)</label>
                                        <input
                                            className="w-full bg-[#0a0a0a] border border-white/10 rounded-lg px-4 py-3 text-gray-400 text-sm focus:outline-none focus:border-emerald-500 transition"
                                            placeholder="como-crear-campana"
                                            value={newLesson.slug}
                                            onChange={(e) => setNewLesson({ ...newLesson, slug: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs text-gray-400 block mb-1">Duración (segundos)</label>
                                        <input
                                            type="number"
                                            className="w-full bg-[#0a0a0a] border border-white/10 rounded-lg px-4 py-3 text-white text-sm focus:outline-none focus:border-emerald-500 transition"
                                            placeholder="300"
                                            value={newLesson.duration || ''}
                                            onChange={(e) => setNewLesson({ ...newLesson, duration: parseInt(e.target.value) })}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="text-xs text-gray-400 block mb-1">Contenido (Markdown)</label>
                                    <textarea
                                        className="w-full h-32 bg-[#0a0a0a] border border-white/10 rounded-lg px-4 py-3 text-white text-sm focus:outline-none focus:border-emerald-500 transition"
                                        placeholder="Descripción detallada, resumen o enlaces útiles..."
                                        value={newLesson.content || ''}
                                        onChange={(e) => setNewLesson({ ...newLesson, content: e.target.value })}
                                    />
                                </div>

                                <button
                                    onClick={handleCreateLesson}
                                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl transition flex items-center justify-center gap-2"
                                >
                                    <Save className="w-5 h-5" />
                                    Publicar Lección
                                </button>
                            </div>
                        </div>

                        {/* Existing Lessons List */}
                        <div className="space-y-2">
                            <h4 className="text-sm font-bold text-gray-400 uppercase tracking-widest pl-1">Lecciones Existentes</h4>
                            {activeModule?.lessons.map((lesson, idx) => (
                                <div key={lesson.id} className="bg-[#111] border border-white/5 p-4 rounded-xl flex items-center gap-4 group hover:border-white/10 transition">
                                    <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-xs font-bold text-gray-500">
                                        {idx + 1}
                                    </div>
                                    <div className="flex-1">
                                        <h5 className="text-white font-medium">{lesson.title}</h5>
                                        <a href={lesson.videoUrl} target="_blank" className="text-emerald-500 text-xs hover:underline flex items-center gap-1 mt-1">
                                            <Video className="w-3 h-3" />
                                            Ver Video
                                        </a>
                                    </div>
                                    <div className="text-xs text-gray-600 px-3 py-1 bg-black rounded border border-white/5">
                                        {lesson.published ? 'Publicado' : 'Borrador'}
                                    </div>
                                </div>
                            ))}
                            {activeModule?.lessons.length === 0 && (
                                <div className="text-gray-600 text-xs italic pl-1">No hay lecciones aún.</div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
