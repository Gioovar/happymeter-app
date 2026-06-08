'use client'

import { useState } from 'react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { SignOutButton, useClerk } from '@clerk/nextjs'
import {
    CreditCard,
    Settings,
    LogOut,
    User,
    HelpCircle,
    Zap,
    Users,
    LayoutGrid,
    Moon,
    Languages,
    Store
} from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

interface UserProfileProps {
    user: {
        firstName?: string | null
        lastName?: string | null
        fullName?: string | null // Support new field
        email?: string
        imageUrl?: string
        businessName?: string | null // Support businessName from userSettings
    } | null
    plan: string
    onUpgrade: () => void
}

import { useParams } from 'next/navigation'
import InviteMemberModal from '@/components/team/InviteMemberModal'
import { useDashboard } from '@/context/DashboardContext'

export default function UserProfile({ user, plan, onUpgrade }: UserProfileProps) {
    const [isOpen, setIsOpen] = useState(false)
    const [isInviteModalOpen, setIsInviteModalOpen] = useState(false)
    const { signOut } = useClerk()
    const { branchSlug } = useParams()
    const { basePath } = useDashboard()

    // Derived state
    const fullName = user?.fullName || `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'Usuario'
    const businessName = user?.businessName || ''
    const email = user?.email || ''
    const initials = (user?.firstName?.[0] || '') + (user?.lastName?.[0] || '') || 'U'
    const isPro = plan !== 'FREE'

    return (
        <>
            <Popover open={isOpen} onOpenChange={setIsOpen}>
                <PopoverTrigger asChild>
                    <div
                        className={cn(
                            "flex items-center gap-3 px-3 py-2 rounded-xl cursor-pointer transition-all border group",
                            isOpen
                                ? "bg-accent border-border"
                                : "bg-transparent border-transparent hover:bg-accent"
                        )}
                    >
                        <Avatar className="h-9 w-9 border border-border">
                            <AvatarImage src={user?.imageUrl} alt={fullName} />
                            <AvatarFallback className="bg-violet-600 text-white font-bold text-xs">{initials}</AvatarFallback>
                        </Avatar>

                        <div className="flex-1 text-left overflow-hidden">
                            <p className="text-sm font-bold text-foreground truncate">{fullName}</p>
                            {businessName && (
                                <p className="text-[10px] text-indigo-500 dark:text-indigo-400 truncate uppercase font-bold tracking-wider">{businessName}</p>
                            )}
                            <p className="text-[10px] text-muted-foreground truncate">{email}</p>
                        </div>

                        {/* Plan Badge (Mini) */}
                        <div className={cn(
                            "w-2 h-2 rounded-full",
                            isPro ? "bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]" : "bg-gray-600"
                        )} />
                    </div>
                </PopoverTrigger>

                <PopoverContent
                    side="right"
                    align="end"
                    sideOffset={16}
                    className="w-80 bg-popover border border-border p-0 shadow-2xl rounded-2xl overflow-hidden"
                >
                    {/* Header */}
                    <div className="p-4 bg-background border-b border-border">
                        <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10 border border-border">
                                <AvatarImage src={user?.imageUrl} alt={fullName} />
                                <AvatarFallback className="bg-violet-600 text-white font-bold">{initials}</AvatarFallback>
                            </Avatar>
                            <div>
                                <p className="text-sm font-bold text-foreground flex items-center gap-2">
                                    {fullName}
                                    {isPro && <Zap className="w-3 h-3 text-yellow-400 fill-yellow-400" />}
                                </p>
                                {businessName && (
                                    <p className="text-xs text-indigo-500 dark:text-indigo-400 font-medium mb-0.5">{businessName}</p>
                                )}
                                <p className="text-xs text-muted-foreground">{email}</p>
                            </div>
                        </div>
                    </div>

                    {/* Main Actions */}
                    <div className="p-3 grid gap-2">
                        {!isPro ? (
                            <button
                                onClick={() => {
                                    setIsOpen(false)
                                    onUpgrade()
                                }}
                                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm transition-all shadow-lg shadow-blue-600/20"
                            >
                                <Zap className="w-4 h-4 fill-current" />
                                Mejorar Plan
                            </button>
                        ) : (
                            <Link
                                href={`${basePath}/settings`}
                                onClick={() => setIsOpen(false)}
                                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-accent hover:bg-accent/80 text-foreground font-bold text-sm transition-all border border-border"
                            >
                                <Settings className="w-4 h-4" />
                                Gestionar Suscripción
                            </Link>
                        )}

                        <button
                            onClick={() => {
                                setIsOpen(false)
                                setIsInviteModalOpen(true)
                            }}
                            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-accent hover:bg-accent/80 text-foreground font-medium text-sm transition-all border border-border"
                        >
                            <Users className="w-4 h-4" />
                            Añadir Miembros
                        </button>
                    </div>

                    {/* Usage Stats (Placeholder) */}
                    <div className="px-4 py-3 border-t border-b border-border bg-background/50">
                        <div className="flex items-center justify-between text-xs mb-1.5">
                            <span className="text-muted-foreground flex items-center gap-1.5"><Store className="w-3 h-3" /> Sucursales Activas</span>
                            <span className="text-foreground font-mono">{isPro ? '3 / 10' : '1 / 1'}</span>
                        </div>
                        <div className="h-1.5 w-full bg-accent rounded-full overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-blue-600 to-cyan-500 rounded-full"
                                style={{ width: isPro ? '30%' : '100%' }}
                            />
                        </div>
                    </div>

                    {/* Menu Items */}
                    <div className="p-2 space-y-0.5">
                        <Link href={`${basePath}/settings`} onClick={() => setIsOpen(false)} className="flex items-center gap-3 px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg transition-colors">
                            <CreditCard className="w-4 h-4" />
                            Plan y Facturación
                        </Link>
                        <Link href={`${basePath}/settings`} onClick={() => setIsOpen(false)} className="flex items-center gap-3 px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg transition-colors">
                            <Settings className="w-4 h-4" />
                            Ajustes
                        </Link>
                        <Link href="/creators" onClick={() => setIsOpen(false)} className="flex items-center gap-3 px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg transition-colors">
                            <User className="w-4 h-4" />
                            Perfil de Creador
                        </Link>

                        <div className="my-1 h-px bg-border mx-2" />

                        <div className="flex items-center gap-3 px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg transition-colors cursor-pointer justify-between group">
                            <div className="flex items-center gap-3">
                                <Languages className="w-4 h-4" />
                                Idioma
                            </div>
                            <span className="text-xs bg-accent px-1.5 py-0.5 rounded text-muted-foreground group-hover:text-foreground transition-colors">Español</span>
                        </div>
                        <div className="flex items-center gap-3 px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg transition-colors cursor-pointer justify-between group">
                            <div className="flex items-center gap-3">
                                <Moon className="w-4 h-4" />
                                Tema
                            </div>
                            <span className="text-xs bg-accent px-1.5 py-0.5 rounded text-muted-foreground group-hover:text-foreground transition-colors font-medium">Oscuro</span>
                        </div>

                        <Link href="/help" onClick={() => setIsOpen(false)} className="flex items-center gap-3 px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg transition-colors">
                            <HelpCircle className="w-4 h-4" />
                            Ayuda
                        </Link>
                    </div>

                    <div className="p-2 border-t border-border bg-background">
                        <SignOutButton>
                            <button className="w-full flex items-center gap-3 px-3 py-2 text-sm text-red-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors font-medium">
                                <LogOut className="w-4 h-4" />
                                Cerrar Sesión
                            </button>
                        </SignOutButton>
                    </div>

                </PopoverContent>
            </Popover>

            <InviteMemberModal
                isOpen={isInviteModalOpen}
                onOpenChange={setIsInviteModalOpen}
                branchSlug={branchSlug as string}
            />
        </>
    )
}
