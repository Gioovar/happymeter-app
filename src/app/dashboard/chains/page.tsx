import { currentUser } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { getChainDetails } from '@/actions/chain'
import BranchCard from '@/components/chains/BranchCard'
import CreateBranchModal from '@/components/chains/CreateBranchModal'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { GitBranch, Store } from 'lucide-react'

export default async function DashboardChainsPage() {
    const user = await currentUser()
    if (!user) redirect('/sign-in')

    const chains = await getChainDetails() || []

    // Check for ownership OR membership
    const ownedChain = chains.find(c => c.ownerId === user.id) || chains.find(c => c.branches.some(b => b.branchId === user.id))
    const isOwner = ownedChain?.ownerId === user.id

    if (!ownedChain) {
        return (
            <div className="container max-w-4xl py-10 space-y-8">
                <div className="flex flex-col items-center justify-center space-y-4 text-center">
                    <div className="p-4 bg-primary/10 rounded-full">
                        <GitBranch className="w-12 h-12 text-primary" />
                    </div>
                    <h1 className="text-3xl font-bold tracking-tighter">Dashboard de Cadenas</h1>
                    <p className="max-w-[600px] text-muted-foreground">
                        Gestiona múltiples sucursales desde un solo lugar. Ideal para franquicias y grupos restauranteros.
                    </p>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                    <Card className="bg-[#111] border-white/10">
                        <CardHeader>
                            <CardTitle>¿Tienes múltiples negocios?</CardTitle>
                            <CardDescription>
                                Centraliza la operación de todas tus sucursales.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <ul className="space-y-2 text-sm text-gray-400">
                                <li className="flex items-center">
                                    <Store className="w-4 h-4 mr-2" /> Panel de control unificado
                                </li>
                                <li className="flex items-center">
                                    <Store className="w-4 h-4 mr-2" /> Cambio rápido entre sucursales
                                </li>
                                <li className="flex items-center">
                                    <Store className="w-4 h-4 mr-2" /> Reportes consolidados (Próximamente)
                                </li>
                            </ul>

                            <CreateBranchModal isFirstChain />
                        </CardContent>
                    </Card>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-full py-8 space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-white/5">
                <div className="space-y-2">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-gradient-to-br from-violet-600 to-indigo-600 rounded-lg shadow-lg shadow-violet-500/20">
                            <GitBranch className="w-6 h-6 text-white" />
                        </div>
                        <h1 className="text-4xl font-bold tracking-tight text-white">{ownedChain.name}</h1>
                    </div>
                    <div className="flex items-center gap-3 text-gray-400 pl-1">
                        <p className="text-lg font-medium">Panel de Control Corporativo</p>
                        {!isOwner && (
                            <span className="px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-500 text-xs font-bold uppercase tracking-wide">
                                Vista Limitada
                            </span>
                        )}
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    {isOwner && <CreateBranchModal chainId={ownedChain.id} />}
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3">
                {ownedChain.branches.map((branch) => (
                    <BranchCard
                        key={branch.id}
                        branch={branch}
                        isCurrent={branch.branch.userId === user.id}
                        isOwner={isOwner}
                        ownerId={ownedChain.ownerId}
                    />
                ))}

                {/* Add Branch Ghost Card (Visible only to owner) */}
                {isOwner && (
                    <div className="group relative flex flex-col items-center justify-center h-full min-h-[240px] border-2 border-dashed border-white/5 rounded-3xl bg-white/[0.02] hover:bg-white/[0.05] hover:border-violet-500/30 transition-all duration-300 cursor-pointer overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        <div className="relative p-6 text-center space-y-4">
                            <div className="mx-auto p-4 rounded-full bg-white/5 group-hover:bg-violet-500/20 transition-colors duration-300">
                                <Store className="w-8 h-8 text-gray-500 group-hover:text-violet-400 transition-colors" />
                            </div>
                            <div>
                                <h3 className="text-lg font-medium text-gray-300 group-hover:text-white transition-colors">Nueva Sucursal</h3>
                                <p className="text-sm text-gray-500 group-hover:text-gray-400">Expande tu negocio hoy</p>
                            </div>
                            <CreateBranchModal chainId={ownedChain.id} triggerClassName="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
