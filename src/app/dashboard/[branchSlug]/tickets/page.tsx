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

    // First, check if the slug is actually the current user's ID
    // Single-branch owners get redirected to /dashboard/user_xxxxx
    const isOwnerSlug = params.branchSlug === userId;

    let businessId = userId;
    let businessName = "Sucursal";

    if (!isOwnerSlug) {
        // If it's not the owner's ID, it must be a Branch Slug (e.g., from Chains)
        const branch = await prisma.chainBranch.findFirst({
            where: { slug: params.branchSlug },
            include: {
                chain: { select: { ownerId: true } }
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

        businessId = branch.chain.ownerId;
        businessId = branch.chain.ownerId;
        businessName = branch.name || "Sucursal";
    } else {
        // Fetch UserSettings for business name
        const settings = await prisma.userSettings.findUnique({
            where: { userId },
            select: { businessName: true }
        })
        if (settings?.businessName) businessName = settings.businessName;
    }

    // Now, get tickets for the specific context.
    const { success, tickets } = await getTickets(businessId);

    return (
        <div className="flex flex-col h-full bg-[#f8fafc]">
            <div className="p-8 pb-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900 border-b-2 border-slate-900 inline-block pb-1">
                        Incidencias - {businessName}
                    </h1>
                    <p className="text-slate-500 mt-2 text-sm max-w-2xl">
                        Gestiona los problemas y áreas de oportunidad detectadas automáticamente por la IA desde el feedback de la sucursal.
                    </p>
                </div>
            </div>

            <div className="flex-1 p-8 pt-4 overflow-hidden">
                <TicketsClientPage initialTickets={success && tickets ? tickets : []} businessId={businessId} />
            </div>
        </div>
    );
}
