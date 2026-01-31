import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { getStaffRedemptionHistory } from "@/actions/loyalty"
import { History, Tag, User, Clock, Image as ImageIcon, CheckCircle2, Video } from "lucide-react"
import { prisma } from "@/lib/prisma"
import HistoryList from "@/components/ops/HistoryList"

// Helper to fetch task history
async function getStaffTaskHistory(userId: string) {
    const evidences = await prisma.processEvidence.findMany({
        where: { staffId: userId },
        orderBy: { submittedAt: 'desc' },
        take: 20,
        include: {
            task: {
                select: {
                    title: true,
                    zone: {
                        select: { name: true }
                    }
                }
            }
        }
    });
    return evidences;
}

export default async function OpsHistoryPage() {
    const { userId } = await auth()
    if (!userId) redirect("/ops/login")

    const [redemptions, tasks] = await Promise.all([
        getStaffRedemptionHistory(userId),
        getStaffTaskHistory(userId)
    ]);

    // Merge for timeline? Or tabs?
    // Let's just show two sections for now or a mixed list sorted by date.

    // Normalize data to a common shape
    const combinedHistory = [
        ...redemptions.map(r => ({
            id: r.id,
            type: 'REDEMPTION' as const,
            title: `Canje: ${r.rewardName} `,
            subtitle: r.customerName,
            date: r.redeemedAt,
            image: r.evidenceUrl,
            status: 'COMPLETED'
        })),
        ...tasks.map(t => ({
            id: t.id,
            type: 'TASK' as const,
            title: t.task.title,
            subtitle: t.task.zone.name,
            date: t.submittedAt.toISOString(),
            image: t.fileUrl,
            status: (t as any).validationStatus || 'PENDING'
        }))
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return (
        <div className="max-w-md mx-auto pb-20">
            <div className="mb-6 flex items-center gap-3">
                <div className="bg-indigo-500/10 p-3 rounded-2xl">
                    <History className="w-6 h-6 text-indigo-400" />
                </div>
                <div>
                    <h1 className="text-xl font-bold text-white">Historial de Actividad</h1>
                    <p className="text-slate-400 text-sm">Tus últimos movimientos</p>
                </div>
            </div>

            {combinedHistory.length === 0 ? (
                <div className="text-center py-12 bg-white/5 rounded-3xl border border-dashed border-white/10">
                    <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-500">
                        <Tag className="w-8 h-8" />
                    </div>
                    <p className="text-slate-400 font-medium">Sin movimientos recientes</p>
                    <p className="text-slate-600 text-sm mt-1">Tu actividad aparecerá aquí</p>
                </div>
            ) : (
                <HistoryList items={combinedHistory} />
            )}
        </div>
    )
}
