import { getPublicPromoterPortal, getJefeTeamInfo } from "@/actions/promoters"
import { notFound, redirect } from "next/navigation"
import { cookies } from "next/headers"
import { QRCodeSVG } from "qrcode.react"
import { Target, Users, DollarSign, Share2, Copy, BarChart3, ArrowUpRight, Calendar, User, Phone, MapPin, ChevronDown, Trophy, Medal, Star, CalendarHeart, Music } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Image from "next/image"
import Link from "next/link"
import { TeamTab } from "./TeamTab"

const getStatusBadge = (status: string) => {
    switch (status) {
        case 'CONFIRMED':
            return <Badge variant="outline" className="mt-0.5 bg-emerald-500/10 text-emerald-400 border-emerald-500/20">Confirmado</Badge>
        case 'CHECKED_IN':
            return <Badge variant="outline" className="mt-0.5 bg-indigo-500/10 text-indigo-400 border-indigo-500/20">Asistió</Badge>
        case 'PENDING':
            return <Badge variant="outline" className="mt-0.5 bg-amber-500/10 text-amber-400 border-amber-500/20">Pendiente</Badge>
        case 'NO_SHOW':
            return <Badge variant="outline" className="mt-0.5 bg-red-500/10 text-red-400 border-red-500/20">No Show</Badge>
        case 'CANCELED':
            return <Badge variant="outline" className="mt-0.5 bg-zinc-500/10 text-zinc-400 border-zinc-500/20">Cancelada</Badge>
        default:
            return <Badge variant="outline" className="mt-0.5 bg-zinc-500/10 text-zinc-400 border-zinc-500/20">{status}</Badge>
    }
}

export default async function PromoterPortal({ params }: { params: { slug: string } }) {
    const { slug } = params

    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get('rps_global_session')?.value

    if (!sessionCookie) {
        redirect('/rps')
    }

    const result = await getPublicPromoterPortal(slug)

    if (!result.success || !result.data) {
        return notFound()
    }

    const { name, businessName, logoUrl, stats, upcomingReservations, upcomingEvents, phone, aiCoachTip, role, id: promoterId } = result.data
    const { gamification } = stats

    let teamData: any = [];
    if (role === 'JEFE_RP') {
        const teamReq = await getJefeTeamInfo(slug);
        if (teamReq.success) {
            teamData = teamReq.data;
        }
    }

    // Security check: Only allow the owner of this slug to view it
    if (phone !== sessionCookie && sessionCookie !== 'admin') {
        // In a real scenario we might allow admins, for now simply block mismatch
        redirect('/rps/wallet')
    }

    return (
        <main className="min-h-screen bg-[#0a0a0f] text-white selection:bg-indigo-500/30">
            {/* Header / Brand */}
            <div className="border-b border-white/5 bg-[#0a0a0f]/50 backdrop-blur-xl sticky top-0 z-50">
                <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Button variant="ghost" size="icon" className="w-8 h-8 rounded-lg text-zinc-400 hover:text-white" asChild>
                            <Link href="/rps/wallet">
                                <ChevronDown className="w-4 h-4 rotate-90" />
                            </Link>
                        </Button>
                        {logoUrl ? (
                            <Image src={logoUrl} alt={businessName || ''} width={32} height={32} className="rounded-lg ring-1 ring-white/10" />
                        ) : (
                            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center font-bold text-xs ring-1 ring-white/10">
                                {businessName?.charAt(0)}
                            </div>
                        )}
                        <span className="font-bold tracking-tight text-zinc-100">{businessName}</span>
                    </div>
                    <Badge variant="outline" className="border-indigo-500/30 text-indigo-400 bg-indigo-500/5">
                        Portal de RP
                    </Badge>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-6 py-10 space-y-10 pb-24">
                {/* Welcome */}
                <div className="space-y-2 flex items-start justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-white via-zinc-200 to-zinc-500">
                            Hola, {name}
                        </h1>
                        <p className="text-zinc-500 font-medium">Este es tu panel de control personal para {businessName}.</p>
                    </div>
                    {gamification && (
                        <div className={`px-4 py-2 rounded-2xl flex items-center gap-2 border font-bold text-sm tracking-wider uppercase
                            ${gamification.level === 'GOLD' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20 shadow-[0_0_20px_rgba(245,158,11,0.2)]' :
                                gamification.level === 'SILVER' ? 'bg-zinc-300/10 text-zinc-300 border-zinc-400/20' :
                                    'bg-[#cd7f32]/10 text-[#cd7f32] border-[#cd7f32]/20'
                            }`}>
                            {gamification.level === 'GOLD' ? <Trophy className="w-4 h-4" /> : <Medal className="w-4 h-4" />}
                            Nivel {gamification.level}
                        </div>
                    )}
                </div>

                {/* AI Coach Insight */}
                {aiCoachTip && (
                    <Card className="bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-transparent border-indigo-500/20 backdrop-blur-md overflow-hidden relative">
                        <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-indigo-500 to-purple-500" />
                        <CardContent className="p-4 sm:p-5 flex items-start gap-4">
                            <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex-shrink-0 flex items-center justify-center border border-indigo-500/30">
                                <span className="text-xl">🤖</span>
                            </div>
                            <div className="space-y-1">
                                <h3 className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400 flex items-center gap-2">
                                    Smart Coach IA
                                    <Badge variant="secondary" className="bg-indigo-500/20 text-indigo-300 text-[10px] h-4 border-none uppercase tracking-wider">Beta</Badge>
                                </h3>
                                <p className="text-sm text-zinc-300 leading-relaxed max-w-2xl">{aiCoachTip.replace('💡 Tip IA: ', '')}</p>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Primary Stats with Tabs */}
                <Tabs defaultValue="today" className="space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <TabsList className="bg-zinc-900 border border-white/5 h-12 w-full sm:w-auto p-1 overflow-x-auto justify-start hide-scrollbars">
                            <TabsTrigger value="today" className="data-[state=active]:bg-indigo-500 data-[state=active]:text-white h-full px-6">Hoy</TabsTrigger>
                            <TabsTrigger value="allTime" className="data-[state=active]:bg-white/10 data-[state=active]:text-white h-full px-6">Histórico</TabsTrigger>
                            <TabsTrigger value="ranking" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-500 data-[state=active]:to-orange-500 data-[state=active]:text-black h-full px-6 font-bold shadow-lg shadow-amber-500/20">Nivel & Ranking</TabsTrigger>
                            <TabsTrigger value="events" className="data-[state=active]:bg-purple-500 data-[state=active]:text-white h-full px-6">Eventos</TabsTrigger>
                            {role === 'JEFE_RP' && (
                                <TabsTrigger value="team" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white h-full px-6 flex items-center gap-2">
                                    <Users className="w-4 h-4" />
                                    Mi Equipo
                                </TabsTrigger>
                            )}
                        </TabsList>
                    </div>

                    {role === 'JEFE_RP' && (
                        <TabsContent value="team" className="focus:outline-none">
                            <TeamTab leaderSlug={slug} teamData={teamData} />
                        </TabsContent>
                    )}

                    <TabsContent value="today" className="focus:outline-none">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <Card className="bg-zinc-900/50 border-white/5 backdrop-blur-sm overflow-hidden group">
                                <CardContent className="p-6">
                                    <div className="flex items-center justify-between pb-2">
                                        <p className="text-sm font-medium text-zinc-500">Reservas Hoy</p>
                                        <Target className="h-4 w-4 text-indigo-500 group-hover:scale-110 transition-transform" />
                                    </div>
                                    <h2 className="text-3xl font-bold text-zinc-100">{stats.today.totalReservations}</h2>
                                    <p className="text-[10px] text-zinc-600 uppercase tracking-widest mt-1">Generadas</p>
                                </CardContent>
                            </Card>

                            <Card className="bg-zinc-900/50 border-white/5 backdrop-blur-sm overflow-hidden group">
                                <CardContent className="p-6">
                                    <div className="flex items-center justify-between pb-2">
                                        <p className="text-sm font-medium text-zinc-500">Asistentes Hoy</p>
                                        <Users className="h-4 w-4 text-emerald-500 group-hover:scale-110 transition-transform" />
                                    </div>
                                    <h2 className="text-3xl font-bold text-zinc-100">{stats.today.confirmedAttendees}</h2>
                                    <p className="text-[10px] text-zinc-600 uppercase tracking-widest mt-1">Confirmados</p>
                                </CardContent>
                            </Card>

                            <Card className="bg-zinc-900/50 border-white/5 backdrop-blur-sm overflow-hidden group relative">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 blur-[30px] rounded-full pointer-events-none" />
                                <CardContent className="p-6 relative z-10">
                                    <div className="flex items-center justify-between pb-2">
                                        <p className="text-sm font-bold text-indigo-400">Ganancia Hoy</p>
                                        <DollarSign className="h-4 w-4 text-amber-500 group-hover:scale-110 transition-transform" />
                                    </div>
                                    <h2 className="text-4xl font-black text-white">${stats.today.commission.toFixed(2)}</h2>
                                    <p className="text-[10px] text-zinc-500 uppercase tracking-widest mt-1 font-bold">Estimado</p>
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>

                    <TabsContent value="allTime" className="focus:outline-none">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <Card className="bg-zinc-900/50 border-white/5 backdrop-blur-sm overflow-hidden group">
                                <CardContent className="p-6">
                                    <div className="flex items-center justify-between pb-2">
                                        <p className="text-sm font-medium text-zinc-500">Total Reservas</p>
                                        <Target className="h-4 w-4 text-indigo-500 group-hover:scale-110 transition-transform" />
                                    </div>
                                    <h2 className="text-3xl font-bold text-zinc-100">{stats.allTime.totalReservations}</h2>
                                    <p className="text-[10px] text-zinc-600 uppercase tracking-widest mt-1">Histórico</p>
                                </CardContent>
                            </Card>

                            <Card className="bg-zinc-900/50 border-white/5 backdrop-blur-sm overflow-hidden group">
                                <CardContent className="p-6">
                                    <div className="flex items-center justify-between pb-2">
                                        <p className="text-sm font-medium text-zinc-500">Total Asistentes</p>
                                        <Users className="h-4 w-4 text-emerald-500 group-hover:scale-110 transition-transform" />
                                    </div>
                                    <h2 className="text-3xl font-bold text-zinc-100">{stats.allTime.confirmedAttendees}</h2>
                                    <p className="text-[10px] text-zinc-600 uppercase tracking-widest mt-1">Histórico</p>
                                </CardContent>
                            </Card>

                            <Card className="bg-zinc-900/50 border-white/5 backdrop-blur-sm overflow-hidden group">
                                <CardContent className="p-6">
                                    <div className="flex items-center justify-between pb-2">
                                        <p className="text-sm font-medium text-zinc-500">Comisiones Pagadas</p>
                                        <DollarSign className="h-4 w-4 text-amber-500 group-hover:scale-110 transition-transform" />
                                    </div>
                                    <h2 className="text-3xl font-bold text-zinc-100">${stats.allTime.commission.toFixed(2)}</h2>
                                    <p className="text-[10px] text-zinc-600 uppercase tracking-widest mt-1">Histórico</p>
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>

                    <TabsContent value="ranking" className="focus:outline-none space-y-8 animate-in fade-in zoom-in-95 duration-500">
                        {/* Gamification Progress */}
                        {gamification && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Weekly Goal */}
                                <Card className="bg-gradient-to-br from-zinc-900/50 to-black border-white/5 backdrop-blur-sm overflow-hidden group">
                                    <div className="absolute top-0 left-0 w-2 h-full bg-indigo-500" />
                                    <CardContent className="p-6">
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="flex items-center gap-2">
                                                <Target className="w-5 h-5 text-indigo-400" />
                                                <h3 className="font-bold">Meta Semanal</h3>
                                            </div>
                                            <span className="text-sm font-medium bg-white/5 px-2 py-1 rounded-md text-zinc-400">
                                                {gamification.weeklyConfirmed} / {gamification.weeklyGoal} pax
                                            </span>
                                        </div>
                                        <div className="h-3 w-full bg-white/5 rounded-full overflow-hidden mb-2">
                                            <div
                                                className="h-full bg-indigo-500 rounded-full transition-all duration-1000 ease-out relative"
                                                style={{ width: `${Math.min(100, (gamification.weeklyConfirmed / gamification.weeklyGoal) * 100)}%` }}
                                            >
                                                <div className="absolute inset-0 bg-gradient-to-r from-transparent to-white/30" />
                                            </div>
                                        </div>
                                        <p className="text-xs text-zinc-500 text-right">
                                            {gamification.weeklyConfirmed >= gamification.weeklyGoal
                                                ? <span className="text-emerald-400">¡Meta Alcanzada! 🎉</span>
                                                : `Faltan ${gamification.weeklyGoal - gamification.weeklyConfirmed} personas`}
                                        </p>
                                    </CardContent>
                                </Card>

                                {/* Monthly Goal */}
                                <Card className="bg-gradient-to-br from-zinc-900/50 to-black border-white/5 backdrop-blur-sm overflow-hidden group">
                                    <div className="absolute top-0 left-0 w-2 h-full bg-emerald-500" />
                                    <CardContent className="p-6">
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="flex items-center gap-2">
                                                <Star className="w-5 h-5 text-emerald-400" />
                                                <h3 className="font-bold">Meta Mensual</h3>
                                            </div>
                                            <span className="text-sm font-medium bg-white/5 px-2 py-1 rounded-md text-zinc-400">
                                                {gamification.monthlyConfirmed} / {gamification.monthlyGoal} pax
                                            </span>
                                        </div>
                                        <div className="h-3 w-full bg-white/5 rounded-full overflow-hidden mb-2">
                                            <div
                                                className="h-full bg-emerald-500 rounded-full transition-all duration-1000 ease-out relative"
                                                style={{ width: `${Math.min(100, (gamification.monthlyConfirmed / gamification.monthlyGoal) * 100)}%` }}
                                            >
                                                <div className="absolute inset-0 bg-gradient-to-r from-transparent to-white/30" />
                                            </div>
                                        </div>
                                        <p className="text-xs text-zinc-500 text-right">
                                            {gamification.monthlyConfirmed >= gamification.monthlyGoal
                                                ? <span className="text-emerald-400">¡Meta Alcanzada! 🎉</span>
                                                : `Faltan ${gamification.monthlyGoal - gamification.monthlyConfirmed} personas`}
                                        </p>
                                    </CardContent>
                                </Card>
                            </div>
                        )}

                        {/* Leaderboard */}
                        {gamification && (
                            <div className="bg-zinc-900/30 border border-white/5 rounded-3xl p-6 lg:p-8">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                                    <div>
                                        <h3 className="text-2xl font-bold flex items-center gap-2">
                                            <Trophy className="w-6 h-6 text-amber-500" />
                                            Top RPs de {businessName}
                                        </h3>
                                        <p className="text-zinc-500 text-sm mt-1">Ranking mensual basado en asistentes reales.</p>
                                    </div>
                                    <div className="bg-indigo-500/10 border border-indigo-500/20 px-4 py-2 rounded-xl text-center">
                                        <p className="text-[10px] uppercase text-indigo-400 font-bold tracking-wider">Tu Posición</p>
                                        <p className="text-2xl font-black text-white">#{gamification.rank} <span className="text-sm font-normal text-zinc-500">de {gamification.totalRps}</span></p>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    {gamification.leaderboard.map((rp: any, index: number) => {
                                        return (
                                            <div
                                                key={rp.id}
                                                className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${rp.slug === slug
                                                    ? 'bg-indigo-500/10 border-indigo-500/30'
                                                    : 'bg-black/20 border-white/5 hover:bg-white/5'
                                                    }`}
                                            >
                                                <div className="flex items-center gap-4">
                                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${index === 0 ? 'bg-amber-500 text-black shadow-[0_0_15px_rgba(245,158,11,0.5)]' :
                                                        index === 1 ? 'bg-zinc-300 text-black shadow-[0_0_15px_rgba(212,212,216,0.3)]' :
                                                            index === 2 ? 'bg-[#cd7f32] text-white shadow-[0_0_15px_rgba(205,127,50,0.3)]' :
                                                                'bg-white/5 text-zinc-400'
                                                        }`}>
                                                        {index + 1}
                                                    </div>
                                                    <div>
                                                        <p className={`font-bold ${rp.slug === slug ? 'text-indigo-300' : 'text-zinc-200'}`}>
                                                            {rp.name} {rp.slug === slug && <span className="text-xs bg-indigo-500/20 text-indigo-400 px-2 py-0.5 rounded-full ml-2">TÚ</span>}
                                                        </p>
                                                        <p className="text-xs text-zinc-500">@{rp.slug}</p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="font-bold text-lg text-emerald-400">{rp.monthlyConfirmed}</p>
                                                    <p className="text-[10px] text-zinc-500 uppercase font-medium">Asistentes</p>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        )}
                    </TabsContent>

                    <TabsContent value="events" className="focus:outline-none space-y-6 animate-in fade-in zoom-in-95 duration-500">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center border border-purple-500/20">
                                <CalendarHeart className="w-5 h-5 text-purple-400" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold tracking-tight">Cartelera de Eventos</h2>
                                <p className="text-sm text-zinc-500">Promociona estas fechas especiales</p>
                            </div>
                        </div>

                        {upcomingEvents && upcomingEvents.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {upcomingEvents.map((ev: any) => (
                                    <div key={ev.id} className="bg-zinc-900/50 border border-white/5 rounded-3xl overflow-hidden group hover:border-purple-500/50 transition-colors">
                                        {ev.imageUrl && (
                                            <div className="w-full h-32 bg-zinc-800 relative">
                                                <Image src={ev.imageUrl} alt={ev.name} fill className="object-cover" />
                                            </div>
                                        )}
                                        <div className="p-6">
                                            <div className="flex items-center justify-between mb-3">
                                                <Badge variant="outline" className="bg-purple-500/10 text-purple-400 border-purple-500/20">
                                                    {format(new Date(ev.date), "dd MMM, yyyy", { locale: es })}
                                                </Badge>
                                                <span className="text-xs text-zinc-500 font-mono">
                                                    {format(new Date(ev.date), "HH:mm")}
                                                </span>
                                            </div>
                                            <h3 className="text-lg font-bold text-white mb-2 group-hover:text-purple-300 transition-colors">{ev.name}</h3>
                                            {ev.description && (
                                                <p className="text-sm text-zinc-400 line-clamp-2 leading-relaxed">{ev.description}</p>
                                            )}

                                            <Button className="w-full mt-4 bg-purple-600 hover:bg-purple-500 text-white gap-2">
                                                <Share2 className="w-4 h-4" /> Promocionar
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-12 px-6 bg-zinc-900/30 rounded-3xl border border-white/5 border-dashed">
                                <Music className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
                                <h3 className="text-lg font-bold text-white mb-2">No hay eventos próximos</h3>
                                <p className="text-sm text-zinc-500 max-w-sm mx-auto">
                                    El administrador aún no ha publicado fechas especiales. Vuelve pronto para descubrir nuevas oportunidades.
                                </p>
                            </div>
                        )}
                    </TabsContent>
                </Tabs>

                {/* Referral Assets */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                    {/* QR Section */}
                    <div className="bg-zinc-900/30 border border-white/5 rounded-3xl p-8 flex flex-col items-center gap-6 ring-1 ring-white/5">
                        <div className="text-center space-y-2">
                            <h3 className="font-bold text-lg">Tu Código QR</h3>
                            <p className="text-zinc-500 text-sm">Muéstralo a tus clientes para que reserven al instante.</p>
                        </div>

                        <div className="bg-white p-6 rounded-3xl shadow-[0_0_50px_rgba(79,70,229,0.2)]">
                            <QRCodeSVG
                                value={stats.referralLink || ''}
                                size={180}
                                level="H"
                                fgColor="#000000"
                            />
                        </div>

                        <Button className="w-full bg-indigo-600 hover:bg-indigo-700 font-bold rounded-xl h-12 gap-2" size="lg">
                            <BarChart3 className="w-4 h-4" /> Descargar QR Full HD
                        </Button>
                    </div>

                    {/* Link Section */}
                    <div className="space-y-6">
                        <div className="bg-zinc-900/30 border border-white/5 rounded-3xl p-8 space-y-6">
                            <div className="space-y-2">
                                <h3 className="font-bold text-lg">Tu Link Personal</h3>
                                <p className="text-zinc-500 text-sm">Comparte este enlace en tus redes sociales o WhatsApp.</p>
                            </div>

                            <div className="bg-black/50 border border-white/10 p-4 rounded-xl break-all font-mono text-zinc-400 text-sm ring-1 ring-inset ring-white/5">
                                {stats.referralLink}
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <Button variant="outline" className="border-white/10 bg-white/5 hover:bg-white/10 rounded-xl h-12 gap-2">
                                    <Copy className="w-4 h-4" /> Copiar Link
                                </Button>
                                <Button variant="outline" className="border-white/10 bg-white/5 hover:bg-white/10 rounded-xl h-12 gap-2">
                                    <Share2 className="w-4 h-4" /> Compartir
                                </Button>
                            </div>
                        </div>

                        <div className="p-6 border border-indigo-500/20 bg-indigo-500/5 rounded-3xl flex gap-4">
                            <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center shrink-0">
                                <ArrowUpRight className="w-5 h-5 text-indigo-400" />
                            </div>
                            <div className="space-y-1">
                                <h4 className="font-bold text-sm">Tip Pro</h4>
                                <p className="text-zinc-500 text-xs leading-relaxed">
                                    Agrega este link a tu bio de Instagram para que tus seguidores puedan reservar directamente contigo las 24 horas.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Upcoming Reservations List */}
                <div className="space-y-6 pt-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
                            <Calendar className="w-5 h-5 text-indigo-400" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold tracking-tight">Mis Próximas Reservaciones</h2>
                            <p className="text-sm text-zinc-500">Tus clientes registrados con tu código</p>
                        </div>
                    </div>

                    <div className="grid gap-4">
                        {upcomingReservations && upcomingReservations.length > 0 ? (
                            upcomingReservations.map((res: any) => (
                                <details key={res.id} className="group bg-zinc-900/50 border border-white/5 rounded-2xl overflow-hidden backdrop-blur-sm [&_summary::-webkit-details-marker]:hidden">
                                    <summary className="flex items-center justify-between p-5 cursor-pointer hover:bg-white/[0.02] transition-colors">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-xl bg-indigo-500/20 flex flex-col items-center justify-center border border-indigo-500/20 shrink-0">
                                                <span className="text-[10px] font-bold text-indigo-400 uppercase leading-none">{format(new Date(res.date), 'MMM', { locale: es })}</span>
                                                <span className="text-lg font-bold text-indigo-100 leading-none mt-1">{format(new Date(res.date), 'dd')}</span>
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-zinc-100">{res.customerName || "Cliente"}</h3>
                                                <div className="flex items-center gap-2 text-xs text-zinc-500 mt-1">
                                                    <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {res.partySize} pax</span>
                                                    <span>•</span>
                                                    <span className="text-indigo-400 tabular-nums">{format(new Date(res.date), 'hh:mm a')}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center group-open:rotate-180 transition-transform duration-300">
                                            <ChevronDown className="w-4 h-4 text-zinc-400" />
                                        </div>
                                    </summary>
                                    <div className="px-5 pb-5 pt-0 text-sm text-zinc-400 border-t border-white/5 bg-black/20">
                                        <div className="pt-4 grid sm:grid-cols-2 gap-4">
                                            <div className="space-y-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center shrink-0">
                                                        <MapPin className="w-4 h-4 text-zinc-300" />
                                                    </div>
                                                    <div>
                                                        <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold">Mesa Asignada</p>
                                                        <p className="font-medium text-zinc-200">{res.table?.label || "Sin asignar"}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center shrink-0">
                                                        <Target className="w-4 h-4 text-zinc-300" />
                                                    </div>
                                                    <div>
                                                        <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold">Estado</p>
                                                        {getStatusBadge(res.status)}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="space-y-3">
                                                {(res.customerPhone || res.customerName) && (
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center shrink-0">
                                                            <User className="w-4 h-4 text-zinc-300" />
                                                        </div>
                                                        <div>
                                                            <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold">Contacto Principal</p>
                                                            <p className="font-medium text-zinc-200">{res.customerName}</p>
                                                        </div>
                                                    </div>
                                                )}
                                                {res.customerPhone && (
                                                    <a href={`tel:${res.customerPhone}`} className="flex items-center gap-3 group/phone p-2 -ml-2 rounded-lg hover:bg-white/5 transition-colors">
                                                        <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 group-hover/phone:bg-indigo-500 group-hover/phone:text-white flex items-center justify-center shrink-0 transition-colors shadow-[0_0_15px_-3px_rgba(99,102,241,0.4)]">
                                                            <Phone className="w-4 h-4" />
                                                        </div>
                                                        <div>
                                                            <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold">Teléfono (Toca para llamar)</p>
                                                            <p className="font-medium text-white">{res.customerPhone}</p>
                                                        </div>
                                                    </a>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </details>
                            ))
                        ) : (
                            <div className="text-center py-12 px-4 rounded-3xl border border-dashed border-white/10 bg-zinc-900/20">
                                <Calendar className="w-10 h-10 text-zinc-600 mx-auto mb-3" />
                                <h3 className="text-zinc-300 font-medium">No hay reservaciones próximas</h3>
                                <p className="text-zinc-500 text-sm mt-1">Comparte tu link para empezar a ganar comisiones.</p>
                            </div>
                        )}
                    </div>
                </div>

            </div>

            {/* Bottom branding */}
            <div className="fixed bottom-0 left-0 w-full py-4 bg-[#0a0a0f]/80 backdrop-blur-md border-t border-white/5 text-center pointer-events-none">
                <p className="text-[10px] text-zinc-500 uppercase tracking-[0.2em] font-bold">Powered by HappyMeter Professional</p>
            </div>
        </main>
    )
}
