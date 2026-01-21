
import { Suspense } from 'react'
import { getSubscriptions } from '@/actions/admin-dashboard'
import SubscriptionsTable from '@/components/admin/SubscriptionsTable'
import { Loader2 } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function AdminPlansPage() {
    const subscriptions = await getSubscriptions()

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-bold text-white">Suscripciones</h1>
                    <p className="text-gray-400 mt-1">Monitoreo de pagos y estados de Stripe.</p>
                </div>
                <div className="text-right">
                    <p className="text-xs text-gray-500">Total Suscriptores (No-Free)</p>
                    <p className="text-2xl font-bold text-white">{subscriptions.length}</p>
                </div>
            </div>

            <Suspense fallback={
                <div className="flex justify-center p-12">
                    <Loader2 className="w-8 h-8 text-violet-500 animate-spin" />
                </div>
            }>
                <SubscriptionsTable subscriptions={subscriptions} />
            </Suspense>
        </div>
    )
}
