import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getTickets } from "@/actions/tickets";
import TicketsClientPage from "./TicketsClientPage";
import { getActiveBusinessId } from "@/lib/tenant";

export const metadata = {
    title: "Incidencias | HappyMeter",
    description: "Gestión inteligente de problemas e incidencias detectadas por IA",
};

export default async function AdminTicketsPage() {
    const { userId: authUserId } = await auth();

    if (!authUserId) {
        redirect("/sign-in");
    }

    const { getActiveBusinessId } = await import('@/lib/tenant')
    const effectiveUserId = await getActiveBusinessId()
    if (!effectiveUserId) redirect("/sign-in")

    const { success, tickets } = await getTickets(effectiveUserId);

    return (
        <div className="flex flex-col h-full bg-[#050505] relative overflow-hidden">
            {/* Background Mesh Gradients - SaaS Dark Aesthetic */}
            <div className="absolute top-0 right-[-10%] w-[600px] h-[600px] bg-violet-600/20 rounded-full blur-[120px] pointer-events-none -translate-y-1/3"></div>
            <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-cyan-600/10 rounded-full blur-[100px] pointer-events-none translate-y-1/3"></div>
            <div className="absolute top-[40%] left-[20%] w-[400px] h-[400px] bg-fuchsia-600/10 rounded-full blur-[90px] pointer-events-none"></div>

            <div className="p-8 pb-4 relative z-10">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2 mb-3">
                            <span className="bg-white/5 border border-white/10 text-violet-400 text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-sm backdrop-blur-xl">
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" /></svg>
                                AI Intelligence
                            </span>
                        </div>
                        <h1 className="text-3xl md:text-5xl font-black tracking-tight text-white pb-1">
                            Incidencias <span className="text-transparent bg-clip-text bg-gradient-to-br from-violet-400 via-fuchsia-300 to-cyan-300">Smart</span>
                        </h1>
                        <p className="text-gray-400 mt-3 text-sm max-w-2xl font-medium leading-relaxed">
                            Gestiona y resuelve áreas de oportunidad detectadas automáticamente por nuestra Inteligencia Artificial, interceptando el feedback negativo antes de que llegue a internet.
                        </p>
                    </div>
                </div>
            </div>

            <div className="flex-1 p-8 pt-4 overflow-hidden relative z-10">
                <TicketsClientPage initialTickets={success && tickets ? tickets : []} businessId={effectiveUserId} />
            </div>
        </div>
    );
}
