import { auth } from "@clerk/nextjs/server"
import { getLoyaltyProgram } from "@/actions/loyalty"
import { RedemptionHistory } from "@/components/loyalty/RedemptionHistory"
import { redirect } from "next/navigation"

export default async function LoyaltyHistoryPage() {
    const { userId } = await auth()
    if (!userId) redirect("/sign-in")

    const program = await getLoyaltyProgram(userId)

    if (!program) {
        return (
            <div className="p-8 text-center text-gray-400">
                No tienes un programa de lealtad activo.
            </div>
        )
    }

    return (
        <div className="p-4 md:p-8 max-w-5xl mx-auto">
            <div className="mb-8">
                <h1 className="text-3xl font-bold bg-gradient-to-r from-violet-400 via-fuchsia-400 to-white bg-clip-text text-transparent inline-block">
                    Historial de Premios
                </h1>
                <p className="text-gray-400 mt-2">
                    Registro detallado de recompensas entregadas por fecha.
                </p>
            </div>
            <RedemptionHistory programId={program.id} />
        </div>
    )
}
