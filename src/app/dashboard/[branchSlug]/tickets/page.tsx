import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getTickets } from "@/actions/tickets";
import TicketsClientPage from "../../tickets/TicketsClientPage";
import { prisma } from "@/lib/prisma";

export const metadata = {
    title: "Incidencias Sucursal | HappyMeter",
    description: "Gestión inteligente de problemas e incidencias detectadas por IA",
};

export default async function BranchTicketsPage({ params }: { params: { branchSlug: string } }) {
    const { userId } = await auth();

    if (!userId) {
        redirect("/sign-in");
    }

    // Determine the branch/owner from slug
    // We fetch the branch to see its original owner
    const branch = await prisma.chainBranch.findUnique({
        where: { slug: params.branchSlug },
        select: {
            chain: { select: { ownerId: true } },
            branchId: true,
            name: true
        }
    })

    if (!branch) {
        redirect("/dashboard/chains");
    }

    // Ensure user has access
    const hasAccess = branch.chain.ownerId === userId || await prisma.teamMember.findFirst({
        where: { userId, ownerId: branch.chain.ownerId }
    })

    if (!hasAccess) {
        redirect("/dashboard/chains");
    }

    // Now, get tickets for the specific branch owner context.
    // If the data model doesn't explicitly tie tickets to branches yet, 
    // it will fetch all owner's tickets, which is what TicketsClientPage expects.
    const { success, tickets } = await getTickets(branch.chain.ownerId);

    return (
        <div className="flex flex-col h-full bg-[#f8fafc]">
            <div className="p-8 pb-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900 border-b-2 border-slate-900 inline-block pb-1">
                        Incidencias - {branch.name}
                    </h1>
                    <p className="text-slate-500 mt-2 text-sm max-w-2xl">
                        Gestiona los problemas y áreas de oportunidad detectadas automáticamente por la IA desde el feedback de la sucursal.
                    </p>
                </div>
            </div>

            <div className="flex-1 p-8 pt-4 overflow-hidden">
                <TicketsClientPage initialTickets={success && tickets ? tickets : []} businessId={branch.chain.ownerId} />
            </div>
        </div>
    );
}
