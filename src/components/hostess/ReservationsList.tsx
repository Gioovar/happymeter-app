"use client";

import { useState } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Search, UserCircle, Users, Clock, MoreVertical, Edit2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { updateReservationHostess } from "@/actions/hostess";
import { useRouter } from "next/navigation";

export default function ReservationsList({
    reservations,
    adminId,
}: {
    reservations: any[];
    adminId: string;
}) {
    const router = useRouter();
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("ALL");
    const [isUpdating, setIsUpdating] = useState(false);
    const [selectedRes, setSelectedRes] = useState<any | null>(null);
    const [editGuests, setEditGuests] = useState<number>(0);

    const filtered = reservations.filter((r) => {
        const matchesSearch =
            r.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (r.customerPhone || "").includes(searchTerm);

        const matchesStatus = statusFilter === "ALL" || r.status === statusFilter;

        return matchesSearch && matchesStatus;
    });

    const handleUpdateStatus = async (id: string, newStatus: string, guests?: number) => {
        try {
            setIsUpdating(true);
            const res = await updateReservationHostess({
                reservationId: id,
                status: newStatus,
                adminId,
                actualGuests: guests,
            });

            if (res.success) {
                toast.success(`Reservación marcada como ${newStatus}`);
                setSelectedRes(null);
                router.refresh();
            } else {
                toast.error(res.error);
            }
        } catch (error) {
            toast.error("Ocurrió un error.");
        } finally {
            setIsUpdating(false);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case "CHECKED_IN":
                return "bg-sky-500/20 text-sky-400 border-sky-500/30";
            case "NO_SHOW":
                return "bg-red-500/20 text-red-400 border-red-500/30";
            case "CANCELLED":
                return "bg-gray-500/20 text-gray-400 border-gray-500/30";
            default: // CONFIRMED
                return "bg-purple-500/20 text-purple-400 border-purple-500/30";
        }
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case "CHECKED_IN":
                return "En el lugar";
            case "NO_SHOW":
                return "No asistió";
            case "CANCELLED":
                return "Cancelado";
            case "CONFIRMED":
                return "Confirmada";
            default:
                return status;
        }
    };

    return (
        <div className="space-y-4">
            {/* Filters and Search */}
            <div className="flex flex-col gap-3">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                    <input
                        type="text"
                        placeholder="Buscar por nombre o teléfono..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-[#111111] border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-sky-500/50 transition-colors"
                    />
                </div>

                <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                    {["ALL", "CONFIRMED", "CHECKED_IN", "NO_SHOW"].map((status) => (
                        <button
                            key={status}
                            onClick={() => setStatusFilter(status)}
                            className={`px-4 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${statusFilter === status
                                    ? "bg-sky-500 text-white"
                                    : "bg-[#111111] text-white/60 hover:text-white border border-white/5"
                                }`}
                        >
                            {status === "ALL" ? "Todas" : getStatusLabel(status)}
                        </button>
                    ))}
                </div>
            </div>

            {/* List */}
            <div className="space-y-3">
                {filtered.map((res) => (
                    <div
                        key={res.id}
                        onClick={() => {
                            setSelectedRes(res);
                            setEditGuests(res.actualGuests || res.partySize);
                        }}
                        className="bg-[#111111] border border-white/5 rounded-2xl p-4 active:scale-[0.98] transition-all cursor-pointer"
                    >
                        <div className="flex justify-between items-start mb-3">
                            <div>
                                <h3 className="text-white font-medium text-lg">{res.customerName}</h3>
                                <div className="flex items-center gap-3 text-white/50 text-xs mt-1">
                                    <span className="flex items-center gap-1">
                                        <Clock className="w-3 h-3" />
                                        {format(new Date(res.date), "HH:mm")}
                                    </span>
                                    <span className="flex items-center gap-1 text-sky-400">
                                        <Users className="w-3 h-3" />
                                        {res.actualGuests ?? res.partySize} px
                                    </span>
                                </div>
                            </div>
                            <span className={`text-[10px] uppercase font-bold px-2 py-1 rounded border ${getStatusColor(res.status)}`}>
                                {getStatusLabel(res.status)}
                            </span>
                        </div>

                        {res.promoter && (
                            <div className="mt-3 pt-3 border-t border-white/5 flex items-center gap-2">
                                <UserCircle className="w-4 h-4 text-purple-400" />
                                <span className="text-xs text-white/60">
                                    RP: <span className="text-white font-medium">{res.promoter.name}</span>
                                </span>
                            </div>
                        )}
                    </div>
                ))}

                {filtered.length === 0 && (
                    <div className="text-center py-10 text-white/40 text-sm">
                        No se encontraron reservaciones con estos filtros.
                    </div>
                )}
            </div>

            {/* Quick Action Modal */}
            {selectedRes && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4">
                    <div className="bg-[#111111] border border-white/10 w-full max-w-md rounded-3xl p-6 animate-in slide-in-from-bottom-10 space-y-6">
                        <div>
                            <h2 className="text-2xl font-light text-white">{selectedRes.customerName}</h2>
                            <p className="text-white/50 text-sm mt-1">{selectedRes.customerPhone || "Sin teléfono"}</p>
                        </div>

                        {selectedRes.status === "CONFIRMED" && (
                            <div className="space-y-4">
                                <div>
                                    <label className="text-xs text-white/50 mb-2 block uppercase tracking-wider">Asistentes Reales</label>
                                    <div className="flex items-center gap-4">
                                        <button
                                            onClick={() => setEditGuests(Math.max(1, editGuests - 1))}
                                            className="w-12 h-12 rounded-xl bg-white/5 text-white text-xl flex items-center justify-center hover:bg-white/10"
                                        >
                                            -
                                        </button>
                                        <div className="flex-1 text-center text-3xl font-bold text-sky-400">
                                            {editGuests}
                                        </div>
                                        <button
                                            onClick={() => setEditGuests(editGuests + 1)}
                                            className="w-12 h-12 rounded-xl bg-white/5 text-white text-xl flex items-center justify-center hover:bg-white/10"
                                        >
                                            +
                                        </button>
                                    </div>
                                    <p className="text-center text-[10px] text-white/40 mt-2">Reservados originalmente: {selectedRes.partySize}</p>
                                </div>

                                <button
                                    disabled={isUpdating}
                                    onClick={() => handleUpdateStatus(selectedRes.id, "CHECKED_IN", editGuests)}
                                    className="w-full bg-sky-500 hover:bg-sky-400 text-white font-medium py-4 rounded-xl flex items-center justify-center gap-2"
                                >
                                    <CheckCircle2 className="w-5 h-5" />
                                    Confirmar Llegada
                                </button>
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-3">
                            {selectedRes.status !== "NO_SHOW" && selectedRes.status !== "CHECKED_IN" && (
                                <button
                                    disabled={isUpdating}
                                    onClick={() => handleUpdateStatus(selectedRes.id, "NO_SHOW")}
                                    className="bg-white/5 hover:bg-white/10 text-white py-3 rounded-xl text-sm"
                                >
                                    No Asistió
                                </button>
                            )}
                            <button
                                disabled={isUpdating}
                                onClick={() => setSelectedRes(null)}
                                className="bg-white/5 hover:bg-white/10 text-white/70 py-3 rounded-xl text-sm col-span-full"
                            >
                                Cerrar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
