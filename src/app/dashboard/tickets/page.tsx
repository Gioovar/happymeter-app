import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getTickets } from "@/actions/tickets";
import TicketsClientPage from "./TicketsClientPage";

export const metadata = {
    title: "Incidencias | HappyMeter",
    description: "Gestión inteligente de problemas e incidencias detectadas por IA",
};

export default async function AdminTicketsPage() {
    const { userId } = await auth();

    if (!userId) {
        redirect("/sign-in");
    }

    const { success, tickets } = await getTickets(userId);

    return (
        <div className="flex flex-col h-full bg-[#f8fafc]">
            <div className="p-8 pb-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900 border-b-2 border-slate-900 inline-block pb-1">
                        Incidencias
                    </h1>
                    <p className="text-slate-500 mt-2 text-sm max-w-2xl">
                        Gestiona los problemas y áreas de oportunidad detectadas automáticamente por la IA desde el feedback de tus clientes.
                    </p>
                </div>
            </div>

            <div className="flex-1 p-8 pt-4 overflow-hidden">
                <TicketsClientPage initialTickets={success && tickets ? tickets : []} businessId={userId} />
            </div>
        </div>
    );
}
