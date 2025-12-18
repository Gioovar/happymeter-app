
import { Suspense } from 'react'
import { getAuditLogs } from '@/actions/admin'
import AuditTable from '@/components/admin/AuditTable'
import { Loader2, ScrollText } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function AdminAuditPage() {
    const logs = await getAuditLogs()

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-bold text-white">Auditoría del Sistema</h1>
                    <p className="text-gray-400 mt-1">Registro de actividad administrativa y eventos críticos.</p>
                </div>
                <div className="bg-white/5 border border-white/10 px-4 py-2 rounded-xl flex items-center gap-3">
                    <ScrollText className="w-4 h-4 text-gray-400" />
                    <span className="text-sm font-mono text-gray-400">{logs.length} eventos</span>
                </div>
            </div>

            <Suspense fallback={
                <div className="flex justify-center p-12">
                    <Loader2 className="w-8 h-8 text-violet-500 animate-spin" />
                </div>
            }>
                <AuditTable logs={logs} />
            </Suspense>
        </div>
    )
}
