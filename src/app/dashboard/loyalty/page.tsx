import { auth } from "@clerk/nextjs/server"
import { getLoyaltyProgram } from "@/actions/loyalty"
import { LoyaltyDashboard } from "@/components/loyalty/LoyaltyDashboard"
import { redirect } from "next/navigation"

export default async function LoyaltyPage() {
    const { userId } = await auth()
    if (!userId) {
        redirect("/sign-in")
    }

    const program = await getLoyaltyProgram(userId)

    return (
        <div className="p-8 max-w-5xl mx-auto">
            <div className="mb-8">
                <h1 className="text-3xl font-bold bg-gradient-to-r from-violet-400 via-fuchsia-400 to-white bg-clip-text text-transparent inline-block">
                    Programa de Lealtad (Avanzado)
                </h1>
                <p className="text-gray-400 mt-2">Motor de reglas, estatus y recompensas automatizadas</p>
            </div>

            <LoyaltyDashboard userId={userId} program={program} />
        </div>
    )
}
