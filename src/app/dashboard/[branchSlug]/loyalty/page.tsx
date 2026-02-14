
import { getLoyaltyProgram } from "@/actions/loyalty"
import { LoyaltyDashboard } from "@/components/loyalty/LoyaltyDashboard"
import { redirect } from "next/navigation"
import { getDashboardContext } from "@/lib/auth-context"

export default async function BranchLoyaltyPage({ params }: { params: { branchSlug: string } }) {
    const context = await getDashboardContext(params.branchSlug)
    if (!context || !context.userId) {
        redirect("/dashboard")
    }

    const program = await getLoyaltyProgram(context.userId)

    return (
        <div className="p-0 md:p-8 max-w-5xl mx-auto">
            <div className="mb-8">
                <h1 className="text-3xl font-bold bg-gradient-to-r from-violet-400 via-fuchsia-400 to-white bg-clip-text text-transparent inline-block">
                    Programa de Lealtad ({context.name})
                </h1>
                <p className="text-gray-400 mt-2">Motor de reglas, estatus y recompensas automatizadas</p>
            </div>

            <LoyaltyDashboard userId={context.userId} program={program} />
        </div>
    )
}
