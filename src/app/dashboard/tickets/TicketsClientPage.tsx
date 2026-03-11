"use client";

import { MessageSquareWarning } from "lucide-react";
import AITopIssues from "@/components/AITopIssues";
import ResolvedIssuesWidget from "@/components/dashboard/ResolvedIssuesWidget";
import LaserBorder from "@/components/ui/LaserBorder";

export default function TicketsClientPage({ businessId }: { initialTickets?: any[], businessId: string }) {
    return (
        <div className="h-full flex flex-col space-y-8 pb-8">
            {/* Problemas Detectados (Principal) */}
            <div className="group relative p-8 rounded-[32px] bg-[#0A0A0A] border border-white/5 shadow-2xl overflow-hidden hover:shadow-violet-900/20 transition-all duration-500 min-h-[300px] flex flex-col">
                <LaserBorder color="violet" maskClass="bg-[#0A0A0A]" />
                <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-violet-600/10 blur-[120px] rounded-full pointer-events-none translate-x-1/3 -translate-y-1/2 group-hover:bg-violet-600/20 transition-all duration-700" />

                <h3 className="text-2xl font-black mb-6 text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-fuchsia-400 relative z-10 flex items-center gap-3">
                    <MessageSquareWarning className="w-6 h-6 text-violet-400" />
                    Diagnóstico Activo (IA)
                </h3>
                <div className="flex-1 relative z-10">
                    <AITopIssues />
                </div>
            </div>

            {/* Memoria Dinámica (Secundario pero full width) */}
            <div className="w-full relative z-10 transition-transform duration-500 hover:-translate-y-1">
                <ResolvedIssuesWidget />
            </div>
        </div>
    );
}
