import { currentUser } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { UserButton } from '@clerk/nextjs'
import { ArrowLeft, LayoutDashboard } from 'lucide-react'

export default async function ChainsLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const user = await currentUser()
    if (!user) redirect('/sign-in')

    return (
        <div className="min-h-screen bg-background">
            <header className="border-b">
                <div className="container flex items-center justify-between h-16 px-4">
                    <div className="flex items-center gap-4">
                        <Link href="/dashboard">
                            <Button variant="ghost" size="sm">
                                <ArrowLeft className="w-4 h-4 mr-2" />
                                Volver al Negocio
                            </Button>
                        </Link>
                        <div className="h-6 w-px bg-border" />
                        <Link href="/chains" className="flex items-center gap-2 font-semibold">
                            <LayoutDashboard className="w-5 h-5 text-primary" />
                            HappyMeter Chains
                        </Link>
                    </div>
                    <div className="flex items-center gap-4">
                        <UserButton afterSignOutUrl="/" />
                    </div>
                </div>
            </header>
            <main>
                {children}
            </main>
        </div>
    )
}
