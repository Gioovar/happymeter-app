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
    title: string;
    description: string;
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
            case "CRITICAL": return "bg-red-500/10 text-red-600 border-red-500/20";
            case "HIGH": return "bg-orange-500/10 text-orange-600 border-orange-500/20";
            case "MEDIUM": return "bg-yellow-500/10 text-yellow-600 border-yellow-500/20";
            case "LOW": return "bg-blue-500/10 text-blue-600 border-blue-500/20";
            default: return "bg-slate-100 text-slate-600 border-slate-200";
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
        t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.description.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const columns = [
        { id: "OPEN", title: "Nuevas/Activas", icon: <MessageSquareWarning className="w-4 h-4 text-rose-500" />, bgColor: "bg-rose-50/50", borderColor: "border-rose-100", headerBg: "bg-rose-100/30" },
        { id: "IN_PROGRESS", title: "En Revisión", icon: <Clock className="w-4 h-4 text-amber-500" />, bgColor: "bg-amber-50/50", borderColor: "border-amber-100", headerBg: "bg-amber-100/30" },
        { id: "RESOLVED", title: "Resueltas", icon: <CheckCircle2 className="w-4 h-4 text-emerald-500" />, bgColor: "bg-emerald-50/50", borderColor: "border-emerald-100", headerBg: "bg-emerald-100/30" }
    ];

    return (
        <div className="h-full flex flex-col space-y-6">

            {/* Filters and Search Bar */}
            <div className="flex items-center justify-between gap-4 bg-white/60 backdrop-blur-xl border border-white/80 p-3 rounded-2xl shadow-sm">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Buscar por título o descripción..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-11 pr-4 py-2.5 bg-white/50 border border-slate-200/60 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400 focus:bg-white transition-all placeholder:text-slate-400"
                    />
                </div>
                <button className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-slate-700 bg-white border border-slate-200/60 rounded-xl hover:bg-slate-50 hover:shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-violet-500/20">
                    <Filter className="w-4 h-4 text-slate-500" /> Filtros
                </button>
            </div>

            {/* Kanban Board */}
            <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-6 overflow-hidden pb-4">
                {columns.map(col => {
                    const columnTickets = filteredTickets.filter(t => t.status === col.id);

                    return (
                        <div key={col.id} className={`flex flex-col rounded-3xl border ${col.borderColor} overflow-hidden ${col.bgColor} backdrop-blur-md shadow-sm relative group/column`}>
                            {/* Inner ambient glow for the column */}
                            <div className="absolute inset-0 bg-gradient-to-b from-white/40 to-transparent pointer-events-none"></div>

                            {/* Column Header */}
                            <div className={`px-5 py-4 border-b ${col.borderColor} ${col.headerBg} flex items-center justify-between sticky top-0 backdrop-blur-xl z-10`}>
                                <div className="flex items-center gap-3">
                                    <div className="p-1.5 bg-white rounded-lg shadow-sm border border-slate-100">
                                        {col.icon}
                                    </div>
                                    <h3 className="font-bold text-slate-800 tracking-tight">{col.title}</h3>
                                </div>
                                <span className="bg-white/80 backdrop-blur-sm border border-slate-200/50 text-slate-600 text-xs font-bold px-2.5 py-1 rounded-full shadow-sm">
                                    {columnTickets.length}
                                </span>
                            </div>

                            {/* Column Content */}
                            <div className="flex-1 p-4 overflow-y-auto space-y-4 pretty-scrollbar relative z-10">
                                <AnimatePresence>
                                    {columnTickets.map(ticket => (
                                        <motion.div
                                            layout
                                            initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                            animate={{ opacity: 1, scale: 1, y: 0 }}
                                            exit={{ opacity: 0, scale: 0.95, height: 0 }}
                                            key={ticket.id}
                                            className="bg-white p-5 rounded-2xl border border-slate-100 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] hover:shadow-[0_8px_20px_-6px_rgba(0,0,0,0.1)] hover:-translate-y-0.5 transition-all group relative overflow-hidden"
                                        >
                                            {/* Accent line on the left based on severity */}
                                            <div className={`absolute left-0 top-0 bottom-0 w-1 ${ticket.severity === 'CRITICAL' ? 'bg-red-500' :
                                                    ticket.severity === 'HIGH' ? 'bg-orange-500' :
                                                        ticket.severity === 'MEDIUM' ? 'bg-yellow-500' : 'bg-blue-500'
                                                } opacity-50 group-hover:opacity-100 transition-opacity`}></div>

                                            <div className="flex items-start justify-between mb-3 pl-2">
                                                <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border shadow-sm ${getSeverityColor(ticket.severity)}`}>
                                                    {getSeverityIcon(ticket.severity)}
                                                    {ticket.severity}
                                                </span>

                                                <div className="relative group/menu">
                                                    <button className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors">
                                                        <MoreVertical className="w-4 h-4" />
                                                    </button>
                                                    {/* Status Changer Dropdown */}
                                                    <div className="absolute right-0 top-full mt-1 w-40 bg-white/90 backdrop-blur-xl border border-slate-200 rounded-xl shadow-xl opacity-0 invisible group-hover/menu:opacity-100 group-hover/menu:visible transition-all z-20 overflow-hidden transform origin-top-right scale-95 group-hover/menu:scale-100">
                                                        {col.id !== "OPEN" && (
                                                            <button disabled={isUpdating} onClick={() => handleStatusChange(ticket.id, "OPEN")} className="w-full text-left px-4 py-2.5 text-xs text-rose-600 font-medium hover:bg-rose-50 border-b border-slate-100/50 flex items-center transition-colors">
                                                                Mover a Activas
                                                            </button>
                                                        )}
                                                        {col.id !== "IN_PROGRESS" && (
                                                            <button disabled={isUpdating} onClick={() => handleStatusChange(ticket.id, "IN_PROGRESS")} className="w-full text-left px-4 py-2.5 text-xs text-amber-600 font-medium hover:bg-amber-50 border-b border-slate-100/50 flex items-center transition-colors">
                                                                En Revisión
                                                            </button>
                                                        )}
                                                        {col.id !== "RESOLVED" && (
                                                            <button disabled={isUpdating} onClick={() => handleStatusChange(ticket.id, "RESOLVED")} className="w-full text-left px-4 py-2.5 text-xs text-emerald-600 font-medium hover:bg-emerald-50 flex items-center transition-colors">
                                                                Marcar Resuelto
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="pl-2">
                                                <h4 className="font-bold text-slate-900 text-[15px] mb-1.5 leading-snug">{ticket.title}</h4>
                                                <p className="text-slate-500 text-xs line-clamp-3 mb-4 leading-relaxed font-medium">
                                                    {ticket.description}
                                                </p>

                                                <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400 pt-3 border-t border-slate-100">
                                                    <span className="flex items-center gap-1.5">
                                                        <Clock className="w-3.5 h-3.5" />
                                                        {format(new Date(ticket.createdAt), "d MMM, yyyy", { locale: es })}
                                                    </span>
                                                    <span className="text-slate-300 font-mono">#{ticket.id.slice(-5).toUpperCase()}</span>
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}

                                    {/* Empty State Redesign */}
                                    {columnTickets.length === 0 && (
                                        <motion.div
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            className="h-32 flex flex-col items-center justify-center border-2 border-dashed border-slate-300/40 rounded-2xl text-center bg-white/40 backdrop-blur-sm"
                                        >
                                            <div className="w-10 h-10 bg-white rounded-full shadow-sm flex items-center justify-center mb-2 text-slate-300">
                                                {col.id === 'OPEN' ? <CheckCircle2 className="w-5 h-5" /> :
                                                    col.id === 'IN_PROGRESS' ? <Archive className="w-5 h-5" /> :
                                                        <Flame className="w-5 h-5" />}
                                            </div>
                                            <span className="text-sm font-bold text-slate-400">Sin incidencias</span>
                                            <span className="text-xs text-slate-400/70 font-medium mt-0.5">La lista está vacía</span>
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
