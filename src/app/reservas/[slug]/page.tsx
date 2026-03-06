import { getFranchiseBySlug, type FranchiseBySlugResponse } from "@/actions/franchise"
import { notFound } from "next/navigation"
import Image from "next/image"
import { Building2, Store, ArrowRight, ExternalLink } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default async function FranchiseReservationSelector({
    params
}: {
    params: { slug: string }
}) {
    const { slug } = params
    const result = await getFranchiseBySlug(slug) as FranchiseBySlugResponse

    if (!result || !result.success || !result.franchise) {
        notFound()
    }

    const { franchise } = result

    return (
        <main className="min-h-screen bg-black text-white selection:bg-violet-500/30 flex flex-col items-center pb-20">
            {/* Header Area */}
            <div className="w-full bg-gradient-to-b from-violet-900/20 to-black pt-16 pb-10 px-6 flex flex-col items-center text-center relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.03] mix-blend-overlay pointer-events-none" />

                <div className="relative w-24 h-24 mb-6 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 shadow-[0_0_40px_rgba(139,92,246,0.3)] overflow-hidden flex items-center justify-center p-1 group">
                    <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                    {franchise.logoUrl ? (
                        <Image
                            src={franchise.logoUrl}
                            alt={franchise.name}
                            fill
                            className="object-cover rounded-2xl"
                        />
                    ) : (
                        <Store className="w-10 h-10 text-white" />
                    )}
                </div>

                <h1 className="text-3xl font-extrabold tracking-tight mb-2 text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400">
                    {franchise.name}
                </h1>
                <p className="text-sm font-medium text-violet-300 uppercase tracking-widest flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-violet-500 shadow-[0_0_10px_rgba(139,92,246,0.8)] animate-pulse" />
                    Selecciona tu sucursal
                </p>
            </div>

            {/* Branch List */}
            <div className="w-full max-w-md px-4 mt-4 space-y-3 z-10">
                {franchise.branches.length === 0 ? (
                    <div className="text-center p-8 border border-dashed border-white/10 rounded-3xl bg-white/[0.02]">
                        <Building2 className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-300">Próximamente</h3>
                        <p className="text-sm text-gray-500 mt-2">Estamos preparando nuestras sucursales para ti.</p>
                    </div>
                ) : (
                    franchise.branches.map((b) => {
                        const branchName = b.name && b.name !== "Sede Principal"
                            ? b.name
                            : b.branch.businessName || "Sucursal";

                        // Determine routing logic
                        const isExternal = b.reservationType === "EXTERNAL" && b.externalReservationUrl;

                        // Internal reservations MUST go via `/book/[clerkUserId]`, 
                        // as implemented in the system (the map lookup uses the branch ownerId, which is branchId in the pivot).
                        const linkHref = isExternal ? b.externalReservationUrl! : `/book/${b.branchId}`;

                        return (
                            <a
                                href={linkHref}
                                key={b.id}
                                target={isExternal ? "_blank" : undefined}
                                rel={isExternal ? "noopener noreferrer" : undefined}
                                className="block group relative"
                            >
                                <div className="absolute -inset-[1px] rounded-2xl bg-gradient-to-b from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition duration-300 pointer-events-none" />

                                <div className="relative p-4 rounded-2xl bg-[#0d0d0d] border border-white/5 shadow-xl hover:bg-white/[0.04] transition-all duration-300 overflow-hidden flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 bg-white/5 rounded-xl border border-white/5 border-t-white/10 group-hover:bg-violet-500/20 group-hover:border-violet-500/30 transition-colors">
                                            <Building2 className="w-5 h-5 text-gray-400 group-hover:text-violet-400 transition-colors" />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-bold text-gray-200 group-hover:text-white transition-colors">
                                                {branchName}
                                            </h3>
                                            {b.address && (
                                                <p className="text-xs text-gray-500 mt-0.5 max-w-[200px] truncate">
                                                    {b.address}
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="p-2 bg-white/5 rounded-full group-hover:bg-violet-500 text-gray-400 group-hover:text-white transition-colors shadow-inner">
                                        {isExternal ? (
                                            <ExternalLink className="w-4 h-4" />
                                        ) : (
                                            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                                        )}
                                    </div>
                                </div>
                            </a>
                        )
                    })
                )}
            </div>

            <div className="mt-12 opacity-40 hover:opacity-100 transition-opacity">
                <p className="text-[10px] text-gray-500 font-medium uppercase tracking-widest flex items-center gap-2">
                    Powered by
                    <span className="font-bold text-white flex items-center gap-1">
                        <span className="w-3 h-3 rounded bg-gradient-to-br from-violet-500 to-indigo-500" />
                        HappyMeter
                    </span>
                </p>
            </div>
        </main>
    )
}
