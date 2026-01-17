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

    // Check if user is an owner of at least one chain
    const ownedChain = chains.find(c => c.ownerId === user.id)

    if (!ownedChain) {
        <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col items-center justify-center p-4">
            <div className="max-w-5xl w-full space-y-12">

                {/* Hero Section */}
                <div className="text-center space-y-6">
                    <div className="inline-flex items-center justify-center p-4 rounded-full bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 border border-violet-500/30 ring-1 ring-violet-500/50 shadow-[0_0_30px_rgba(139,92,246,0.2)]">
                        <GitBranch className="w-12 h-12 text-violet-400" />
                    </div>
                    <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-gray-200 to-gray-500">
                        Domina tu Imperio
                    </h1>
                    <p className="max-w-2xl mx-auto text-lg text-gray-400 leading-relaxed">
                        Eleva tu negocio al siguiente nivel. Centraliza la operación de todas tus sucursales con el
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-yellow-600 font-bold"> Dashboard de Cadenas</span>.
                    </p>
                </div>

                <div className="grid gap-8 md:grid-cols-2 lg:gap-12 items-stretch">

                    {/* Upgrade Card */}
                    <div className="relative group">
                        <div className="absolute inset-0 bg-gradient-to-r from-violet-600 to-fuchsia-600 rounded-3xl blur opacity-20 group-hover:opacity-40 transition duration-500" />
                        <Card className="relative h-full bg-[#111] border-white/10 text-white overflow-hidden backdrop-blur-xl">
                            <CardHeader className="pb-8">
                                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-yellow-600 flex items-center justify-center mb-6 shadow-lg shadow-amber-500/20">
                                    <Store className="w-6 h-6 text-white" />
                                </div>
                                <CardTitle className="text-3xl font-bold">Crear Cadena</CardTitle>
                                <CardDescription className="text-gray-400 text-base mt-2">
                                    Transforma tu cuenta actual en la sede principal y comienza a agregar sucursales.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-8">
                                <ul className="space-y-4">
                                    {[
                                        "Panel de control centralizado",
                                        "Navegación instantánea entre sedes",
                                        "Gestión unificada de usuarios (Próx.)",
                                        "Analíticas comparativas (Próx.)"
                                    ].map((item, i) => (
                                        <li key={i} className="flex items-center text-gray-300">
                                            <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center mr-3 border border-green-500/30">
                                                <svg className="w-3 h-3 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                                            </div>
                                            {item}
                                        </li>
                                    ))}
                                </ul>

                                <div className="pt-4">
                                    <CreateBranchModal isFirstChain />
                                </div>
                                <p className="text-xs text-center text-gray-500">
                                    Tu suscripción actual se mantendrá en la sede principal.
                                </p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Visual / Feature Preview */}
                    <div className="relative hidden md:block">
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 rounded-3xl" />
                        <Card className="h-full bg-white/5 border-white/10 text-white overflow-hidden backdrop-blur-md flex flex-col">
                            <CardHeader>
                                <CardTitle className="text-xl text-gray-200">Visión Global</CardTitle>
                            </CardHeader>
                            <CardContent className="flex-1 flex items-center justify-center p-0 relative">
                                {/* Abstract representation of multiple dashboards */}
                                <div className="relative w-full max-w-sm h-64 perspective-1000">
                                    <div className="absolute top-0 left-10 right-10 bottom-10 bg-[#1a1a1a] rounded-xl border border-white/10 shadow-2xl transform translate-z-[-20px] scale-90 opacity-60"></div>
                                    <div className="absolute top-4 left-5 right-5 bottom-6 bg-[#222] rounded-xl border border-white/10 shadow-2xl transform translate-z-[-10px] scale-95 opacity-80"></div>
                                    <div className="absolute top-8 left-0 right-0 bottom-0 bg-[#0a0a0a] rounded-xl border border-white/10 shadow-[0_0_40px_rgba(0,0,0,0.5)] flex flex-col p-4">
                                        <div className="flex items-center gap-3 mb-4 border-b border-white/10 pb-3">
                                            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-violet-600 to-indigo-600" />
                                            <div className="h-2 w-24 bg-white/10 rounded-full" />
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="h-20 bg-white/5 rounded-lg border border-white/5" />
                                            <div className="h-20 bg-white/5 rounded-lg border border-white/5" />
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    }

    return (
        <div className="container py-8 space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">{ownedChain.name}</h1>
                    <p className="text-muted-foreground">Dashboard de Cadenas</p>
                </div>
                <div className="flex items-center gap-2">
                    <CreateBranchModal chainId={ownedChain.id} />
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {ownedChain.branches.map((branch) => (
                    <BranchCard
                        key={branch.id}
                        branch={branch}
                        isCurrent={branch.branch.userId === user.id}
                    />
                ))}
            </div>
        </div>
    )
}
