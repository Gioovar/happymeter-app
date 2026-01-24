import { prisma } from '@/lib/prisma'
import { toggleCreatorStatus } from '@/actions/staff'
import { CheckCircle, AlertCircle } from 'lucide-react'
import StatusToggle from '@/components/staff/StatusToggle'
import PendingCreatorCard from '@/components/staff/PendingCreatorCard'
import CreatorListTable from '@/components/staff/CreatorListTable'

export default async function StaffCreatorsPage() {

    // Fetch Pending first
    const pendingCreators = await prisma.affiliateProfile.findMany({
        where: { status: 'PENDING' },
        orderBy: { createdAt: 'desc' }
    })

    // Fetch others with aggregation
    const otherCreatorsData = await prisma.affiliateProfile.findMany({
        where: { status: { not: 'PENDING' } },
        orderBy: { createdAt: 'desc' },
        take: 50,
        include: {
            commissions: { select: { amount: true } },
            payouts: { select: { amount: true } }
        }
    })

    const otherCreators = otherCreatorsData.map(c => ({
        ...c,
        totalEarnings: c.commissions.reduce((sum, com) => sum + com.amount, 0),
        totalPaid: c.payouts.reduce((sum, pay) => sum + pay.amount, 0)
    }))

    return (
        <div className="space-y-12">

            {/* PENDING SECTION */}
            <div className="space-y-4">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-yellow-500" />
                    Solicitudes Pendientes ({pendingCreators.length})
                </h2>

                {pendingCreators.length === 0 ? (
                    <div className="p-6 border border-dashed border-white/10 rounded-xl text-center text-gray-500">
                        No hay solicitudes pendientes. ¡Buen trabajo!
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-4">
                        {pendingCreators.map(creator => (
                            <PendingCreatorCard key={creator.id} creator={creator} />
                        ))}
                    </div>
                )}
            </div>

            {/* ACTIVE/SUSPENDED SECTION */}
            <div className="space-y-4">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-blue-500" />
                    Directorio de Creadores
                </h2>

                <div className="bg-[#111] border border-white/10 rounded-xl overflow-hidden">
                    <CreatorListTable creators={otherCreators} />
                </div>
            </div>
        </div>
    )
}
