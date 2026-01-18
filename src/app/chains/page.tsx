import { currentUser } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { getChainDetails } from '@/actions/chain'
import BranchCard from '@/components/chains/BranchCard'
import CreateBranchModal from '@/components/chains/CreateBranchModal'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { GitBranch, Store } from 'lucide-react'

export default async function ChainsPage() {
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
                    <Card>
                        <CardHeader>
                            <CardTitle>¿Tienes múltiples negocios?</CardTitle>
                            <CardDescription>
                                Centraliza la operación de todas tus sucursales.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <ul className="space-y-2 text-sm text-muted-foreground">
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

                    <Card className="bg-muted/50 border-dashed">
                        <CardHeader>
                            <CardTitle className="text-muted-foreground">Vista Previa</CardTitle>
                        </CardHeader>
                        <CardContent className="flex items-center justify-center h-[200px] text-muted-foreground">
                            Gestión centralizada
                        </CardContent>
                    </Card>
                </div>
            </div>
        )
    }

    return (
        <div className="container py-8 space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">{ownedChain.name}</h1>
                    <div className="flex items-center gap-2 text-muted-foreground">
                        <p>Dashboard de Cadenas</p>
                        {!isOwner && <span className="px-2 py-0.5 bg-muted rounded-full text-xs">Vista de Sucursal</span>}
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {isOwner && <CreateBranchModal chainId={ownedChain.id} />}
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {ownedChain.branches.map((branch) => (
                    <BranchCard
                        key={branch.id}
                        branch={branch}
                        isCurrent={branch.branch.userId === user.id}
                        isOwner={isOwner}
                        ownerId={ownedChain.ownerId}
                    />
                ))}
            </div>
        </div>
    )
}
