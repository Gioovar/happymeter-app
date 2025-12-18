
import { Suspense } from 'react'
import { getSystemSettings } from '@/actions/admin'
import AdminSettingsClient from '@/components/admin/AdminSettingsClient'
import { Loader2 } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function AdminSettingsPage() {
    const settings = await getSystemSettings()

    return (
        <Suspense fallback={
            <div className="flex justify-center p-12">
                <Loader2 className="w-8 h-8 text-violet-500 animate-spin" />
            </div>
        }>
            <AdminSettingsClient initialSettings={settings} />
        </Suspense>
    )
}
