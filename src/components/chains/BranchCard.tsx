'use client'

import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Building2, ExternalLink, Loader2 } from 'lucide-react'
import { enterBranch } from '@/actions/chain'
import { useState } from 'react'
import { toast } from 'sonner'
import { useClerk } from '@clerk/nextjs'

interface BranchCardProps {
    branch: {
        id: string
        name: string | null
        branch: {
            userId: string
            businessName: string | null
        }
    }
    isCurrent: boolean
}

export default function BranchCard({ branch, isCurrent }: BranchCardProps) {
    const [loading, setLoading] = useState(false)
    const { signOut } = useClerk()

    const handleEnter = async () => {
        if (isCurrent) return // Already here

        setLoading(true)
        try {
            const res = await enterBranch(branch.branch.userId)
            if (res.success && res.url) {
                // Critical: Sign out first to ensure the new token becomes the ACTIVE session
                // We pass a callback to signOut to execute the redirect afterwards? 
                // Clerk signOut is async.

                // Note: signOut() might reload the page or redirect to sign-in.
                // We want to redirect to the *token URL* instead.
                // So we shouldn't use default signOut redirect.

                await signOut({ redirectUrl: res.url })

                // Fallback if signOut redirect doesn't trigger immediately
                // window.location.href = res.url
            } else {
                throw new Error(res.error || 'Error desconocido')
            }
        } catch (error: any) {
            toast.error(error.message)
            setLoading(false)
        }
    }

    return (
        <Card className={`relative overflow-hidden transition-all hover:border-primary/50 ${isCurrent ? 'border-primary ring-1 ring-primary/20' : ''}`}>
            <div className="absolute top-0 right-0 p-4 opacity-10">
                <Building2 className="w-24 h-24" />
            </div>

            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <div className="p-2 bg-muted rounded-lg">
                        <Building2 className="w-4 h-4 text-primary" />
                    </div>
                    {branch.name || branch.branch.businessName || 'Sin Nombre'}
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">ID: {branch.id.slice(0, 8)}...</p>
                    {isCurrent && (
                        <span className="inline-flex items-center px-2 py-1 text-xs font-medium text-green-700 bg-green-50 rounded-full">
                            Sesión Actual
                        </span>
                    )}
                </div>
            </CardContent>
            <CardFooter>
                <Button
                    className="w-full"
                    variant={isCurrent ? "outline" : "default"}
                    onClick={handleEnter}
                    disabled={isCurrent || loading}
                >
                    {loading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                    ) : isCurrent ? (
                        'Seleccionado'
                    ) : (
                        <>
                            Administrar <ExternalLink className="w-4 h-4 ml-2" />
                        </>
                    )}
                </Button>
            </CardFooter>
        </Card>
    )
}
