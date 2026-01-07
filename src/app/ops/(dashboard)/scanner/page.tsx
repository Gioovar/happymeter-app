import { auth } from "@clerk/nextjs/server"
import { StaffScanner } from "@/components/loyalty/StaffScanner"
import { redirect } from "next/navigation"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

export default async function OpsScannerPage() {
    const { userId } = await auth()
    if (!userId) redirect("/sign-in")

    return (
        <div className="max-w-md mx-auto">
            <div className="mb-6 flex items-center gap-4">
                <Link href="/ops" className="p-2 -ml-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-full transition-colors">
                    <ArrowLeft className="w-6 h-6" />
                </Link>
                <h1 className="text-xl font-bold text-white">Escaner</h1>
            </div>

            <StaffScanner staffId={userId} />
        </div>
    )
}
