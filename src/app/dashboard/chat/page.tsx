
'use client'

import { useState, useRef, useEffect } from 'react'
import { Send, Sparkles, User, Zap, Menu, Mic, Square, Play, Pause } from 'lucide-react'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'
import ChatSidebar from '@/components/chat/ChatSidebar'
import { toast } from 'sonner'
import { useAudioRecorder } from '@/hooks/useAudioRecorder'
import { generateExecutiveReportPDF } from '@/lib/pdf-generator'
import { startOfMonth, endOfMonth, format } from 'date-fns'

interface Message {
    role: 'user' | 'assistant'
    content: string
    audioUrl?: string
}


const AudioMessageBubble = ({ src }: { src: string }) => {
    const [isPlaying, setIsPlaying] = useState(false)
    const audioRef = useRef<HTMLAudioElement | null>(null)
    const [duration, setDuration] = useState(0)
    const [currentTime, setCurrentTime] = useState(0)

    useEffect(() => {
        const audio = new Audio(src)
        audioRef.current = audio

        audio.onloadedmetadata = () => {
            if (audio.duration === Infinity) {
                audio.currentTime = 1e101
                audio.ontimeupdate = () => {
                    audio.ontimeupdate = null
                    audio.currentTime = 0
                    setDuration(audio.duration)
                }
            } else {
                setDuration(audio.duration)
            }
        }

        audio.onended = () => {
            setIsPlaying(false)
            setCurrentTime(0)
        }

        audio.ontimeupdate = () => setCurrentTime(audio.currentTime)

        return () => {
            audio.pause()
            audio.src = ''
        }
    }, [src])

    const togglePlay = () => {
        if (!audioRef.current) return
        if (isPlaying) {
            audioRef.current.pause()
        } else {
            audioRef.current.play()
        }
        setIsPlaying(!isPlaying)
    }

    const formatTime = (time: number) => {
        const minutes = Math.floor(time / 60)
        const seconds = Math.floor(time % 60)
        return `${minutes}:${seconds.toString().padStart(2, '0')}`
    }

    return (
        <div className="flex items-center gap-3 min-w-[200px]">
            <button
                onClick={togglePlay}
                className="w-8 h-8 md:w-10 md:h-10 flex items-center justify-center bg-white/20 hover:bg-white/30 rounded-full text-white transition-colors flex-shrink-0"
            >
                {isPlaying ? <Pause className="w-4 h-4 md:w-5 md:h-5 fill-current" /> : <Play className="w-4 h-4 md:w-5 md:h-5 fill-current ml-1" />}
            </button>

            <div className="flex-1 space-y-1">
                <div className="flex items-center gap-0.5 h-6 md:h-8 opacity-80">
                    {[...Array(20)].map((_, i) => (
                        <div
                            key={i}
                            className={cn(
                                "w-1 rounded-full transition-all duration-300",
                                isPlaying ? "animate-pulse" : ""
                            )}
                            style={{
                                height: `${Math.max(20, Math.random() * 100)}%`,
                                backgroundColor: currentTime / duration > (i / 20) ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.4)',
                                animationDelay: `${i * 0.05}s`
                            }}
                        />
                    ))}
                </div>
                <div className="text-[10px] md:text-xs text-white/70 font-mono text-right">
                    {formatTime(isPlaying ? currentTime : duration)}
                </div>
            </div>
        </div>
    )
}

export default function DashboardChatPage() {
    const [selectedThreadId, setSelectedThreadId] = useState<string | undefined>(undefined)
    const [messages, setMessages] = useState<Message[]>([])
    const [input, setInput] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [showSidebar, setShowSidebar] = useState(false)
    const [sidebarRefreshTrigger, setSidebarRefreshTrigger] = useState(0)
    const messagesEndRef = useRef<HTMLDivElement>(null)
    const isCreatingThread = useRef(false)

    // Voice Hook
    const { isRecording, recordingTime, startRecording, stopRecording, cancelRecording } = useAudioRecorder()

    const DEFAULT_MSG: Message = {
        role: 'assistant',
        content: '¡Hola! Soy tu **HappyMeter Analyst**. 🧠\n\nEstoy conectado a las métricas de tu negocio en tiempo real. Puedo ayudarte a:\n\n• Analizar tendencias de satisfacción.\n• Identificar problemas recurrentes.\n• Redactar manuales de acción paso a paso.\n\n¿Por dónde empezamos hoy?'
    }

    // Resume Last Conversation on Mount
    useEffect(() => {
        const resumeLastChat = async () => {
            try {
                const res = await fetch('/api/dashboard/chat/threads')
                if (res.ok) {
                    const threads = await res.json()
                    if (threads.length > 0) {
                        setSelectedThreadId(threads[0].id)
                    }
                }
            } catch (e) {
                console.error("Failed to resume chat", e)
            }
        }
        resumeLastChat()
    }, [])

    // Load messages when thread changes
    useEffect(() => {
        // Skip fetch if we just created this thread locally (to preserve optimistic state)
        if (isCreatingThread.current) {
            isCreatingThread.current = false
            return
        }

        if (!selectedThreadId) {
            setMessages([DEFAULT_MSG])
            return
        }

        const fetchMessages = async () => {
            setIsLoading(true)
            const toastId = toast.loading("Cargando conversación...")
            try {
                const res = await fetch(`/api/dashboard/chat/threads/${selectedThreadId}`)
                if (res.ok) {
                    const data = await res.json()
                    setMessages(data.messages.length > 0 ? data.messages : [DEFAULT_MSG])
                    toast.dismiss(toastId)
                } else {
                    // Try to parse error
                    const errData = await res.json().catch(() => null)
                    const errMsg = errData?.error || "Error desconocido"

                    // If 404/Deleted, reset
                    setMessages([DEFAULT_MSG])
                    setSelectedThreadId(undefined)
                    toast.error(`Error: ${errMsg}`, { id: toastId })
                }
            } catch (error) {
                console.error('Failed to load thread', error)
                toast.error("Error de conexión", { id: toastId })
            } finally {
                setIsLoading(false)
            }
        }

        fetchMessages()
    }, [selectedThreadId])

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }

    useEffect(() => {
        scrollToBottom()
    }, [messages])

    // --- Audio Handler ---
    const handleAudioFinish = async () => {
        const audioBlob = await stopRecording()
        if (!audioBlob) return

        // Convert Blob to Base64
        const reader = new FileReader()
        reader.readAsDataURL(audioBlob)
        reader.onloadend = async () => {
            const base64Audio = reader.result?.toString().split(',')[1]
            if (!base64Audio) return

            // Create Local Blob URL for Playback
            const audioUrl = URL.createObjectURL(audioBlob)

            // Visual Optimistic Update for Audio
            const newMessages = [...messages, {
                role: 'user',
                content: '[Mensaje de Voz]',
                audioUrl: audioUrl
            }] as Message[]

            setMessages(newMessages)
            setIsLoading(true)

            let activeThreadId = selectedThreadId
            try {
                if (!activeThreadId) {
                    const threadRes = await fetch('/api/dashboard/chat/threads', { method: 'POST' })
                    if (!threadRes.ok) throw new Error("Could not create thread")
                    const thread = await threadRes.json()
                    activeThreadId = thread.id
                    isCreatingThread.current = true
                    setSelectedThreadId(thread.id)
                }

                // Call API with audio
                const response = await fetch('/api/dashboard/chat', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        threadId: activeThreadId,
                        messages: newMessages.map(m => ({ role: m.role, content: m.content })),
                        audio: base64Audio
                    })
                })

                let data
                try {
                    const text = await response.text()
                    try {
                        data = JSON.parse(text)
                    } catch {
                        throw new Error(`Error del servidor (${response.status})`)
                    }
                } catch (e) {
                    throw new Error(`Error de conexión: ${response.statusText}`)
                }

                if (!response.ok) {
                    if (response.status === 429) throw new Error('Se acabó mi energía diaria (Límite de cuota Google). Vuelve mañana. 🌙')
                    throw new Error(data.error || `Error ${response.status}`)
                }

                setMessages(prev => [...prev, { role: 'assistant', content: data.content }])

                if (data.newTitle) {
                    setSidebarRefreshTrigger(prev => prev + 1)
                }

            } catch (error) {
                console.error(error)
                const errorMessage = error instanceof Error ? error.message : "Error desconocido"
                setMessages(prev => [...prev, { role: 'assistant', content: `❌ **Error:** ${errorMessage}` }])
            } finally {
                setIsLoading(false)
            }
        }
    }


    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!input.trim() || isLoading) return
        if (isRecording) return // Block submit while recording

        const userMessage = input.trim()
        setInput('')

        // Optimistic UI Update
        const newMessages = [...messages, { role: 'user', content: userMessage }] as Message[]
        setMessages(newMessages)
        setIsLoading(true)

        let activeThreadId = selectedThreadId
        let isNewThread = false

        try {
            // 1. Auto-create thread if doesn't exist
            if (!activeThreadId) {
                const threadRes = await fetch('/api/dashboard/chat/threads', { method: 'POST' })
                if (!threadRes.ok) throw new Error("Could not create thread")

                const thread = await threadRes.json()
                activeThreadId = thread.id

                // IMPORTANT: Flag that we are creating, so useEffect doesn't wipe our optimistic messages
                isCreatingThread.current = true
                setSelectedThreadId(thread.id)
                isNewThread = true
                console.log("Auto-created thread:", thread.id)
            }

            // 2. Perform Chat
            const response = await fetch('/api/dashboard/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    threadId: activeThreadId,
                    messages: newMessages.map(m => ({ role: m.role, content: m.content }))
                })
            })

            let data
            try {
                const text = await response.text()
                try {
                    data = JSON.parse(text)
                } catch {
                    throw new Error(`Error del servidor (${response.status})`)
                }
            } catch (JsonError) {
                throw new Error(`Error de conexión: ${response.statusText}`)
            }

            if (!response.ok) {
                if (response.status === 429) throw new Error('Se acabó mi energía diaria (Límite de cuota Google). Vuelve mañana. 🌙')
                throw new Error(data.error || `Error ${response.status}`)
            }

            // Check for Actions
            let aiContent = data.content
            if (aiContent.includes('[[ACTION:GENERATE_REPORT]]')) {
                aiContent = aiContent.replace('[[ACTION:GENERATE_REPORT]]', '').trim() || 'Generando tu reporte...'

                // Trigger Action
                toast.promise(async () => {
                    const now = new Date()
                    const start = format(startOfMonth(now), 'yyyy-MM-dd')
                    const end = format(endOfMonth(now), 'yyyy-MM-dd')
                    await generateExecutiveReportPDF(start, end, 'all') // 'all' surveyId default
                }, {
                    loading: 'Generando reporte PDF...',
                    success: 'Reporte descargado exitosamente',
                    error: 'Error al generar reporte'
                })
            }

            setMessages(prev => [...prev, { role: 'assistant', content: aiContent }])

            // 3. Update title if backend renamed it (AI Intelligent Renaming)
            if (data.newTitle) {
                setSidebarRefreshTrigger(prev => prev + 1)
            }

        } catch (error) {
            console.error(error)
            const errorMessage = error instanceof Error ? error.message : "Error desconocido"
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: `❌ **Error:** ${errorMessage}`
            }])
        } finally {
            setIsLoading(false)
        }
    }

    // Quick Suggestions
    const suggestions = [
        "¿Cómo mejoro mi NPS?",
        "Analiza las quejas de limpieza",
        "Dame un plan para meseros",
        "Resumen de esta semana"
    ]

    return (
        <div className="fixed inset-0 md:left-64 z-40 bg-[#0f1115] flex h-[100dvh]">

            {/* Sidebar */}
            <div className={cn(
                "fixed inset-y-0 left-0 w-80 bg-[#0a0a0a] z-50 transform transition-transform duration-300 md:relative md:translate-x-0 md:block border-r border-white/10",
                showSidebar ? "translate-x-0" : "-translate-x-full"
            )}>
                <ChatSidebar
                    currentThreadId={selectedThreadId}
                    onSelectThread={(id) => {
                        setSelectedThreadId(id)
                        setShowSidebar(false)
                    }}
                    refreshTrigger={sidebarRefreshTrigger}
                />
            </div>

            {/* Overlay */}
            {showSidebar && (
                <div
                    className="fixed inset-0 bg-black/60 z-40 md:hidden backdrop-blur-sm"
                    onClick={() => setShowSidebar(false)}
                />
            )}

            {/* Main Chat Area */}
            <div className="flex-1 flex flex-col h-full relative min-w-0 bg-[#0f1115]">

                {/* 1. LAYER - Ambient Background */}
                <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
                    <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:30px_30px]" />
                    <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-violet-600/5 rounded-full blur-[100px]" />
                </div>

                {/* 2. LAYER - Header */}
                <header className="shrink-0 h-16 px-4 md:px-6 border-b border-white/5 bg-[#0f1115]/80 backdrop-blur-xl flex items-center justify-between z-10">
                    <div className="flex items-center gap-3">
                        <button onClick={() => setShowSidebar(true)} className="md:hidden p-2 text-gray-400 hover:text-white">
                            <Menu className="w-5 h-5" />
                        </button>
                        <div>
                            <h1 className="text-lg md:text-xl font-bold text-white flex items-center gap-2">
                                <div className="p-1.5 bg-gradient-to-br from-violet-600 to-fuchsia-600 rounded-lg">
                                    <img
                                        src="/happy-ai-logo.png"
                                        alt="Happy AI"
                                        className="w-4 h-4 object-contain brightness-0 invert"
                                    />
                                </div>
                                <span className="bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400 truncate">
                                    Centro de Inteligencia
                                </span>
                            </h1>
                        </div>
                    </div>
                </header>

                {/* 3. LAYER - Messages */}
                <div className="flex-1 overflow-hidden relative z-10 w-full">
                    <div className="absolute inset-0 overflow-y-auto custom-scrollbar p-4 md:p-6 pb-24">
                        <div className="max-w-3xl mx-auto space-y-6">
                            <AnimatePresence initial={false}>
                                {messages.map((message, index) => (
                                    <motion.div
                                        key={index}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className={cn(
                                            "flex gap-4",
                                            message.role === 'user' ? "flex-row-reverse" : "flex-row"
                                        )}
                                    >
                                        <div className={cn(
                                            "w-8 h-8 md:w-9 md:h-9 rounded-full flex items-center justify-center shrink-0 shadow-lg border border-white/10",
                                            message.role === 'user'
                                                ? "bg-gradient-to-br from-violet-600 to-fuchsia-600"
                                                : "bg-[#1a1d26] bg-opacity-80 backdrop-blur-md"
                                        )}>
                                            {message.role === 'user'
                                                ? <User className="w-4 h-4 text-white" />
                                                : <img
                                                    src="/happy-ai-logo.png"
                                                    alt="AI"
                                                    className="w-4 h-4 object-contain brightness-0 invert"
                                                />
                                            }
                                        </div>

                                        <div className={cn(
                                            "px-4 md:px-5 py-3 md:py-3.5 rounded-[20px] max-w-[85%] md:max-w-[80%] shadow-md backdrop-blur-sm border",
                                            message.role === 'user'
                                                ? "bg-violet-600/20 text-white border-violet-500/20 rounded-tr-sm"
                                                : "bg-white/5 text-gray-200 border-white/10 rounded-tl-sm"
                                        )}>
                                            {message.audioUrl ? (
                                                <AudioMessageBubble src={message.audioUrl} />
                                            ) : (
                                                <div className="whitespace-pre-wrap leading-relaxed text-sm md:text-[14px]">
                                                    {message.content.split('**').map((part, i) =>
                                                        i % 2 === 1 ? <strong key={i} className="text-white font-semibold">{part}</strong> : part
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>

                            {isLoading && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="flex gap-4"
                                >
                                    <div className="w-9 h-9 rounded-full bg-[#1a1d26] border border-white/10 flex items-center justify-center">
                                        <img
                                            src="/happy-ai-logo.png"
                                            alt="AI"
                                            className="w-4 h-4 object-contain brightness-0 invert opacity-50"
                                        />
                                    </div>
                                    <div className="bg-white/5 px-4 py-3 rounded-2xl rounded-tl-sm flex items-center gap-1.5 shadow-lg border border-white/5">
                                        <div className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                        <div className="w-1.5 h-1.5 bg-fuchsia-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                        <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                    </div>
                                </motion.div>
                            )}
                            <div ref={messagesEndRef} className="h-4" />
                        </div>
                    </div>
                </div>

                {/* 4. LAYER - Input */}
                <footer className="shrink-0 p-4 md:p-6 bg-[#0f1115]/90 backdrop-blur-xl border-t border-white/5 z-20">
                    <div className="max-w-3xl mx-auto w-full">
                        {messages.length === 1 && selectedThreadId === undefined && (
                            <div className="mb-4 hidden md:flex flex-wrap justify-center gap-2">
                                {suggestions.map((s, i) => (
                                    <button
                                        key={i}
                                        onClick={() => setInput(s)}
                                        className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-xs text-gray-400 hover:text-white transition"
                                    >
                                        {s}
                                    </button>
                                ))}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="relative group bg-[#15171e] border border-white/10 rounded-full p-2 pl-6 focus-within:border-violet-500/50 shadow-2xl">
                            <div className="flex items-center gap-3">
                                {isRecording ? (
                                    <div className="flex items-center gap-3 flex-1">
                                        <div className="flex items-center gap-2 px-3 py-1.5 bg-red-500/10 rounded-full border border-red-500/20">
                                            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                                            <span className="text-red-400 font-mono text-xs">{Math.floor(recordingTime / 60)}:{(recordingTime % 60).toString().padStart(2, '0')}</span>
                                        </div>
                                        <span className="text-gray-400 text-sm animate-pulse">Escuchando...</span>

                                        <button
                                            type="button"
                                            onClick={cancelRecording}
                                            className="ml-auto p-2 hover:bg-white/10 rounded-full text-gray-400"
                                        >
                                            <Menu className="w-4 h-4 rotate-45" /> {/* Cancel Icon */}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={handleAudioFinish}
                                            className="p-2 bg-red-500 hover:bg-red-600 rounded-full text-white shadow-lg shadow-red-500/20"
                                        >
                                            <Send className="w-4 h-4" />
                                        </button>
                                    </div>
                                ) : (
                                    <>
                                        <button
                                            type="button"
                                            onClick={startRecording}
                                            className="p-2 hover:bg-white/10 rounded-full text-gray-400 hover:text-white transition"
                                            title="Grabar mensaje de voz"
                                        >
                                            <Mic className="w-5 h-5" />
                                        </button>
                                        <Zap className="w-5 h-5 text-gray-600 group-focus-within:text-fuchsia-500 transition-colors" />
                                    </>
                                )}

                                {!isRecording && (
                                    <>
                                        <input
                                            type="text"
                                            value={input}
                                            onChange={(e) => setInput(e.target.value)}
                                            placeholder="Escribe tu mensaje..."
                                            className="flex-1 bg-transparent border-none outline-none text-white h-10 text-sm"
                                            disabled={isLoading}
                                        />
                                        <button
                                            type="submit"
                                            disabled={(!input.trim() && !isRecording) || isLoading}
                                            className="p-3 bg-violet-600 rounded-full text-white hover:bg-violet-500 disabled:opacity-50 transition"
                                        >
                                            <Send className="w-4 h-4 ml-0.5" />
                                        </button>
                                    </>
                                )}
                            </div>
                        </form>
                    </div>
                </footer>

            </div>
        </div>
    )
}
