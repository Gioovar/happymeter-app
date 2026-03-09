'use client';

import { useState, useRef, useEffect } from 'react';
import { sendTaskMessage } from '@/actions/task-chat';
import { Send, UserCircle2, ShieldCheck } from 'lucide-react';

interface ChatMessage {
    id: string;
    content: string;
    role: string;
    createdAt: Date;
    senderId: string;
}

interface TaskChatProps {
    taskId: string;
    initialMessages: ChatMessage[];
    currentUserId: string;
    role: 'SUPERVISOR' | 'STAFF';
}

export default function TaskChat({ taskId, initialMessages, currentUserId, role }: TaskChatProps) {
    const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
    const [inputValue, setInputValue] = useState('');
    const [isSending, setIsSending] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!inputValue.trim() || isSending) return;

        const content = inputValue.trim();
        setInputValue('');
        setIsSending(true);

        // Optimistic UI update
        const tempId = `temp-${Date.now()}`;
        const newMessage: ChatMessage = {
            id: tempId,
            content,
            role,
            createdAt: new Date(),
            senderId: currentUserId
        };

        setMessages((prev) => [...prev, newMessage]);

        try {
            await sendTaskMessage(taskId, content, role);
            // Revalidation in server action will refresh the page/props eventually
            // but for immediate feedback, we rely on the optimistic update.
        } catch (error) {
            console.error("Failed to send message", error);
            // Revert optimistic update on failure
            setMessages((prev) => prev.filter(m => m.id !== tempId));
        } finally {
            setIsSending(false);
        }
    };

    return (
        <div className="flex flex-col bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-md h-[500px]">
            <div className="p-4 border-b border-slate-800 bg-slate-800/30 flex justify-between items-center">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    Chat de la Tarea
                </h3>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                {messages.length === 0 ? (
                    <div className="flex items-center justify-center h-full text-slate-500 text-sm">
                        No hay mensajes aún. Escribe algo para iniciar.
                    </div>
                ) : (
                    messages.map((msg) => {
                        const isMe = msg.senderId === currentUserId;
                        return (
                            <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                                <div className={`flex items-end gap-2 max-w-[85%] ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                                    <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${msg.role === 'SUPERVISOR' ? 'bg-indigo-500/20 text-indigo-400' : 'bg-slate-700 text-slate-300'
                                        }`}>
                                        {msg.role === 'SUPERVISOR' ? <ShieldCheck className="w-4 h-4" /> : <UserCircle2 className="w-4 h-4" />}
                                    </div>
                                    <div className={`px-4 py-2.5 rounded-2xl text-[13px] ${isMe
                                            ? 'bg-indigo-600 text-white rounded-br-none'
                                            : 'bg-slate-800 text-slate-200 border border-slate-700 rounded-bl-none'
                                        }`}>
                                        {msg.content}
                                    </div>
                                </div>
                                <span className="text-[10px] text-slate-500 mt-1 px-8">
                                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>
                        );
                    })
                )}
                <div ref={messagesEndRef} />
            </div>

            <div className="p-3 bg-slate-800/50 border-t border-slate-800">
                <form onSubmit={handleSend} className="flex items-center gap-2 relative">
                    <input
                        type="text"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        placeholder="Escribe un mensaje..."
                        className="flex-1 bg-slate-900 border border-slate-700 rounded-full px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                        disabled={isSending}
                    />
                    <button
                        type="submit"
                        disabled={!inputValue.trim() || isSending}
                        className="w-10 h-10 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
                    >
                        <Send className="w-4 h-4 ml-0.5" />
                    </button>
                </form>
            </div>
        </div>
    );
}
