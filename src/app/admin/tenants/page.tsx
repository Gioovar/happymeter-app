
import { Suspense } from 'react'
import { getTenants } from '@/actions/admin'
import TenantsTable from '@/components/admin/TenantsTable'
import { Loader2 } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function AdminTenantsPage() {
    const tenants = await getTenants()

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-bold text-white">Negocios (Tenants)</h1>
                    <p className="text-gray-400 mt-1">Gestiona los {tenants.length} negocios registrados en la plataforma.</p>
                </div>
                <button className="bg-white text-black px-4 py-2 rounded-lg font-bold hover:bg-gray-200 transition">
                    + Nuevo Negocio Manual
                </button>
            </div>

            <Suspense fallback={
                <div className="flex justify-center p-12">
                    <Loader2 className="w-8 h-8 text-red-500 animate-spin" />
                </div>
            }>
                <TenantsTable initialTenants={tenants} />
            </Suspense>
        </div>
    )
}
