'use client'

import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Building2, ExternalLink, Loader2 } from 'lucide-react'
import { enterBranch } from '@/actions/chain'
import { useState } from 'react'
import { toast } from 'sonner'
import { useClerk } from '@clerk/nextjs'

import { useRouter } from 'next/navigation'

interface BranchCardProps {
    branch: {
        id: string
        name: string | null
        slug?: string | null
        branch: {
            userId: string
            businessName: string | null
        }
    }
    isCurrent: boolean
    isOwner?: boolean
    ownerId?: string
}

export default function BranchCard({ branch, isCurrent, isOwner = true, ownerId }: BranchCardProps) {
    const [loading, setLoading] = useState(false)
    const { signOut, client, setActive, openSignIn } = useClerk()
    const router = useRouter()

    // Smart Session Detection
    const ownerSession = client?.sessions?.find((s: any) => s.user.id === ownerId);
    const hasOwnerSession = !!ownerSession;

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
        <Card className={`group relative overflow-hidden transition-all duration-300 border-white/5 bg-black/40 backdrop-blur-xl hover:-translate-y-1 hover:shadow-2xl hover:shadow-violet-500/10 ${isCurrent ? 'ring-1 ring-violet-500/50 border-violet-500/20 shadow-[0_0_30px_-10px_rgba(139,92,246,0.2)]' : 'hover:border-white/10'}`}>
            {/* Background Gradient Mesh */}
            <div className={`absolute inset-0 bg-gradient-to-br from-violet-500/5 via-transparent to-fuchsia-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />

            {/* Active Indicator Glow */}
            {isCurrent && (
                <div className="absolute top-0 right-0 w-32 h-32 bg-violet-500/20 blur-[60px] rounded-full -mr-16 -mt-16 pointer-events-none" />
            )}

            <CardHeader className="relative">
                <CardTitle className="flex items-center gap-4">
                    <div className={`p-3 rounded-2xl transition-all duration-300 ${isCurrent ? 'bg-gradient-to-br from-violet-600 to-indigo-600 shadow-lg shadow-violet-500/20' : 'bg-white/5 border border-white/5 group-hover:border-white/10 group-hover:bg-white/10'}`}>
                        <Building2 className={`w-6 h-6 ${isCurrent ? 'text-white' : 'text-gray-400 group-hover:text-white'}`} />
                    </div>
                    <div className="flex flex-col">
                        <span className={`text-lg font-bold tracking-tight ${isCurrent ? 'text-white' : 'text-gray-200 group-hover:text-white transition-colors'}`}>
                            {branch.name || branch.branch.businessName || 'Sin Nombre'}
                        </span>
                        {isCurrent && <span className="text-[10px] font-medium text-violet-400 uppercase tracking-wider">Sucursal Activa</span>}
                    </div>
                </CardTitle>
            </CardHeader>
            <CardContent className="relative">
                <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5 hover:border-white/10 transition-colors">
                        <div className="flex flex-col">
                            <span className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">ID Sucursal</span>
                            <span className="text-xs font-mono text-gray-300">{branch.id.slice(0, 8)}...</span>
                        </div>
                        {/* We could add visual stats here later like "Status: Online" */}
                    </div>

                    {isCurrent && (
                        <div className="flex items-center gap-2 text-xs text-green-400 bg-green-500/10 px-3 py-1.5 rounded-lg border border-green-500/20 w-fit">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                            </span>
                            Conectado ahora
                        </div>
                    )}
                </div>
            </CardContent>
            <CardFooter className="relative pt-2">
                <Button
                    className={`w-full h-11 font-medium text-sm transition-all duration-300 rounded-xl ${isCurrent
                            ? 'bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 border-0'
                            : (!isOwner && hasOwnerSession)
                                ? 'bg-amber-600/10 hover:bg-amber-600/20 text-amber-500 border border-amber-600/20'
                                : !isOwner
                                    ? 'bg-white/5 text-gray-500 border border-white/5 cursor-not-allowed'
                                    : 'bg-white/5 hover:bg-white/10 text-white border border-white/10 hover:border-white/20'
                        }`}
                    variant={isCurrent ? "default" : "outline"}
                    onClick={handleEnter}
                    disabled={loading}
                >
                    {loading ? (
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : isCurrent ? (
                        <>
                            Ir al Dashboard <ExternalLink className="w-4 h-4 ml-2 opacity-50" />
                        </>
                    ) : (!isOwner && hasOwnerSession) ? (
                        'Cambiar a Dueño'
                    ) : !isOwner ? (
                        'Loguear como Dueño'
                    ) : (
                        <>
                            Administrar <ExternalLink className="w-4 h-4 ml-2 opacity-50" />
                        </>
                    )}
                </Button>
            </CardFooter>
        </Card>
    )
}
