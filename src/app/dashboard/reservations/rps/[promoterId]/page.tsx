import { getDashboardContext } from "@/lib/auth-context"
import { getPromoterAnalytics, getPromoterSettlements } from "@/actions/promoters"
import { prisma } from "@/lib/prisma"
import { PromoterAnalytics } from "@/components/dashboard/reservations/PromoterAnalytics"
import { PromoterSettlements } from "@/components/dashboard/reservations/PromoterSettlements"
import { ChevronLeft, Target } from "lucide-react"
import Link from "next/link"
import { notFound } from "next/navigation"

export default async function PromoterDashboardPage({ params }: { params: { promoterId: string } }) {
    const context = await getDashboardContext()
    if (!context) return null

    const promoter = await prisma.promoterProfile.findUnique({
        where: { id: params.promoterId, businessId: context.userId }
    })

    if (!promoter) notFound()

    const { stats } = await getPromoterAnalytics(params.promoterId)
    const { settlements } = await getPromoterSettlements(params.promoterId)

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center gap-4">
                <Link href="/dashboard/reservations/rps" className="p-2 hover:bg-white/5 rounded-full transition-colors">
                    <ChevronLeft className="w-6 h-6 text-zinc-400" />
                </Link>
                <div>
                    <div className="flex items-center gap-2">
                        <Target className="w-5 h-5 text-indigo-500" />
                        <h1 className="text-2xl font-bold text-white">{promoter.name}</h1>
                    </div>
                    <p className="text-zinc-400 text-sm">Dashboard de Rendimiento Individual</p>
                </div>
            </div>

            <PromoterAnalytics stats={stats as any} promoter={promoter} />

            <div className="pt-6 border-t border-white/5">
                <PromoterSettlements initialSettlements={settlements || []} promoterId={params.promoterId} />
            </div>
        </div>
    )
}
