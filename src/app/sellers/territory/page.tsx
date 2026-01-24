import { getTerritoryBusinesses } from '@/actions/sellers'

export default async function TerritoryPage() {
    const businesses = await getTerritoryBusinesses()

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-white">Mi Territorio</h1>
                <p className="text-gray-400">Negocios registrados en tu estado.</p>
            </div>

            <div className="bg-[#111] border border-white/10 rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-white/5 text-left text-xs text-gray-400 uppercase">
                            <tr>
                                <th className="px-6 py-4">Negocio</th>
                                <th className="px-6 py-4">Ciudad</th>
                                <th className="px-6 py-4">Plan</th>
                                <th className="px-6 py-4">Estado</th>
                                <th className="px-6 py-4">Registrado</th>
                                <th className="px-6 py-4">Contacto</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/10">
                            {businesses.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                                        No hay negocios en tu territorio aún.
                                    </td>
                                </tr>
                            ) : (
                                businesses.map((biz) => (
                                    <tr key={biz.id} className="text-sm text-gray-300">
                                        <td className="px-6 py-4 font-medium text-white">
                                            {biz.businessName || 'Sin Nombre'}
                                        </td>
                                        <td className="px-6 py-4">{biz.city || '-'}</td>
                                        <td className="px-6 py-4">
                                            <span className="px-2 py-1 rounded-full bg-blue-500/10 text-blue-400 text-xs font-medium border border-blue-500/20">
                                                {biz.plan}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            {biz.subscriptionStatus === 'active' ? (
                                                <span className="text-emerald-400 flex items-center gap-1">
                                                    ● Activo
                                                </span>
                                            ) : (
                                                <span className="text-gray-500">Inactivo</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            {new Date(biz.createdAt).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4">
                                            {biz.phone && (
                                                <a
                                                    href={`https://wa.me/${biz.phone.replace(/\D/g, '')}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-emerald-500 hover:text-emerald-400 hover:underline"
                                                >
                                                    WhatsApp
                                                </a>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
