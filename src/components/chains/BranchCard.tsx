'use client'

import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Building2, ExternalLink, Loader2, ArrowRight } from 'lucide-react'
import { enterBranch } from '@/actions/chain'
import { useState, useRef } from 'react'
import { toast } from 'sonner'
import { useClerk } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { DeleteBranchDialog } from './DeleteBranchDialog'
import { EditBranchDialog } from './EditBranchDialog'

interface BranchCardProps {
    branch: {
        id: string
        name: string | null
        slug?: string | null
        branch: {
            userId: string
            businessName: string | null
            state?: string | null // NEW: Country/Location
        }
    }
    metrics?: {
        surveys: number
        nps: number
        staff: number
        staffFeedback: number
        periods: {
            today: { surveys: number, reservations: number, rating: number }
            week: { surveys: number, reservations: number, rating: number }
            month: { surveys: number, reservations: number, rating: number }
        }
    }
    isCurrent: boolean
    isOwner?: boolean
    ownerId?: string
}

export default function BranchCard({ branch, isCurrent, isOwner = true, ownerId, metrics }: BranchCardProps) {
    const [loading, setLoading] = useState(false)
    const [period, setPeriod] = useState<'today' | 'week' | 'month'>('week')
    const { signOut, client, setActive, openSignIn } = useClerk()
    const router = useRouter()

    // Smart Session Detection
    const ownerSession = client?.sessions?.find((s: any) => s.user.id === ownerId);
    const hasOwnerSession = !!ownerSession;

    // Health Status Logic (Cleaner, simpler)
    let statusColor = "bg-gray-500"
    let statusTextColor = "text-gray-500"
    let statusText = "Sin datos"
    let statusGlow = "shadow-none"

    // Theme Colors (Default: Violet/Premium)
    // Theme Colors (Default: Violet/Premium)
    let theme = {
        ring: 'ring-violet-500/30',
        shadow: 'shadow-[0_0_30px_rgba(139,92,246,0.15)]',
        bg: 'bg-[#0c0c0c]',
        iconGradient: 'from-violet-600 to-indigo-600',
        iconShadow: 'shadow-violet-500/25',
        iconText: 'text-white',
        titleGradient: 'text-transparent bg-clip-text bg-gradient-to-r from-white to-violet-200',
        spotlight: 'rgba(139,92,246,', // Violet
        glow: 'from-violet-500/30 via-fuchsia-500/30',
        decoration: 'via-violet-500/50'
    }

    if (metrics && metrics.surveys >= 10) {
        if (metrics.nps >= 50) {
            statusColor = "bg-emerald-500"
            statusTextColor = "text-emerald-400"
            statusText = "Excelente"
            statusGlow = "shadow-[0_0_15px_rgba(16,185,129,0.5)]"
        } else if (metrics.nps > 0) {
            statusColor = "bg-amber-500"
            statusTextColor = "text-amber-400"
            statusText = "Regular"
            statusGlow = "shadow-[0_0_15px_rgba(245,158,11,0.5)]"
        } else {
            statusColor = "bg-rose-500"
            statusTextColor = "text-rose-400"
            statusText = "Crítico"
            statusGlow = "shadow-[0_0_15px_rgba(244,63,94,0.5)]"

            // Override Theme for Critical Status
            theme = {
                ring: 'ring-rose-500/50',
                shadow: 'shadow-[0_0_30px_rgba(244,63,94,0.15)]',
                bg: 'bg-[#1a0505]', // Dark Red Tint
                iconGradient: 'from-rose-600 to-red-600',
                iconShadow: 'shadow-rose-500/25',
                iconText: 'text-white',
                titleGradient: 'text-transparent bg-clip-text bg-gradient-to-r from-white to-rose-200',
                spotlight: 'rgba(244,63,94,', // Rose
                glow: 'from-rose-500/30 via-red-500/30',
                decoration: 'via-rose-500/50'
            }
        }
    }

    // Spotlight Effect State
    const divRef = useRef<HTMLDivElement>(null)
    const [opacity, setOpacity] = useState(0)
    const [position, setPosition] = useState({ x: 0, y: 0 })

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!divRef.current) return

        const div = divRef.current
        const rect = div.getBoundingClientRect()

        setPosition({ x: e.clientX - rect.left, y: e.clientY - rect.top })
    }

    const handleMouseEnter = () => {
        setOpacity(1)
    }

    const handleMouseLeave = () => {
        setOpacity(0)
    }

    const handleEnter = async () => {
        if (isCurrent) {
            const targetUrl = branch.slug ? `/dashboard/${branch.slug}` : '/dashboard';
            router.push(targetUrl);
            return;
        }

        if (!isOwner && hasOwnerSession && setActive) {
            setLoading(true)
            await setActive({ session: ownerSession.id })
            return
        }

        if (!isOwner && !hasOwnerSession) {
            openSignIn({
                afterSignInUrl: '/chains',
                appearance: {
                    variables: { colorPrimary: '#8b5cf6' }
                }
            })
            return
        }

        setLoading(true)
        try {
            const res = await enterBranch(branch.branch.userId)
            if (res.success && res.url) {
                window.location.href = res.url
            } else {
                throw new Error(res.error || 'Error desconocido')
            }
        } catch (error: any) {
            toast.error(error.message)
            setLoading(false)
        }
    }

    return (
        <div
            ref={divRef}
            onMouseMove={handleMouseMove}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            className="group relative rounded-[20px]"
        >
            {/* Spotlight Border (The "Laser" Effect) */}
            <div
                className="pointer-events-none absolute -inset-[1px] rounded-[20px] opacity-0 transition-opacity duration-300"
                style={{
                    opacity,
                    background: `radial-gradient(600px circle at ${position.x}px ${position.y}px, ${theme.spotlight}0.5), transparent 40%)`,
                }}
            />

            {/* Premium Card Glow Effect (Always visible now, styled by Theme) */}
            <div className={`absolute -inset-0.5 rounded-[22px] bg-gradient-to-b from-white/10 to-white/0 opacity-100 transition duration-500 blur-sm ${theme.glow} to-transparent`} />

            {/* Main Card Content */}
            <Card className={`relative h-full overflow-hidden transition-all duration-300 rounded-[20px] border-0 ring-1 group-hover:translate-y-[-2px] ${theme.bg} ${theme.ring} ${theme.shadow}`}>

                {/* Spotlight Overlay (Inner Glow) */}
                <div
                    className="pointer-events-none absolute inset-0 transition-opacity duration-300"
                    style={{
                        opacity,
                        background: `radial-gradient(800px circle at ${position.x}px ${position.y}px, ${theme.spotlight}0.08), transparent 40%)`,
                    }}
                />

                {/* Decoration: Top Gradient Line */}
                <div className={`absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent ${theme.decoration} to-transparent opacity-50`} />

                {isOwner && (
                    <div className="absolute top-4 right-4 z-50 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <EditBranchDialog
                            branchId={branch.branch.userId}
                            currentName={branch.name || branch.branch.businessName || ""}
                            currentCountry={branch.branch.state || undefined}
                        />
                        <DeleteBranchDialog
                            branchId={branch.branch.userId}
                            branchName={branch.name || branch.branch.businessName || "Sucursal"}
                        />
                    </div>
                )}

                <CardHeader className="relative pb-2 z-10">
                    <div className="flex items-start justify-between">
                        <div className="flex items-center gap-4">
                            <div className={`p-3.5 rounded-2xl transition-all duration-300 bg-gradient-to-br ${theme.iconGradient} ${theme.iconShadow} shadow-lg`}>
                                <Building2 className={`w-6 h-6 ${theme.iconText}`} />
                            </div>
                            <div>
                                <h3 className={`text-xl font-bold tracking-tight mb-0.5 ${theme.titleGradient}`}>
                                    {(branch.name && branch.name !== 'Sede Principal') ? branch.name : (branch.branch.businessName || branch.name || 'Sucursal')}
                                </h3>
                                {branch.branch.state ? (
                                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                                        <span className="w-1 h-1 rounded-full bg-gray-600" />
                                        {branch.branch.state}
                                    </p>
                                ) : (
                                    <p className="text-xs font-medium text-gray-600 uppercase tracking-wider">Ubicación no definida</p>
                                )}
                            </div>
                        </div>

                        {/* Status Pill - Top Right (Visible if not owner or hovering) */}
                        {metrics && !isOwner && (
                            <div className={`px-2 py-0.5 rounded-full border border-white/5 bg-white/5 flex items-center gap-1.5`}>
                                <div className={`w-1.5 h-1.5 rounded-full ${statusColor} ${statusGlow}`} />
                                <span className={`text-[10px] uppercase font-bold tracking-wider ${statusTextColor}`}>
                                    {statusText}
                                </span>
                            </div>
                        )}
                    </div>
                </CardHeader>

                <CardContent className="pt-6 space-y-6 z-10 relative">
                    {/* Key Metrics Row */}
                    {metrics ? (
                        <div className="grid grid-cols-3 gap-3">
                            {/* Surveys */}
                            <div className="relative group/metric p-3 rounded-xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-colors">
                                <div className="text-[10px] uppercase font-bold text-gray-500 mb-1 tracking-wider">Encuestas</div>
                                <div className="text-2xl font-bold text-white tracking-tight">{metrics.periods[period].surveys}</div>
                                <div className="absolute inset-0 border border-violet-500/20 rounded-xl opacity-0 group-hover/metric:opacity-100 transition-opacity pointer-events-none" />
                            </div>

                            {/* Global Score */}
                            <div className="relative group/metric p-3 rounded-xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-colors">
                                <div className="text-[10px] uppercase font-bold text-gray-500 mb-1 tracking-wider">Satisfacción</div>
                                <div className="flex items-center gap-1.5">
                                    <span className="text-2xl font-bold text-white tracking-tight">{metrics.periods[period].rating > 0 ? metrics.periods[period].rating : '-'}</span>
                                    <span className="text-amber-500 text-sm">★</span>
                                </div>
                                <div className="absolute inset-x-0 bottom-0 h-[2px] bg-gradient-to-r from-amber-500/50 to-transparent opacity-0 group-hover/metric:opacity-100 transition-opacity" />
                            </div>

                            {/* NPS */}
                            <div className="relative group/metric p-3 rounded-xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-colors">
                                <div className="text-[10px] uppercase font-bold text-gray-500 mb-1 tracking-wider">NPS</div>
                                <div className={`text-2xl font-bold tracking-tight ${metrics.nps >= 50 ? 'text-emerald-400' : metrics.nps > 0 ? 'text-white' : 'text-rose-400'}`}>
                                    {metrics.nps > 0 ? '+' : ''}{metrics.nps}
                                </div>
                                <div className={`absolute right-3 top-3 w-1.5 h-1.5 rounded-full ${metrics.nps >= 50 ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-gray-700'}`} />
                            </div>
                        </div>
                    ) : (
                        <div className="h-[88px] flex items-center justify-center text-gray-600 text-sm italic bg-white/[0.01] rounded-xl border border-white/5 border-dashed">
                            Sin métricas disponibles
                        </div>
                    )}

                    {/* Secondary Metrics / Actions */}
                    <div className="flex items-center justify-between pt-2">
                        {metrics ? (
                            <div className="flex items-center gap-4 text-xs font-medium text-gray-500">
                                <div className="flex items-center gap-1.5">
                                    <span className="w-1 h-1 rounded-full bg-blue-500" />
                                    Staff: {metrics.staff}
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <span className="w-1 h-1 rounded-full bg-purple-500" />
                                    Buzón: {metrics.staffFeedback}
                                </div>
                            </div>
                        ) : <div />}

                        {/* Status Indicator (Owner View) */}
                        {metrics && isOwner && (
                            <div className="flex items-center gap-2">
                                <span className={`text-[10px] uppercase font-bold tracking-wider ${statusColor.replace('bg-', 'text-').replace('500', '400')}`}>
                                    {statusText}
                                </span>
                                <div className={`w-2 h-2 rounded-full ${statusColor} ${statusGlow}`} />
                            </div>
                        )}
                    </div>
                </CardContent>

                <CardFooter className="relative pt-2 pb-5 z-10">
                    <Button
                        className={`w-full h-11 font-bold text-xs uppercase tracking-widest transition-all duration-300 rounded-xl group/btn overflow-hidden relative bg-white text-black hover:bg-gray-200 border-0 shadow-[0_0_20px_rgba(255,255,255,0.1)]`}
                        variant="default"
                        onClick={handleEnter}
                        disabled={loading}
                    >
                        {loading ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <>
                                <span className="relative z-10 flex items-center justify-center gap-2">
                                    {isCurrent ? 'Ingresar al Dashboard' : (!isOwner && hasOwnerSession) ? 'Cambiar Cuenta' : 'Administrar Sucursal'}
                                    <ArrowRight className={`w-3.5 h-3.5 transition-transform duration-300 group-hover/btn:translate-x-1`} />
                                </span>
                                {/* No extra gradient overlay since it is solid white now */}
                            </>
                        )}
                    </Button>
                </CardFooter>
            </Card>
        </div>
    )
}
