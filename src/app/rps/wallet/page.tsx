import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { getGlobalPromoterWallet, logoutGlobalPromoter } from "@/actions/promoters"
import { ShieldCheck, CalendarCheck, DollarSign, Wallet2, Sparkles, Building2, ChevronRight, LogOut, ArrowRight, User } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import RpsPushInitializer from "@/components/rps/RpsPushInitializer"
import { B2BReferralDialog } from "./B2BReferralDialog"
import { EditProfileDialog } from "./EditProfileDialog"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

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
                    <div className="w-10 h-10 rounded-xl bg-indigo-600/20 flex items-center justify-center border border-indigo-500/30">
                        <Wallet2 className="w-5 h-5 text-indigo-400" />
                    </div>
                    <div>
                        <h1 className="font-bold text-lg leading-none">Mi Billetera RP</h1>
                        <p className="text-xs text-zinc-400 font-medium mt-1">Gestión global</p>
                    </div>
                </div>

                <DropdownMenu>
                    <DropdownMenuTrigger className="flex items-center gap-3 outline-none group bg-zinc-900/40 hover:bg-zinc-800/60 p-1.5 pl-3 rounded-full border border-white/5 transition-colors">
                        <div className="text-right hidden sm:block">
                            <h2 className="font-bold text-sm leading-none text-white">{globalProfile.name.split(' ')[0]}</h2>
                            <p className="text-[10px] text-zinc-400 font-mono mt-0.5">Nivel {globalProfile.rpScore >= 4.5 ? '🏆 Oro' : globalProfile.rpScore >= 4.0 ? '🥈 Plata' : '🥉 Bronce'}</p>
                        </div>
                        <div className="w-9 h-9 rounded-full overflow-hidden relative group-hover:scale-105 transition-transform border border-white/10 ring-1 ring-white/5">
                            {globalProfile.avatarUrl ? (
                                <Image src={globalProfile.avatarUrl} alt="Avatar" fill className="object-cover" />
                            ) : (
                                <div className="w-full h-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                                    <Image src="/assets/icons/logo-outline-purple.png" alt="HappyMeter RPS" width={20} height={20} className="opacity-90 grayscale brightness-200 contrast-200" />
                                </div>
                            )}
                        </div>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-64 bg-zinc-900 border border-white/10 text-white rounded-xl shadow-2xl p-2 z-[100]">
                        <DropdownMenuLabel className="font-normal p-2">
                            <div className="flex flex-col space-y-1">
                                <p className="text-sm font-bold leading-none">{globalProfile.name}</p>
                                <p className="text-xs leading-none text-zinc-500 font-mono mt-1">{sessionPhone}</p>
                            </div>
                        </DropdownMenuLabel>
                        
                        {places.length > 0 && (
                            <>
                                <DropdownMenuSeparator className="bg-white/10 my-1" />
                                <div className="px-2 py-1.5">
                                    <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">Mis Sucursales</p>
                                    <div className="space-y-1 max-h-32 overflow-y-auto pr-1">
                                        {places.map((place: any) => (
                                            <Link href={`/rps/${place.slug}`} key={place.businessId} className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-white/5 transition-colors">
                                                <div className="w-6 h-6 rounded bg-black border border-white/10 overflow-hidden relative shrink-0">
                                                    {place.logoUrl ? (
                                                        <Image src={place.logoUrl} alt={place.name} fill className="object-cover" />
                                                    ) : (
                                                        <Building2 className="w-3 h-3 text-zinc-600 m-auto mt-1" />
                                                    )}
                                                </div>
                                                <span className="text-sm font-medium truncate">{place.name}</span>
                                            </Link>
                                        ))}
                                    </div>
                                </div>
                            </>
                        )}

                        <DropdownMenuSeparator className="bg-white/10 my-1" />
                        
                        {/* Profile Edit Trigger */}
                        <div className="p-1">
                            <EditProfileDialog profile={globalProfile} />
                        </div>

                        {/* B2B Referral Trigger */}
                        <div className="p-1">
                            <B2BReferralDialog phone={globalProfile.phone} hasAgreed={globalProfile.agreedToB2BReferral} />
                        </div>

                        <DropdownMenuSeparator className="bg-white/10 my-1" />
                        
                        <DropdownMenuItem className="p-0 border-none focus:bg-transparent">
                            <form action={logoutGlobalPromoter} className="w-full">
                                <button type="submit" className="flex items-center w-full px-2 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg cursor-pointer transition-colors">
                                    <LogOut className="mr-2 h-4 w-4" />
                                    <span>Cerrar sesión</span>
                                </button>
                            </form>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </header>

            <div className="max-w-4xl mx-auto px-6 py-8 space-y-12 relative z-10">
                {/* Balance Hero */}
                <div className="text-center space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <p className="text-sm font-bold text-zinc-400 uppercase tracking-widest flex items-center justify-center gap-2">
                        <Wallet2 className="w-5 h-5" /> Billetera Total
                    </p>
                    <h2 className="text-6xl sm:text-7xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-indigo-400 via-white to-zinc-500">
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
                    <div className="flex items-center justify-between border-b border-white/10 pb-4">
                        <h3 className="text-xl font-bold flex items-center gap-2">
                            <Building2 className="w-6 h-6 text-indigo-400" />
                            Mis Sucursales ({stats.placesCount})
                        </h3>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4">
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
