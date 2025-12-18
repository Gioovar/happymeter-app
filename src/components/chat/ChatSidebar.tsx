'use client'

import { useState, useEffect } from 'react'
import { MessageSquare, Plus, Trash2, Edit2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface Thread {
    id: string
    title: string
    updatedAt: string
}

interface ChatSidebarProps {
    currentThreadId?: string
    onSelectThread: (id: string | undefined) => void
    refreshTrigger?: number // Simple counter to force refresh
}

export default function ChatSidebar({ currentThreadId, onSelectThread, refreshTrigger = 0 }: ChatSidebarProps) {
    const [threads, setThreads] = useState<Thread[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const router = useRouter()

    useEffect(() => {
        fetchThreads()
    }, [currentThreadId, refreshTrigger])

    const fetchThreads = async () => {
        try {
            const res = await fetch('/api/dashboard/chat/threads')
            if (res.ok) {
                const data = await res.json()
                setThreads(data)
            }
        } catch (error) {
            console.error('Failed to load threads', error)
        } finally {
            setIsLoading(false)
        }
    }

    const handleNewChat = async () => {
        try {
            const res = await fetch('/api/dashboard/chat/threads', { method: 'POST' })
            if (res.ok) {
                const newThread = await res.json()
                onSelectThread(newThread.id)
                fetchThreads()
            }
        } catch (error) {
            console.error('Failed to create thread', error)
            toast.error('Error al crear chat')
        }
    }

    const handleDelete = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation()
        // Native confirm is sometimes blocked or feels jarring.
        // We can just proceed or use a toast action, but for now stick to confirm if user is ok with it, 
        // OR better: just double click? No, let's trust confirm for now but log any errors.
        if (!confirm('¿Seguro que quieres borrar este chat?')) return

        try {
            const res = await fetch(`/api/dashboard/chat/threads/${id}`, { method: 'DELETE' })

            if (!res.ok) {
                // Try to parse error message from server
                const data = await res.json().catch(() => null)
                throw new Error(data?.error || `Error ${res.status}`)
            }

            toast.success("Chat eliminado")

            if (currentThreadId === id) {
                onSelectThread(undefined)
            }
            fetchThreads()
        } catch (error: any) {
            console.error('Failed to delete', error)
            toast.error(`Error: ${error.message || "No se pudo borrar"}`)
        }
    }

    return (
        <div className="w-full md:w-80 border-r border-white/10 bg-[#0a0a0a] flex flex-col h-full">
            <div className="p-4 border-b border-white/10">
                <button
                    onClick={handleNewChat}
                    className="w-full py-3 bg-violet-600 hover:bg-violet-500 rounded-xl flex items-center justify-center gap-2 font-medium text-white transition shadow-lg hover:shadow-violet-500/20"
                >
                    <Plus className="w-4 h-4" />
                    Nuevo Análisis
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
                {isLoading ? (
                    <div className="flex justify-center p-4">
                        <div className="w-5 h-5 border-2 border-white/20 border-t-violet-500 rounded-full animate-spin" />
                    </div>
                ) : (
                    threads.map(thread => (
                        <div
                            key={thread.id}
                            onClick={() => {
                                console.log("Selecting thread:", thread.id)
                                onSelectThread(thread.id)
                            }}
                            className={cn(
                                "group flex items-center justify-between p-3 rounded-xl cursor-pointer transition text-sm relative",
                                currentThreadId === thread.id
                                    ? "bg-white/10 text-white"
                                    : "text-gray-400 hover:bg-white/5 hover:text-white"
                            )}
                        >
                            <div className="flex items-center gap-3 overflow-hidden flex-1">
                                <MessageSquare className={cn("w-4 h-4 flex-shrink-0", currentThreadId === thread.id ? "text-violet-400" : "text-gray-600")} />
                                <span className="truncate pr-6">{thread.title}</span>
                            </div>
                            <button
                                onClick={(e) => handleDelete(e, thread.id)}
                                className="absolute right-2 opacity-0 group-hover:opacity-100 p-1.5 hover:bg-white/10 rounded-lg hover:text-red-400 transition"
                                title="Borrar chat"
                            >
                                <Trash2 className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    ))
                )}
                {threads.length === 0 && !isLoading && (
                    <div className="text-center py-10 px-4 text-xs text-gray-600">
                        No tienes chats guardados.
                        <br />¡Inicia uno nuevo!
                    </div>
                )}
            </div>
        </div>
    )
}
