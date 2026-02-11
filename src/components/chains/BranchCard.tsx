'use client'

import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Building2, ExternalLink, Loader2 } from 'lucide-react'
import { enterBranch } from '@/actions/chain'
import { useState } from 'react'
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

    // Health Status Logic
    let statusText = "Sin Datos Suficientes"
    let statusColor = "text-gray-500 bg-gray-500/10 border-gray-500/20"
    let statusIcon = <div className="w-1.5 h-1.5 rounded-full bg-gray-500" />

    if (metrics && metrics.surveys >= 10) {
        if (metrics.nps >= 50) {
            statusText = "Sucursal Sana"
            statusColor = "text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
            statusIcon = <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
        } else {
            statusText = "Requiere Atención"
            statusColor = "text-rose-400 bg-rose-500/10 border-rose-500/20"
            statusIcon = <div className="w-1.5 h-1.5 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]" />
        }
    }

    const handleEnter = async () => {
        // Case 0: Already here -> Just Navigate to Dashboard
        if (isCurrent) {
            const targetUrl = branch.slug ? `/dashboard/${branch.slug}` : '/dashboard';
            router.push(targetUrl);
            return;
        }

        // Case 1: Smart Switch (Already logged in as Owner)
        if (!isOwner && hasOwnerSession && setActive) {
            setLoading(true)
            await setActive({ session: ownerSession.id })
            return
        }

        // Case 2: Locked (Need to log in as Owner)
        if (!isOwner && !hasOwnerSession) {
            // Trigger Clerk Login Modal
            openSignIn({
                afterSignInUrl: '/chains',
                appearance: {
                    variables: { colorPrimary: '#8b5cf6' }
                }
            })
            return
        }

        // Case 3: Enter Branch (Standard flow)
        setLoading(true)
        try {
            const res = await enterBranch(branch.branch.userId)
            if (res.success && res.url) {
                // Optimized: Redirect directly to token URL to allow Clerk Multi-Session
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
        <Card className={`group relative overflow-hidden transition-all duration-300 border-white/5 bg-black/40 backdrop-blur-xl hover:-translate-y-1 hover:shadow-2xl hover:shadow-violet-500/10 ${isCurrent ? 'ring-1 ring-violet-500/50 border-violet-500/20' : 'hover:border-white/10'}`}>
            {isOwner && (
                <div className="absolute top-3 right-3 z-50 flex gap-1 bg-black/20 backdrop-blur-sm rounded-lg p-1 border border-white/10 shadow-sm">
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

            {/* Background Gradient Mesh */}
            <div className={`absolute inset-0 bg-gradient-to-br from-violet-500/5 via-transparent to-fuchsia-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />

            {/* Active Indicator Glow */}
            {isCurrent && (
                <div className="absolute top-0 right-0 w-32 h-32 bg-violet-500/20 blur-[60px] rounded-full -mr-16 -mt-16 pointer-events-none" />
            )}

            <CardHeader className="relative">
                <CardTitle className="flex items-start gap-4">
                    <div className={`p-3 rounded-2xl transition-all duration-300 ${isCurrent ? 'bg-gradient-to-br from-violet-600 to-indigo-600 shadow-lg shadow-violet-500/20' : 'bg-white/5 border border-white/5 group-hover:border-white/10 group-hover:bg-white/10'}`}>
                        <Building2 className={`w-6 h-6 ${isCurrent ? 'text-white' : 'text-gray-400 group-hover:text-white'}`} />
                    </div>
                    <div className="flex flex-col flex-1">
                        <div className="flex items-center gap-2">
                            <span className={`text-lg font-bold tracking-tight ${isCurrent ? 'text-white' : 'text-gray-200 group-hover:text-white transition-colors'}`}>
                                {(branch.name && branch.name !== 'Sede Principal') ? branch.name : (branch.branch.businessName || branch.name || 'Sucursal')}
                            </span>
                            {/* Inline Edit Trigger */}
                            {isOwner && (
                                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                    <EditBranchDialog
                                        branchId={branch.branch.userId}
                                        currentName={branch.name || branch.branch.businessName || ""}
                                        currentCountry={branch.branch.state || undefined}
                                    />
                                </div>
                            )}

                            {/* Country Badge */}
                            {branch.branch.state && (
                                <span className="text-[10px] uppercase font-bold text-gray-500 mt-0.5 tracking-wider flex items-center gap-1">
                                    📍 {branch.branch.state}
                                </span>
                            )}

                            {/* Metrics Badge */}
                            {metrics && (
                                <div className="flex items-center gap-2 mt-1">
                                    <span className={`text-xs font-mono font-bold ${metrics.nps >= 50 ? 'text-emerald-400' : metrics.nps > 0 ? 'text-rose-400' : 'text-gray-500'}`}>
                                        NPS {metrics.nps > 0 ? '+' : ''}{metrics.nps}
                                    </span>
                                    <span className="text-[10px] text-gray-500 font-medium px-1.5 py-0.5 bg-white/5 rounded border border-white/5">
                                        {metrics.surveys} Encuestas
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                </CardTitle>
            </CardHeader>
            <CardContent className="relative space-y-4">
                {/* Metrics Grid */}
                {metrics && (
                    <>
                        <div className="grid grid-cols-3 gap-2 py-2">
                            <div className="flex flex-col items-center p-2 rounded-lg bg-white/5 border border-white/5">
                                <span className="text-[10px] text-gray-500 uppercase font-bold mb-1">Encuestas</span>
                                <span className="text-sm font-mono font-bold text-white">{metrics.periods[period].surveys}</span>
                            </div>
                            <div className="flex flex-col items-center p-2 rounded-lg bg-white/5 border border-white/5">
                                <span className="text-[10px] text-gray-500 uppercase font-bold mb-1">Reservas</span>
                                <span className="text-sm font-mono font-bold text-emerald-400">{metrics.periods[period].reservations}</span>
                            </div>
                            <div className="flex flex-col items-center p-2 rounded-lg bg-white/5 border border-white/5">
                                <span className="text-[10px] text-gray-500 uppercase font-bold mb-1">Global</span>
                                <div className="flex items-center gap-1">
                                    <span className="text-sm font-mono font-bold text-amber-400">{metrics.periods[period].rating > 0 ? metrics.periods[period].rating : '-'}</span>
                                    <span className="text-[10px] text-amber-500">★</span>
                                </div>
                            </div>
                        </div>
                        {/* Staff & Satisfaction Row */}
                        <div className="grid grid-cols-2 gap-2 mt-2">
                            <div className="flex items-center justify-between p-2 rounded-lg bg-white/5 border border-white/5">
                                <span className="text-[10px] text-gray-500 uppercase font-bold">Staff</span>
                                <span className="text-xs font-mono font-bold text-gray-300">{metrics.staff}</span>
                            </div>
                            <div className="flex items-center justify-between p-2 rounded-lg bg-white/5 border border-white/5">
                                <span className="text-[10px] text-gray-500 uppercase font-bold">Buzón</span>
                                <span className="text-xs font-mono font-bold text-gray-300">{metrics.staffFeedback}</span>
                            </div>
                        </div>
                    </>
                )}

                {/* Status Logic */}
                <div className={`flex items-center justify-between px-3 py-2 rounded-lg border ${statusColor}`}>
                    <span className="text-[10px] uppercase tracking-wider font-bold">{statusText}</span>
                    {statusIcon}
                </div>

                {isCurrent && (
                    <div className="absolute top-4 right-4 animate-pulse">
                        <div className="w-2 h-2 bg-green-500 rounded-full shadow-[0_0_10px_rgba(34,197,94,0.5)]" />
                    </div>
                )}

                {isCurrent && (
                    <div className="text-[10px] uppercase tracking-wider font-bold text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-fuchsia-400 mb-1">
                        Sucursal Actual
                    </div>
                )}

            </CardContent>
            <CardFooter className="relative pt-0">
                <Button
                    className={`w-full h-10 font-medium text-xs transition-all duration-300 rounded-lg group/btn ${isCurrent
                        ? 'bg-white text-black hover:bg-gray-200 border-0 shadow-lg shadow-white/10'
                        : (!isOwner && hasOwnerSession)
                            ? 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 border border-amber-500/20'
                            : !isOwner
                                ? 'bg-white/5 text-gray-500 border border-white/5 cursor-not-allowed'
                                : 'bg-white/5 hover:bg-white/10 text-white border border-white/10'
                        }`}
                    variant={isCurrent ? "default" : "outline"}
                    onClick={handleEnter}
                    disabled={loading}
                >
                    {loading ? (
                        <Loader2 className="w-3 h-3 animate-spin mr-2" />
                    ) : isCurrent ? (
                        <>
                            Entrar <ExternalLink className="w-3 h-3 ml-2 opacity-50 group-hover/btn:translate-x-0.5 transition-transform" />
                        </>
                    ) : (!isOwner && hasOwnerSession) ? (
                        'Cambiar a Dueño'
                    ) : !isOwner ? (
                        'Loguear como Dueño'
                    ) : (
                        <>
                            Administrar <ExternalLink className="w-3 h-3 ml-2 opacity-50 group-hover/btn:translate-x-0.5 transition-transform" />
                        </>
                    )}
                </Button>
            </CardFooter>
        </Card >
    )
}
