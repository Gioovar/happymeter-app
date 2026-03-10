"use client";

import { useState, useRef, useEffect } from "react";
import { useChat } from "ai/react";
import { Smile, Send, X, Bot, User } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import ReactMarkdown from "react-markdown";

export function SupportChat() {
    const [open, setOpen] = useState(false);
    const [initialQuery, setInitialQuery] = useState("");
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const { messages, input, setInput, handleInputChange, handleSubmit, isLoading, append } = useChat({
        api: "/api/support/chat",
    });

    // Auto-scroll to bottom of chat
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    // Handle opening with pre-filled query from the hero input
    const handleOpenWithQuery = (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        setOpen(true);

        // If the chat is empty and we have an initial query, send it
        if (initialQuery.trim() && messages.length === 0) {
            append({
                role: "user",
                content: initialQuery,
            });
            setInitialQuery(""); // Clear it so we don't send it again
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            {/* Hero Section Search Bar & Button */}
            <div className="mt-12 mx-auto max-w-xl flex flex-col sm:flex-row items-center gap-4">
                <form onSubmit={handleOpenWithQuery} className="w-full">
                    <div className="relative w-full shadow-lg shadow-fuchsia-500/5 rounded-full">
                        <Input
                            type="text"
                            value={initialQuery}
                            onChange={(e) => setInitialQuery(e.target.value)}
                            placeholder="como creo una reservación"
                            className="pl-8 h-16 w-full text-lg rounded-[2rem] border border-slate-700/60 bg-[#131620] focus-visible:ring-fuchsia-500/50 focus-visible:border-fuchsia-500/50 transition-all font-semibold text-white placeholder:text-slate-200 shadow-inner"
                        />
                    </div>
                </form>
                <DialogTrigger asChild>
                    <Button
                        size="lg"
                        onClick={handleOpenWithQuery}
                        className="w-full sm:w-auto rounded-[2.5rem] h-16 px-8 text-lg font-bold bg-black text-white hover:bg-black/90 border border-fuchsia-500/30 shadow-[0_0_25px_rgba(217,70,239,0.25)] hover:shadow-[0_0_35px_rgba(217,70,239,0.35)] hover:border-fuchsia-400 transition-all flex items-center justify-center gap-4 shrink-0"
                    >
                        <Smile className="h-6 w-6 text-slate-300 hidden sm:block" strokeWidth={1.5} />
                        <span>Hablar</span>
                        <span className="h-6 w-px bg-slate-700 block mx-1"></span>
                        <div className="flex items-center gap-2 text-[15px] font-bold tracking-widest text-[#B392F0] uppercase">
                            <div className="h-3 w-3 rounded-full bg-[#10B981] shadow-[0_0_8px_rgba(16,185,129,0.8)] animate-pulse"></div>
                            Online
                        </div>
                    </Button>
                </DialogTrigger>
            </div>

            {/* Chat Interface Modal */}
            <DialogContent className="sm:max-w-2xl h-[80vh] sm:h-[85vh] flex flex-col p-0 gap-0 bg-[#0B0F19] border-slate-800 shadow-[0_0_50px_rgba(217,70,239,0.1)] rounded-2xl overflow-hidden [&>button]:hidden">
                {/* Custom Header */}
                <DialogHeader className="px-6 py-4 border-b border-slate-800 bg-[#131620] flex flex-row items-center justify-between shadow-sm shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-fuchsia-500/10 text-fuchsia-400 border border-fuchsia-500/20 shadow-[0_0_15px_rgba(217,70,239,0.2)]">
                            <Smile className="h-6 w-6" />
                        </div>
                        <div>
                            <DialogTitle className="text-white text-lg font-bold">Asistente HappyMeter</DialogTitle>
                            <DialogDescription asChild>
                                <div className="text-slate-400 text-sm flex items-center gap-2">
                                    <span className="flex h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)] animate-pulse"></span>
                                    En línea y listo para ayudarte
                                </div>
                            </DialogDescription>
                        </div>
                    </div>
                    <button
                        onClick={() => setOpen(false)}
                        className="h-8 w-8 flex items-center justify-center rounded-full bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white transition-colors"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </DialogHeader>

                {/* Chat Messages */}
                <div className="flex-1 p-6 font-medium overflow-y-auto w-full">
                    <div className="flex flex-col gap-6 w-full max-w-3xl mx-auto pb-4">
                        {messages.length === 0 && !isLoading ? (
                            <div className="flex flex-col items-center justify-center text-center h-full mt-20 gap-4 opacity-70">
                                <Smile className="h-16 w-16 text-slate-600" strokeWidth={1} />
                                <div>
                                    <p className="text-slate-300 text-lg">¡Hola! Soy el agente de soporte técnico de HappyMeter.</p>
                                    <p className="text-slate-500">Hazme cualquier pregunta sobre nuestras aplicaciones.</p>
                                </div>
                            </div>
                        ) : (
                            messages.map((m) => (
                                <div key={m.id} className={"flex gap-4 w-full " + (m.role === "user" ? "flex-row-reverse" : "flex-row")}>
                                    <div className={"flex shrink-0 h-10 w-10 items-center justify-center border rounded-full " + (m.role === "user" ? "bg-white/5 border-slate-700 text-slate-300" : "bg-fuchsia-500/10 border-fuchsia-500/30 text-fuchsia-400 shadow-[0_0_15px_rgba(217,70,239,0.1)]")}>
                                        {m.role === "user" ? <User className="h-5 w-5" /> : <Bot className="h-5 w-5" />}
                                    </div>
                                    <div className={"flex flex-col max-w-[80%] " + (m.role === "user" ? "items-end" : "items-start")}>
                                        <div className={"px-5 py-3.5 rounded-2xl " + (m.role === "user" ? "bg-[#1A1F2E] text-white border border-slate-700/50 rounded-tr-sm" : "bg-[#131620] text-slate-200 border border-slate-800 rounded-tl-sm")}>
                                            <div className="prose prose-invert prose-p:leading-relaxed prose-pre:bg-black/50 prose-a:text-fuchsia-400 max-w-none text-[15px]">
                                                <ReactMarkdown>
                                                    {m.content}
                                                </ReactMarkdown>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                        {isLoading && messages.length > 0 && messages[messages.length - 1].role !== "assistant" && (
                            <div className="flex gap-4 flex-row w-full">
                                <div className="flex shrink-0 h-10 w-10 items-center justify-center border rounded-full bg-fuchsia-500/10 border-fuchsia-500/30 text-fuchsia-400">
                                    <Bot className="h-5 w-5" />
                                </div>
                                <div className="px-5 py-4 rounded-2xl bg-[#131620] border border-slate-800 rounded-tl-sm flex items-center justify-center gap-1.5 h-[52px]">
                                    <span className="h-2 w-2 bg-slate-500 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                                    <span className="h-2 w-2 bg-slate-500 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                                    <span className="h-2 w-2 bg-slate-500 rounded-full animate-bounce"></span>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>
                </div>

                {/* Input Form */}
                <div className="p-4 border-t border-slate-800 bg-[#131620] shrink-0">
                    <form
                        onSubmit={handleSubmit}
                        className="flex items-center gap-3 max-w-3xl mx-auto relative rounded-full bg-[#0B0F19] border border-slate-700/50 focus-within:border-fuchsia-500/50 focus-within:ring-1 focus-within:ring-fuchsia-500/50 transition-all shadow-inner px-2 py-2"
                    >
                        <Input
                            value={input}
                            onChange={handleInputChange}
                            placeholder="Escribe tu consulta sobre HappyMeter aquí..."
                            className="flex-1 border-0 bg-transparent text-white placeholder:text-slate-500 focus-visible:ring-0 focus-visible:ring-offset-0 h-12 px-4 shadow-none"
                            disabled={isLoading}
                        />
                        <Button
                            type="submit"
                            size="icon"
                            disabled={isLoading || !input.trim()}
                            className="h-10 w-10 shrink-0 rounded-full bg-fuchsia-600 hover:bg-fuchsia-500 text-white shadow-[0_0_15px_rgba(217,70,239,0.4)] disabled:opacity-50 disabled:shadow-none transition-all"
                        >
                            <Send className="h-4 w-4 ml-0.5" />
                            <span className="sr-only">Enviar</span>
                        </Button>
                    </form>
                    <div className="text-center mt-3 mb-1">
                        <p className="text-xs text-slate-500 font-medium tracking-wide">La IA de Happy puede cometer errores. Considera verificar información crítica.</p>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
