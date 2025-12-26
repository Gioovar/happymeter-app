import { getRepresentatives } from '@/actions/admin-representatives'
import RepresentativesTable from '@/components/admin/RepresentativesTable'
import { ShieldCheck, Users } from 'lucide-react'

export default async function AdminRepresentativesPage() {
    const representatives = await getRepresentatives()

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                        <ShieldCheck className="w-8 h-8 text-blue-500" />
                        Gestión de Embajadores
                    </h1>
                    <p className="text-gray-400 mt-1">Revisa solicitudes y asigna comisiones personalizadas.</p>
                </div>
                <div className="bg-blue-500/10 border border-blue-500/20 px-4 py-2 rounded-xl flex items-center gap-3">
                    <Users className="w-5 h-5 text-blue-500" />
                    <div>
                        <p className="text-xs text-blue-400 font-bold uppercase">Total Solicitudes</p>
                        <p className="text-xl font-bold text-white">{representatives.length}</p>
                    </div>
                </div>
            </div>

            <RepresentativesTable representatives={representatives} />
        </div>
    )
}
