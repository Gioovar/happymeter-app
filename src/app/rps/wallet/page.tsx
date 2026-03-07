import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { getGlobalPromoterWallet, logoutGlobalPromoter } from "@/actions/promoters"
import { ShieldCheck, CalendarCheck, DollarSign, Wallet2, Sparkles, Building2, ChevronRight, LogOut, ArrowRight } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import RpsPushInitializer from "@/components/rps/RpsPushInitializer"

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-MX', {
        style: 'currency',
        currency: 'MXN',
        minimumFractionDigits: 0
    }).format(value);
}

export const metadata = {
    title: "Wallet | RPS HappyMeter",
}

export default async function RpsWalletPage() {
    const cookieStore = await cookies()
    const sessionPhone = cookieStore.get('rps_global_session')?.value

    if (!sessionPhone) {
        redirect('/rps')
    }

    const walletResponse = await getGlobalPromoterWallet(sessionPhone)

    if (!walletResponse.success || !walletResponse.data) {
        redirect('/rps')
    }

    const { globalProfile, places, stats } = walletResponse.data

    return (
        <main className="min-h-screen bg-[#050505] text-white selection:bg-indigo-500/30 font-sans pb-24">
            <RpsPushInitializer globalPromoterId={globalProfile.id} />
            {/* Background Effects */}
            <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[400px] bg-indigo-500/10 blur-[120px] rounded-full pointer-events-none" />

            {/* Header */}
            <header className="sticky top-0 z-40 bg-black/50 backdrop-blur-xl border-b border-white/10 px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20 ring-1 ring-white/10 overflow-hidden relative">
                        {globalProfile.avatarUrl ? (
                            <Image src={globalProfile.avatarUrl} alt="Avatar" fill className="object-cover" />
                        ) : (
                            <Sparkles className="w-5 h-5 text-white" />
                        )}
                    </div>
                    <div>
                        <h1 className="font-bold text-lg leading-none">{globalProfile.name}</h1>
                        <p className="text-xs text-zinc-400 font-mono mt-1">Nivel {globalProfile.rpScore >= 4.5 ? '🏆 Oro' : globalProfile.rpScore >= 4.0 ? '🥈 Plata' : '🥉 Bronce'}</p>
                    </div>
                </div>

                <form action={logoutGlobalPromoter}>
                    <button type="submit" className="p-2 rounded-xl hover:bg-white/5 text-zinc-400 hover:text-white transition-colors">
                        <LogOut className="w-5 h-5" />
                    </button>
                </form>
            </header>

            <div className="max-w-md mx-auto px-6 py-8 space-y-8 relative z-10">
                {/* Balance Hero */}
                <div className="text-center space-y-2 animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <p className="text-sm font-bold text-zinc-400 uppercase tracking-widest flex items-center justify-center gap-2">
                        <Wallet2 className="w-4 h-4" /> Billetera Total
                    </p>
                    <h2 className="text-6xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-indigo-400 via-white to-zinc-500">
                        {formatCurrency(stats.totalPending)}
                    </h2>
                    <p className="text-sm font-semibold text-emerald-400">
                        + {formatCurrency(stats.totalPaid)} cobrados
                    </p>
                    <div className="flex items-center justify-center gap-4 mt-4 pt-4 border-t border-white/10 max-w-[200px] mx-auto">
                        <div className="text-center">
                            <p className="text-2xl font-bold">{stats.totalConfirmedAttendees}</p>
                            <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Personas</p>
                        </div>
                        <div className="w-px h-8 bg-white/10" />
                        <div className="text-center">
                            <p className="text-2xl font-bold">{stats.totalReservations}</p>
                            <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Reservas</p>
                        </div>
                    </div>
                </div>

                {/* Places Directory */}
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-150 relative">
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-bold flex items-center gap-2">
                            <Building2 className="w-5 h-5 text-indigo-400" />
                            Mis Sucursales ({stats.placesCount})
                        </h3>
                    </div>

                    <div className="grid gap-3">
                        {places.map((place: any) => (
                            <Link
                                key={place.businessId}
                                href={`/rps/${place.slug}`}
                                className="block group"
                            >
                                <div className="bg-zinc-900/40 hover:bg-zinc-900/80 border border-white/5 hover:border-indigo-500/50 rounded-2xl p-4 transition-all duration-300 relative overflow-hidden">
                                    <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/0 via-indigo-500/0 to-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />

                                    <div className="flex items-center justify-between relative z-10">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-xl bg-black border border-white/10 overflow-hidden relative flex items-center justify-center shrink-0">
                                                {place.logoUrl ? (
                                                    <Image src={place.logoUrl} alt={place.name} fill className="object-cover" />
                                                ) : (
                                                    <Building2 className="w-5 h-5 text-zinc-600" />
                                                )}
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-base group-hover:text-indigo-300 transition-colors">{place.name}</h4>
                                                <div className="flex items-center gap-3 mt-1 text-xs font-medium text-zinc-500">
                                                    <span className="flex items-center gap-1"><CalendarCheck className="w-3 h-3" /> {place.totalReservations} </span>
                                                    <span className="flex items-center gap-1">
                                                        <DollarSign className="w-3 h-3 text-indigo-400" />
                                                        {formatCurrency(place.pending)}
                                                        <span className="text-zinc-600 block sm:inline">({formatCurrency(place.paid)} pagado)</span>
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="w-8 h-8 rounded-full bg-white/5 group-hover:bg-indigo-500/20 flex items-center justify-center transition-colors">
                                            <ChevronRight className="w-4 h-4 text-zinc-500 group-hover:text-indigo-400" />
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        ))}

                        {places.length === 0 && (
                            <div className="text-center py-10 px-6 bg-zinc-900/30 rounded-2xl border border-white/5 border-dashed">
                                <ShieldCheck className="w-10 h-10 text-zinc-600 mx-auto mb-3" />
                                <h3 className="text-lg font-bold text-white mb-2">Aún no tienes sucursales</h3>
                                <p className="text-sm text-zinc-500">Pídele al administrador o dueño de la sucursal que te dé de alta usando tu número de celular ({sessionPhone}).</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </main>
    )
}
