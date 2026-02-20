import { getPublicPromoterPortal } from "@/actions/promoters"
import { notFound } from "next/navigation"
import { QRCodeSVG } from "qrcode.react"
import { Target, Users, DollarSign, Share2, Copy, BarChart3, ArrowUpRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Image from "next/image"

export default async function PromoterPortal({ params }: { params: { slug: string } }) {
    const { slug } = params
    const result = await getPublicPromoterPortal(slug)

    if (!result.success || !result.data) {
        return notFound()
    }

    const { name, businessName, logoUrl, stats } = result.data

    return (
        <main className="min-h-screen bg-[#0a0a0f] text-white selection:bg-indigo-500/30">
            {/* Header / Brand */}
            <div className="border-b border-white/5 bg-[#0a0a0f]/50 backdrop-blur-xl sticky top-0 z-50">
                <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-3">
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
                <div className="space-y-2">
                    <h1 className="text-3xl font-bold tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-white via-zinc-200 to-zinc-500">
                        Hola, {name}
                    </h1>
                    <p className="text-zinc-500 font-medium">Este es tu panel de control personal para {businessName}.</p>
                </div>

                {/* Primary Stats */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <Card className="bg-zinc-900/50 border-white/5 backdrop-blur-sm overflow-hidden group">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between pb-2">
                                <p className="text-sm font-medium text-zinc-500">Total Reservas</p>
                                <Target className="h-4 w-4 text-indigo-500 group-hover:scale-110 transition-transform" />
                            </div>
                            <h2 className="text-3xl font-bold text-zinc-100">{stats.totalReservations}</h2>
                            <p className="text-[10px] text-zinc-600 uppercase tracking-widest mt-1">Generadas</p>
                        </CardContent>
                    </Card>

                    <Card className="bg-zinc-900/50 border-white/5 backdrop-blur-sm overflow-hidden group">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between pb-2">
                                <p className="text-sm font-medium text-zinc-500">Asistentes</p>
                                <Users className="h-4 w-4 text-emerald-500 group-hover:scale-110 transition-transform" />
                            </div>
                            <h2 className="text-3xl font-bold text-zinc-100">{stats.confirmedAttendees}</h2>
                            <p className="text-[10px] text-zinc-600 uppercase tracking-widest mt-1">Confirmados</p>
                        </CardContent>
                    </Card>

                    <Card className="bg-zinc-900/50 border-white/5 backdrop-blur-sm overflow-hidden group">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between pb-2">
                                <p className="text-sm font-medium text-zinc-500">Comisión Est.</p>
                                <DollarSign className="h-4 w-4 text-amber-500 group-hover:scale-110 transition-transform" />
                            </div>
                            <h2 className="text-3xl font-bold text-zinc-100">${stats.commission.toFixed(2)}</h2>
                            <p className="text-[10px] text-zinc-600 uppercase tracking-widest mt-1">Acumulado</p>
                        </CardContent>
                    </Card>
                </div>

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
            </div>

            {/* Bottom branding */}
            <div className="fixed bottom-0 left-0 w-full py-4 bg-[#0a0a0f]/80 backdrop-blur-md border-t border-white/5 text-center">
                <p className="text-[10px] text-zinc-700 uppercase tracking-[0.2em] font-bold">Powered by HappyMeter Professional</p>
            </div>
        </main>
    )
}
