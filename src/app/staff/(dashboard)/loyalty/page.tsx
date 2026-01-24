import { auth } from "@clerk/nextjs/server"
import { StaffScanner } from "@/components/loyalty/StaffScanner"
import { redirect } from "next/navigation"

export default async function StaffLoyaltyPage() {
    const { userId } = await auth()
    if (!userId) redirect("/sign-in")

    // In a real app we might verify if the user has STAFF role here
    // For now assuming the layout/middleware handles general auth access to /staff

    return (
        <div className="p-4 max-w-md mx-auto">
            <div className="mb-6 text-center">
                <h1 className="text-2xl font-bold text-slate-900">Escaner de Lealtad</h1>
                <p className="text-slate-500">Registra visitas y entrega premios</p>
            </div>

            <StaffScanner staffId={userId} />
        </div>
    )
}
