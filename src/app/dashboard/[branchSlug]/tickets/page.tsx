import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getTickets } from "@/actions/tickets";
import TicketsClientPage from "../../tickets/TicketsClientPage";
import { getDashboardContext } from "@/lib/auth-context";

export const metadata = {
    title: "Incidencias Sucursal | HappyMeter",
    description: "Gestión inteligente de problemas e incidencias detectadas por IA",
};

export default async function BranchTicketsPage({ params }: { params: { branchSlug: string } }) {
    const { userId } = await auth();

    if (!userId) {
        redirect("/sign-in");
    }

    const context = await getDashboardContext(params.branchSlug);
    if (!context) redirect("/dashboard");

    const businessId = context.userId;
    const businessName = context.name;

    // Now, get tickets for the specific context.
    const { success, tickets } = await getTickets(params.branchSlug);

    return (
        <div className="flex flex-col h-full bg-[#0A0A0A] relative overflow-hidden">
            {/* Background Glows */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-violet-600/10 rounded-full blur-[100px] pointer-events-none -translate-y-1/2 translate-x-1/3"></div>
            <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-indigo-500/10 rounded-full blur-[80px] pointer-events-none translate-y-1/2 -translate-x-1/2"></div>

            <div className="p-8 pb-4 relative z-10">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <span className="bg-violet-100 text-violet-700 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1 shadow-sm">
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" /></svg>
                                AI Intelligence
                            </span>
                            <span className="bg-white/5 border border-white/10 text-gray-300 text-xs font-bold px-3 py-1 rounded-full shadow-sm">
                                {businessName}
                            </span>
                        </div>
                        <h1 className="text-3xl md:text-4xl font-black tracking-tight text-white pb-1">
                            Incidencias <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-indigo-600">Smart</span>
                        </h1>
                        <p className="text-gray-400 mt-2 text-sm max-w-2xl font-medium">
                            Gestiona y resuelve áreas de oportunidad detectadas automáticamente por nuestra Inteligencia Artificial desde el feedback de la sucursal.
                        </p>
                    </div>
                </div>
            </div>

            <div className="flex-1 p-8 pt-4 overflow-hidden relative z-10">
                <TicketsClientPage initialTickets={success && tickets ? tickets : []} businessId={businessId} />
            </div>
        </div>
    );
}
