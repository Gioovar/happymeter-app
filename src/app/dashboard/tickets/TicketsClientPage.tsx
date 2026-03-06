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
        { id: "OPEN", title: "Nuevas/Activas", icon: <MessageSquareWarning className="w-4 h-4 text-rose-500" />, bgColor: "bg-rose-50" },
        { id: "IN_PROGRESS", title: "En Revisión", icon: <Clock className="w-4 h-4 text-amber-500" />, bgColor: "bg-amber-50" },
        { id: "RESOLVED", title: "Resueltas", icon: <CheckCircle2 className="w-4 h-4 text-emerald-500" />, bgColor: "bg-emerald-50" }
    ];

    return (
        <div className="h-full flex flex-col space-y-4">

            {/* Filters and Search Bar */}
            <div className="flex items-center justify-between gap-4">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Buscar incidencias..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all"
                    />
                </div>
                <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors">
                    <Filter className="w-4 h-4" /> Filtros
                </button>
            </div>

            {/* Kanban Board */}
            <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-6 overflow-hidden pb-4">
                {columns.map(col => {
                    const columnTickets = filteredTickets.filter(t => t.status === col.id);

                    return (
                        <div key={col.id} className={`flex flex-col rounded-2xl border border-slate-200 overflow-hidden ${col.bgColor} bg-opacity-50`}>
                            {/* Column Header */}
                            <div className="p-4 border-b border-slate-200/50 bg-white/50 flex items-center justify-between sticky top-0 backdrop-blur-sm z-10">
                                <div className="flex items-center gap-2">
                                    {col.icon}
                                    <h3 className="font-bold text-slate-800">{col.title}</h3>
                                    <span className="bg-white border border-slate-200 text-slate-500 text-xs font-medium px-2 py-0.5 rounded-full">
                                        {columnTickets.length}
                                    </span>
                                </div>
                            </div>

                            {/* Column Content */}
                            <div className="flex-1 p-3 overflow-y-auto space-y-3 pretty-scrollbar">
                                <AnimatePresence>
                                    {columnTickets.map(ticket => (
                                        <motion.div
                                            layout
                                            initial={{ opacity: 0, scale: 0.95 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.95, height: 0 }}
                                            key={ticket.id}
                                            className="bg-white p-4 rounded-xl border border-slate-200/60 shadow-sm hover:shadow-md transition-all group"
                                        >
                                            <div className="flex items-start justify-between mb-2">
                                                <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border ${getSeverityColor(ticket.severity)}`}>
                                                    {getSeverityIcon(ticket.severity)}
                                                    {ticket.severity}
                                                </span>

                                                <div className="relative group/menu">
                                                    <button className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors">
                                                        <MoreVertical className="w-4 h-4" />
                                                    </button>
                                                    {/* Simple Status Changer Dropdown */}
                                                    <div className="absolute right-0 mt-1 w-36 bg-white border border-slate-200 rounded-lg shadow-xl opacity-0 invisible group-hover/menu:opacity-100 group-hover/menu:visible transition-all z-20 overflow-hidden">
                                                        {col.id !== "OPEN" && (
                                                            <button disabled={isUpdating} onClick={() => handleStatusChange(ticket.id, "OPEN")} className="w-full text-left px-3 py-2 text-xs text-slate-600 hover:bg-slate-50 border-b border-slate-100 flex items-center">
                                                                Mover a Activas
                                                            </button>
                                                        )}
                                                        {col.id !== "IN_PROGRESS" && (
                                                            <button disabled={isUpdating} onClick={() => handleStatusChange(ticket.id, "IN_PROGRESS")} className="w-full text-left px-3 py-2 text-xs text-amber-600 hover:bg-amber-50 border-b border-slate-100 flex items-center">
                                                                En Revisión
                                                            </button>
                                                        )}
                                                        {col.id !== "RESOLVED" && (
                                                            <button disabled={isUpdating} onClick={() => handleStatusChange(ticket.id, "RESOLVED")} className="w-full text-left px-3 py-2 text-xs text-emerald-600 hover:bg-emerald-50 flex items-center">
                                                                Marcar Resuelto
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            <h4 className="font-bold text-slate-900 text-sm mb-1 leading-tight">{ticket.title}</h4>
                                            <p className="text-slate-500 text-xs line-clamp-3 mb-3 leading-relaxed">
                                                {ticket.description}
                                            </p>

                                            <div className="flex items-center justify-between text-[10px] text-slate-400 font-medium">
                                                <span className="flex items-center gap-1">
                                                    <Clock className="w-3 h-3" />
                                                    {format(new Date(ticket.createdAt), "d MMM, yyyy", { locale: es })}
                                                </span>
                                                <span className="text-slate-300">ID: {ticket.id.slice(-4).toUpperCase()}</span>
                                            </div>
                                        </motion.div>
                                    ))}

                                    {columnTickets.length === 0 && (
                                        <div className="h-24 flex items-center justify-center border-2 border-dashed border-slate-200/50 rounded-xl text-sm font-medium text-slate-400 bg-white/30">
                                            Drop zone (Vacío)
                                        </div>
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
