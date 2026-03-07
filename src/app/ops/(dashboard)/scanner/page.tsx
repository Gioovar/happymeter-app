import { getOpsSession } from "@/lib/ops-auth"
import { StaffScanner } from "@/components/loyalty/StaffScanner"
import { redirect } from "next/navigation"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

export default async function OpsScannerPage() {
    const session = await getOpsSession()

    if (!session.isAuthenticated) redirect("/ops/login")
    if (session.requiresContextSelection) redirect("/ops/select-context")
    if (!session.userId && !session.member) redirect("/ops/login")

    // The context owner ID is the branch/business the staff is currently operating under
    const activeBranchId = session.member?.ownerId || session.userId

    return (
        <div className="max-w-md mx-auto">
            <div className="mb-6 flex items-center gap-4">
                <Link href="/ops" className="p-2 -ml-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-full transition-colors">
                    <ArrowLeft className="w-6 h-6" />
                </Link>
                <h1 className="text-xl font-bold text-white">Escaner</h1>
            </div>

            <StaffScanner staffId={session.userId || session.member?.id || ''} branchId={activeBranchId} />
        </div>
    )
}
