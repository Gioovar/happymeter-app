"use client";

import { useState } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { motion, AnimatePresence } from "framer-motion";
import { updateTicketStatus } from "@/actions/tickets";
import { toast } from "sonner";
import {
    AlertCircle,
    CheckCircle2,
    Clock,
    Filter,
    MoreVertical,
    Plus,
    Search,
    MessageSquareWarning,
    Flame,
    Archive
} from "lucide-react";

type Ticket = {
    id: string;
    businessId: string;
    title?: string | null;
    description?: string | null;
    category?: string | null;
    aiContext?: string | null;
    status: string; // "OPEN", "IN_PROGRESS", "RESOLVED"
    severity: string; // "LOW", "MEDIUM", "HIGH", "CRITICAL"
    createdAt: string;
    updatedAt: string;
};

export default function TicketsClientPage({ initialTickets, businessId }: { initialTickets: any[], businessId: string }) {
    const [tickets, setTickets] = useState<Ticket[]>(initialTickets);
    const [searchQuery, setSearchQuery] = useState("");
    const [isUpdating, setIsUpdating] = useState(false);

    const getSeverityColor = (severity: string) => {
        switch (severity) {
            case "CRITICAL": return "bg-red-500/10 text-red-500 border-red-500/30";
            case "HIGH": return "bg-orange-500/10 text-orange-400 border-orange-500/30";
            case "MEDIUM": return "bg-yellow-500/10 text-yellow-400 border-yellow-500/30";
            case "LOW": return "bg-cyan-500/10 text-cyan-400 border-cyan-500/30";
            default: return "bg-white/5 text-gray-400 border-white/10";
        }
    };

    const getSeverityIcon = (severity: string) => {
        switch (severity) {
            case "CRITICAL": return <Flame className="w-3 h-3 mr-1" />;
            case "HIGH": return <AlertCircle className="w-3 h-3 mr-1" />;
            case "MEDIUM": return <Clock className="w-3 h-3 mr-1" />;
            default: return null;
        }
    };

    const handleStatusChange = async (ticketId: string, newStatus: string) => {
        setIsUpdating(true);

        // Optimistic UI update
        const previousTickets = [...tickets];
        setTickets(tickets.map(t => t.id === ticketId ? { ...t, status: newStatus } : t));

        const result = await updateTicketStatus(ticketId, newStatus);

        if (result.success) {
            toast.success(newStatus === "RESOLVED" ? "Incidencia marcada como resuelta." : "Estado actualizado");
        } else {
            toast.error("Error al actualizar la incidencia");
            setTickets(previousTickets); // Revert on error
        }

        setIsUpdating(false);
    };

    const filteredTickets = tickets.filter(t =>
        (t.title || t.category || "Sin título").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (t.description || t.aiContext || "").toLowerCase().includes(searchQuery.toLowerCase())
    );

    const columns = [
        { id: "OPEN", title: "Nuevas/Activas", icon: <MessageSquareWarning className="w-4 h-4 text-rose-400" />, borderColor: "border-rose-500/20", headerBg: "bg-rose-500/10", shadowGlow: "shadow-[0_0_30px_-5px_var(--tw-shadow-color)] shadow-rose-500/10" },
        { id: "IN_PROGRESS", title: "En Revisión", icon: <Clock className="w-4 h-4 text-amber-400" />, borderColor: "border-amber-500/20", headerBg: "bg-amber-500/10", shadowGlow: "shadow-[0_0_30px_-5px_var(--tw-shadow-color)] shadow-amber-500/10" },
        { id: "RESOLVED", title: "Resueltas", icon: <CheckCircle2 className="w-4 h-4 text-emerald-400" />, borderColor: "border-emerald-500/20", headerBg: "bg-emerald-500/10", shadowGlow: "shadow-[0_0_30px_-5px_var(--tw-shadow-color)] shadow-emerald-500/10" }
    ];

    return (
        <div className="h-full flex flex-col space-y-6">

            {/* Filters and Search Bar */}
            <div className="flex items-center justify-between gap-4 bg-[#111] backdrop-blur-3xl border border-white/10 p-3.5 rounded-2xl shadow-xl z-20">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <input
                        type="text"
                        placeholder="Buscar ID, título o descripción..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-11 pr-4 py-2.5 bg-black/50 border border-white/10 rounded-xl text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500/50 transition-all placeholder:text-gray-600"
                    />
                </div>
                <button className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-gray-300 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 hover:text-white transition-all focus:outline-none focus:ring-2 focus:ring-violet-500/30">
                    <Filter className="w-4 h-4" /> Filtros
                </button>
            </div>

            {/* Kanban Board */}
            <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-6 overflow-hidden pb-4">
                {columns.map(col => {
                    const columnTickets = filteredTickets.filter(t => t.status === col.id);

                    return (
                        <div key={col.id} className={`flex flex-col rounded-[24px] border border-white/5 bg-[#0A0A0A]/40 backdrop-blur-xl relative group/column ${col.shadowGlow} transition-all duration-500`}>
                            {/* Inner ambient glow for the column */}
                            <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent pointer-events-none rounded-[24px]"></div>

                            {/* Column Header */}
                            <div className={`px-5 py-4 border-b border-white/5 ${col.headerBg} flex items-center justify-between sticky top-0 z-10 rounded-t-[24px]`}>
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-black/40 rounded-xl border border-white/10 shadow-inner">
                                        {col.icon}
                                    </div>
                                    <h3 className="font-bold text-white tracking-tight">{col.title}</h3>
                                </div>
                                <span className="bg-black/40 border border-white/10 text-gray-300 text-xs font-bold px-3 py-1.5 rounded-full shadow-inner">
                                    {columnTickets.length}
                                </span>
                            </div>

                            {/* Column Content */}
                            <div className="flex-1 p-4 overflow-y-auto space-y-4 pretty-scrollbar-dark relative z-10">
                                <AnimatePresence>
                                    {columnTickets.map(ticket => (
                                        <motion.div
                                            layout
                                            initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                            animate={{ opacity: 1, scale: 1, y: 0 }}
                                            exit={{ opacity: 0, scale: 0.95, height: 0 }}
                                            key={ticket.id}
                                            className="bg-[#111] p-5 rounded-2xl border border-white/5 shadow-[0_8px_30px_rgb(0,0,0,0.5)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.8)] hover:border-white/10 hover:-translate-y-1 transition-all group relative overflow-visible cursor-grab active:cursor-grabbing backdrop-blur-md"
                                        >
                                            {/* Accent line on the left based on severity */}
                                            <div className={`absolute left-0 top-3 bottom-3 w-1 rounded-r-lg ${ticket.severity === 'CRITICAL' ? 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]' :
                                                ticket.severity === 'HIGH' ? 'bg-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.5)]' :
                                                    ticket.severity === 'MEDIUM' ? 'bg-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.5)]' : 'bg-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.5)]'
                                                } opacity-40 group-hover:opacity-100 transition-opacity`}></div>

                                            <div className="flex items-start justify-between mb-3 pl-2">
                                                <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border shadow-sm ${getSeverityColor(ticket.severity)}`}>
                                                    {getSeverityIcon(ticket.severity)}
                                                    {ticket.severity}
                                                </span>

                                                <div className="relative group/menu">
                                                    <button className="p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-white/10 transition-colors">
                                                        <MoreVertical className="w-4 h-4" />
                                                    </button>
                                                    {/* Status Changer Dropdown */}
                                                    <div className="absolute right-0 top-full mt-2 w-48 bg-[#1A1A1A] border border-white/10 rounded-xl shadow-[0_20px_40px_-10px_rgba(0,0,0,0.7)] opacity-0 invisible group-hover/menu:opacity-100 group-hover/menu:visible transition-all z-[100] overflow-hidden transform origin-top-right scale-95 group-hover/menu:scale-100">
                                                        {col.id !== "OPEN" && (
                                                            <button disabled={isUpdating} onClick={() => handleStatusChange(ticket.id, "OPEN")} className="w-full text-left px-4 py-3 text-xs text-white font-medium hover:bg-rose-500/20 hover:text-rose-400 flex items-center gap-2 transition-colors">
                                                                <MessageSquareWarning className="w-3.5 h-3.5" /> Mover a Activas
                                                            </button>
                                                        )}
                                                        {col.id !== "IN_PROGRESS" && (
                                                            <button disabled={isUpdating} onClick={() => handleStatusChange(ticket.id, "IN_PROGRESS")} className="w-full text-left px-4 py-3 text-xs text-white font-medium hover:bg-amber-500/20 hover:text-amber-400 flex items-center gap-2 transition-colors">
                                                                <Clock className="w-3.5 h-3.5" /> En Revisión
                                                            </button>
                                                        )}
                                                        {col.id !== "RESOLVED" && (
                                                            <button disabled={isUpdating} onClick={() => handleStatusChange(ticket.id, "RESOLVED")} className="w-full text-left px-4 py-3 text-xs text-white font-medium hover:bg-emerald-500/20 hover:text-emerald-400 flex items-center gap-2 transition-colors">
                                                                <CheckCircle2 className="w-3.5 h-3.5" /> Marcar Resuelto
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="pl-4">
                                                <h4 className="font-bold text-white text-[15px] mb-2 leading-snug">{ticket.title || ticket.category || "Incidencia sin título"}</h4>
                                                <p className="text-gray-400 text-[13px] leading-relaxed mb-4 line-clamp-3">
                                                    {ticket.description || ticket.aiContext || "Sin detalles adicionales."}
                                                </p>

                                                <div className="flex items-center justify-between text-[11px] font-semibold text-gray-500 pt-3 border-t border-white/5">
                                                    <span className="flex items-center gap-1.5 bg-white/5 px-2 py-1 rounded-md">
                                                        <Clock className="w-3.5 h-3.5 text-violet-400" />
                                                        {format(new Date(ticket.createdAt), "d MMM", { locale: es })}
                                                    </span>
                                                    <span className="text-gray-600 font-mono tracking-wider">#{ticket.id.slice(-5).toUpperCase()}</span>
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}

                                    {/* Empty State Redesign Premium */}
                                    {columnTickets.length === 0 && (
                                        <motion.div
                                            initial={{ opacity: 0, scale: 0.9 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            transition={{ duration: 0.5, ease: "easeOut" }}
                                            className="h-44 flex flex-col items-center justify-center border border-dashed border-white/5 rounded-2xl text-center bg-white/[0.02]"
                                        >
                                            <motion.div
                                                animate={{ y: [0, -10, 0] }}
                                                transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                                                className="w-14 h-14 bg-black border border-white/10 rounded-full shadow-[0_0_50px_rgba(255,255,255,0.05)] flex items-center justify-center mb-4 text-white/50"
                                            >
                                                {col.id === 'OPEN' ? <CheckCircle2 className="w-6 h-6 text-rose-500/50" /> :
                                                    col.id === 'IN_PROGRESS' ? <Archive className="w-6 h-6 text-amber-500/50" /> :
                                                        <Flame className="w-6 h-6 text-emerald-500/50" />}
                                            </motion.div>
                                            <span className="text-sm font-bold text-gray-400">Pizarra Limpia</span>
                                            <span className="text-xs text-gray-500 font-medium mt-1">Tu equipo ha resuelto todo aquí</span>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
