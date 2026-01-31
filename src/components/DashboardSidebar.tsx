'use client'

import { useState, Suspense } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useSearchParams, useParams } from 'next/navigation'
import { Menu, X, Home, LogOut, Settings, LayoutDashboard, Shield, Store, Calendar, HelpCircle, ChevronDown, Users, Lock, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'
import { SignOutButton } from '@clerk/nextjs'
import BrandLogo from '@/components/BrandLogo'
import NotificationsBell from '@/components/notifications/NotificationsBell'
import CommandCenter from '@/components/CommandCenter'
import PWAInstallButton from '@/components/PWAInstallButton'
import { GLOBAL_NAV_ITEMS, NAVIGATION_CONFIG, NavigationMode, MODES } from '@/config/navigation'
import { useDashboard } from '@/context/DashboardContext'
import SalesModal from '@/components/plans/SalesModal'
import CreateBranchModal from './chains/CreateBranchModal'
import InviteMemberModal from '@/components/team/InviteMemberModal'
import UserProfile from './dashboard/UserProfile'
import FeatureGuard from '@/components/common/FeatureGuard'


// Helper to determine mode from pathname
const getActiveMode = (pathname: string | null): NavigationMode => {
    if (pathname?.includes('/loyalty') || pathname?.includes('/games') || pathname?.includes('/achievements')) return 'loyalty';
    if (pathname?.includes('/processes') || pathname?.includes('/supervision')) return 'processes';
    if (pathname?.includes('/reservations')) return 'reservations';
    return 'surveys';
};

// Navigation Component that uses searchParams (Must be wrapped in Suspense)
function SidebarNav({ setIsMobileOpen }: { setIsMobileOpen: (val: boolean) => void }) {
    const pathname = usePathname()
    const searchParams = useSearchParams()
    const params = useParams()
    const branchSlug = params?.branchSlug as string
    const { checkFeature } = useDashboard()

    const activeMode = getActiveMode(pathname)
    const currentModeItems = NAVIGATION_CONFIG[activeMode] || []

    return (
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto custom-scrollbar">
            {currentModeItems.map((item) => {
                const Icon = item.icon
                let finalHref = item.href;
                if (branchSlug) {
                    if (finalHref === '/dashboard') {
                        finalHref = `/dashboard/${branchSlug}`
                    } else if (finalHref.startsWith('/dashboard/')) {
                        finalHref = finalHref.replace('/dashboard', `/dashboard/${branchSlug}`)
                    }
                }

                const isActive = (() => {
                    const [itemPath, itemQuery] = finalHref.split('?')
                    if (pathname !== itemPath) return false;
                    if (item.query || itemQuery) {
                        const targetParams = item.query || Object.fromEntries(new URLSearchParams(itemQuery));
                        for (const [key, value] of Object.entries(targetParams)) {
                            if (searchParams?.get(key) !== value) return false
                        }
                        return true
                    }
                    return true;
                })()


                const isLocked = item.feature ? !checkFeature(item.feature) : false

                const LinkComponent = (
                    <Link
                        key={item.title}
                        href={item.query ? `${finalHref}?${new URLSearchParams(item.query)}` : finalHref}
                        onClick={() => setIsMobileOpen(false)}
                        className={cn(
                            "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200",
                            isActive
                                ? "bg-violet-600 text-white shadow-lg shadow-violet-600/20"
                                : "text-gray-400 hover:text-white hover:bg-white/5",
                            isLocked && "opacity-70"
                        )}
                    >
                        <Icon className="w-5 h-5" />
                        <span className="flex-1">{item.title}</span>
                        {isLocked && <Lock className="w-3 h-3 text-gray-500" />}
                    </Link>
                )

                // If locked, Wrap in FeatureGuard (which adds the onclick interceptor)
                if (item.feature) {
                    return (
                        <FeatureGuard key={item.title} feature={item.feature}>
                            {LinkComponent}
                        </FeatureGuard>
                    )
                }

                return LinkComponent
            })}
        </nav>
    )
}

export default function DashboardSidebar({
    isCreator,
    userRole,
    hasChain,
    userPlan = 'FREE',
    user
}: {
    isCreator?: boolean,
    userRole?: string,
    hasChain?: boolean,
    userPlan?: string,
    user?: any
}) {
    const { isMobileMenuOpen, toggleMobileMenu, chains } = useDashboard() // Get chains from context
    const params = useParams()
    const branchSlug = params?.branchSlug as string
    const [isModeSelectorOpen, setIsModeSelectorOpen] = useState(false)
    const [isSalesModalOpen, setIsSalesModalOpen] = useState(false)
    const [isInviteModalOpen, setIsInviteModalOpen] = useState(false)
    const pathname = usePathname()

    // Helper to get chain dashboard url
    const firstBranchUrl = '/dashboard/chains'

    // Detect Chain Dashboard View (or Corporate Chat)
    const isChainView = pathname === '/dashboard/chains' || pathname === '/dashboard/chat'

    const SidebarContent = () => (
        <>
            <div className="p-6 border-b border-white/10 flex justify-between items-center bg-[#111]">
                <div>
                    <Link href={branchSlug ? `/dashboard/${branchSlug}` : '/dashboard'} className="block hover:opacity-90 transition-opacity">
                        <BrandLogo className="mb-1" />
                    </Link>
                    <p className="text-xs text-gray-500 mt-1">Panel de Usuario ({userPlan === 'FREE' ? 'Gratuito' : 'Pro'})</p>
                </div>

                <div className="hidden md:block">
                    <NotificationsBell align="left" />
                </div>

                <button
                    onClick={() => toggleMobileMenu(false)}
                    className="md:hidden p-2 text-gray-400 hover:text-white"
                >
                    <X className="w-6 h-6" />
                </button>
            </div>

            {/* --- CHAIN DASHBOARD SIDEBAR (EXCLUSIVE VIEW) --- */}
            {isChainView ? (
                <div className="px-4 py-4 space-y-3">
                    <FeatureGuard feature="ai_analytics">
                        <Link
                            href="/dashboard/chat"
                            onClick={() => toggleMobileMenu(false)}
                            className="relative group w-full mb-6 rounded-xl overflow-hidden transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-violet-900/20"
                        >
                            {/* Main Background */}
                            <div className="relative w-full h-full bg-[#050505] rounded-xl px-4 py-3 flex items-center gap-4 group-hover:bg-[#0a0a0a] transition-colors border border-white/5">

                                {/* Strong Left Glow Line (Active Laser) */}
                                <div className="absolute left-0 top-0 bottom-0 w-1.5 z-10 overflow-hidden rounded-l-xl">
                                    <div className="absolute inset-0 bg-gradient-to-b from-violet-600 via-fuchsia-400 to-violet-600 bg-[length:100%_200%] animate-pulse" />
                                </div>

                                <div className="relative z-10 p-2.5 bg-[#1a1a1a] rounded-xl border border-white/5 group-hover:border-violet-500/30 transition-colors ml-1">
                                    <Image
                                        src="/happy-ai-logo.png"
                                        alt="AI Logo"
                                        width={20}
                                        height={20}
                                        className="w-5 h-5 object-contain brightness-0 invert opacity-90"
                                    />
                                </div>

                                <div className="relative z-10 flex flex-col justify-center">
                                    <div className="flex flex-col leading-none mb-1">
                                        <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest group-hover:text-violet-300 transition-colors">Asistente</span>
                                        <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest group-hover:text-violet-300 transition-colors">Corporativo</span>
                                    </div>
                                    <div className="flex flex-col leading-none">
                                        <span className="text-sm font-bold text-white">Consultar</span>
                                        <span className="text-sm font-bold text-white">Estrategia</span>
                                    </div>
                                </div>

                                <div className="ml-auto relative z-10">
                                    <Sparkles className="w-5 h-5 text-violet-500 animate-pulse drop-shadow-[0_0_8px_rgba(139,92,246,0.5)]" />
                                </div>
                            </div>
                        </Link>
                    </FeatureGuard>

                    <p className="px-2 text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">Selecciona una Sucursal</p>

                    {chains.length > 0 && chains[0].branches.length > 0 ? (
                        chains[0].branches.map((branch) => {
                            const bSlug = branch.slug || branch.branchId
                            return (
                                <Link
                                    key={branch.id}
                                    href={`/dashboard/${bSlug}`}
                                    onClick={() => toggleMobileMenu(false)}
                                    className="flex items-center gap-3 px-3 py-3 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-violet-500/30 text-gray-300 hover:text-white transition-all group shadow-sm hover:shadow-lg hover:shadow-violet-900/10"
                                >
                                    <div className="p-2 rounded-lg bg-gradient-to-br from-violet-600/20 to-indigo-600/20 text-violet-400 group-hover:text-white transition-colors">
                                        <Store className="w-5 h-5" />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-sm font-bold leading-tight group-hover:text-violet-200">
                                            {(branch.name && branch.name !== 'Sede Principal') ? branch.name : (branch.branch.businessName || branch.name || 'Sucursal')}
                                        </span>
                                        <span className="text-[10px] text-gray-500 group-hover:text-gray-400">Administrar</span>
                                    </div>
                                </Link>
                            )
                        })
                    ) : (
                        <div className="p-4 rounded-xl bg-white/5 border border-dashed border-white/10 text-center">
                            <Store className="w-8 h-8 text-gray-600 mx-auto mb-2" />
                            <p className="text-sm text-gray-400">No tienes sucursales vinculadas.</p>
                        </div>
                    )}

                    <div className="h-px bg-white/5 my-4" />
                    {/* Optional: Add "Create New Branch" button here if desired by user logic, but request was specific about replacing items */}
                </div>
            ) : (
                /* --- STANDARD SIDEBAR VIEW --- */
                <>
                    <div className="px-4 pb-2 pt-2">
                        <FeatureGuard feature="ai_analytics">
                            <Link
                                href={branchSlug ? `/dashboard/${branchSlug}/chat` : `/dashboard/chat`}
                                id="nav-item-ai-chat"
                                onClick={() => toggleMobileMenu(false)}
                                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-md hover:shadow-cyan-600/20 transition-all group"
                            >
                                <Image
                                    src="/happy-ai-logo.png"
                                    alt="AI Logo"
                                    width={16}
                                    height={16}
                                    className="w-4 h-4 object-contain group-hover:rotate-12 transition-transform"
                                />
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-medium text-white/80 uppercase leading-none">Asistente Virtual</span>
                                    <span className="text-xs font-bold leading-tight">Consultar IA</span>
                                </div>
                            </Link>
                        </FeatureGuard>
                        <Link
                            href={branchSlug ? `/dashboard/${branchSlug}/settings` : `/dashboard/settings`}
                            onClick={() => toggleMobileMenu(false)}
                            className="flex items-center gap-2 px-3 py-2 rounded-lg border border-white/10 hover:bg-white/5 text-gray-400 hover:text-white transition-all group mt-2"
                        >
                            <Settings className="w-4 h-4 group-hover:rotate-90 transition-transform" />
                            <div className="flex flex-col">
                                <span className="text-[10px] font-medium text-gray-500 group-hover:text-gray-400 uppercase leading-none">Ajustes</span>
                                <span className="text-xs font-bold leading-tight">Editar Sucursal</span>
                            </div>
                        </Link>
                    </div>

                    <Suspense fallback={<div className="flex-1 p-4"><div className="w-full h-8 bg-white/5 rounded-xl animate-pulse" /></div>}>
                        <SidebarNav setIsMobileOpen={toggleMobileMenu} />
                    </Suspense>

                    <div className="px-4 pb-3 mt-6">
                        <div className="mt-2">
                            <PWAInstallButton className="w-full" />
                        </div>
                    </div>

                    {isCreator && (
                        <div className="px-4 pb-3">
                            <Link
                                href="/creators/dashboard"
                                onClick={() => toggleMobileMenu(false)}
                                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-md hover:shadow-violet-600/20 transition-all group"
                            >
                                <LayoutDashboard className="w-4 h-4 group-hover:scale-110 transition-transform" />
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-medium text-white/80 uppercase leading-none">Ir a Modo</span>
                                    <span className="text-xs font-bold leading-tight">Creador</span>
                                </div>
                            </Link>
                        </div>
                    )}

                    {
                        /* Link to Chains/Branches */
                        (!isCreator && userRole !== 'STAFF' && userRole !== 'OPERATOR') && (
                            <div className="px-4 pb-3">
                                {userPlan === 'FREE' ? (
                                    <>
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.preventDefault()
                                                e.stopPropagation()
                                                toggleMobileMenu(false)
                                                setIsSalesModalOpen(true)
                                            }}
                                            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-gradient-to-r from-emerald-600 to-green-600 text-white shadow-md hover:shadow-emerald-600/20 transition-all group text-left animate-pulse mb-3"
                                        >
                                            <Store className="w-4 h-4 group-hover:scale-110 transition-transform" />
                                            <div className="flex flex-col">
                                                <span className="text-[10px] font-medium text-white/80 uppercase leading-none">Mejorar Plan</span>
                                                <span className="text-xs font-bold leading-tight">Activar Negocio</span>
                                            </div>
                                        </button>

                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.preventDefault()
                                                e.stopPropagation()
                                                toggleMobileMenu(false)
                                                setIsInviteModalOpen(true)
                                            }}
                                            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg border border-white/10 hover:bg-white/5 text-gray-400 hover:text-white transition-all group text-left"
                                        >
                                            <Users className="w-4 h-4 group-hover:scale-110 transition-transform" />
                                            <span className="text-xs font-bold leading-tight">Añadir Miembros</span>
                                        </button>

                                        <SalesModal
                                            isOpen={isSalesModalOpen}
                                            onOpenChange={setIsSalesModalOpen}
                                        />
                                        <InviteMemberModal
                                            isOpen={isInviteModalOpen}
                                            onOpenChange={setIsInviteModalOpen}
                                            branchSlug={branchSlug}
                                        />
                                    </>
                                ) : (
                                    hasChain ? (
                                        <>
                                            <Link
                                                href="/dashboard/chains"
                                                onClick={() => toggleMobileMenu(false)}
                                                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gradient-to-r from-amber-600 to-yellow-600 text-white shadow-md hover:shadow-amber-600/20 transition-all group mb-3"
                                            >
                                                <Store className="w-4 h-4 group-hover:scale-110 transition-transform" />
                                                <div className="flex flex-col">
                                                    <span className="text-[10px] font-medium text-white/80 uppercase leading-none">Negocios</span>
                                                    <span className="text-xs font-bold leading-tight">Mis Sucursales</span>
                                                </div>
                                            </Link>

                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.preventDefault()
                                                    e.stopPropagation()
                                                    toggleMobileMenu(false)
                                                    setIsInviteModalOpen(true)
                                                }}
                                                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg border border-white/10 hover:bg-white/5 text-gray-400 hover:text-white transition-all group text-left"
                                            >
                                                <Users className="w-4 h-4 group-hover:scale-110 transition-transform" />
                                                <span className="text-xs font-bold leading-tight">Añadir Miembros</span>
                                            </button>
                                            <InviteMemberModal
                                                isOpen={isInviteModalOpen}
                                                onOpenChange={setIsInviteModalOpen}
                                                branchSlug={branchSlug}
                                            />
                                        </>
                                    ) : (
                                        <>
                                            <CreateBranchModal
                                                isFirstChain={true}
                                                trigger={
                                                    <button
                                                        type="button"
                                                        onClick={(e) => {
                                                            e.preventDefault()
                                                            e.stopPropagation()
                                                            toggleMobileMenu(false)
                                                        }}
                                                        className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-gradient-to-r from-amber-600 to-yellow-600 text-white shadow-md hover:shadow-amber-600/20 transition-all group text-left mb-3"
                                                    >
                                                        <Store className="w-4 h-4 group-hover:scale-110 transition-transform" />
                                                        <div className="flex flex-col">
                                                            <span className="text-[10px] font-medium text-white/80 uppercase leading-none">Negocios</span>
                                                            <span className="text-xs font-bold leading-tight">Mis Sucursales</span>
                                                        </div>
                                                    </button>
                                                }
                                            />
                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.preventDefault()
                                                    e.stopPropagation()
                                                    toggleMobileMenu(false)
                                                    setIsInviteModalOpen(true)
                                                }}
                                                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg border border-white/10 hover:bg-white/5 text-gray-400 hover:text-white transition-all group text-left"
                                            >
                                                <Users className="w-4 h-4 group-hover:scale-110 transition-transform" />
                                                <span className="text-xs font-bold leading-tight">Añadir Miembros</span>
                                            </button>
                                            <InviteMemberModal
                                                isOpen={isInviteModalOpen}
                                                onOpenChange={setIsInviteModalOpen}
                                                branchSlug={branchSlug}
                                            />
                                        </>
                                    )
                                )}
                            </div>
                        )
                    }
                </>
            )}

            {
                (userRole === 'ADMIN' || userRole === 'SUPER_ADMIN') && (
                    <div className="px-4 pb-3">
                        <Link
                            href="/admin"
                            onClick={() => toggleMobileMenu(false)}
                            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gradient-to-r from-red-600 to-orange-600 text-white shadow-md hover:shadow-red-600/20 transition-all group"
                        >
                            <Shield className="w-4 h-4 group-hover:scale-110 transition-transform" />
                            <div className="flex flex-col">
                                <span className="text-[10px] font-medium text-white/80 uppercase leading-none">Admin Panel</span>
                                <span className="text-xs font-bold leading-tight">Gestión Total</span>
                            </div>
                        </Link>
                    </div>
                )
            }

            {
                (userRole === 'STAFF' || userRole === 'SUPER_ADMIN') && (
                    <div className="px-4 pb-3 space-y-2">
                        <Link
                            href="/staff"
                            onClick={() => toggleMobileMenu(false)}
                            className={cn(
                                "flex items-center gap-3 px-4 py-3 rounded-xl transition-all group",
                                pathname === '/staff'
                                    ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg"
                                    : "text-gray-400 hover:text-white hover:bg-white/5"
                            )}
                        >
                            <Shield className="w-5 h-5 group-hover:scale-110 transition-transform" />
                            <div className="flex flex-col">
                                <span className={cn("text-xs font-medium uppercase", pathname === '/staff' ? "text-white/80" : "text-gray-500")}>Staff Panel</span>
                                <span className="text-sm font-bold">Operaciones</span>
                            </div>
                        </Link>

                        <Link
                            href="/staff/places"
                            onClick={() => toggleMobileMenu(false)}
                            className={cn(
                                "flex items-center gap-3 px-4 py-3 rounded-xl transition-all group",
                                pathname === '/staff/places'
                                    ? "bg-violet-600 text-white shadow-lg"
                                    : "text-gray-400 hover:text-white hover:bg-white/5"
                            )}
                        >
                            <Store className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                            <span className="text-sm font-medium">Lugares & Acuerdos</span>
                        </Link>

                        <Link
                            href="/staff/visits"
                            onClick={() => toggleMobileMenu(false)}
                            className={cn(
                                "flex items-center gap-3 px-4 py-3 rounded-xl transition-all group",
                                pathname === '/staff/visits'
                                    ? "bg-fuchsia-600 text-white shadow-lg"
                                    : "text-gray-400 hover:text-white hover:bg-white/5"
                            )}
                        >
                            <Calendar className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                            <span className="text-sm font-medium">Solicitudes de Visita</span>
                        </Link>


                    </div >
                )
            }

            <div className="p-4 border-t border-white/10 bg-[#111]">
                <UserProfile
                    user={user}
                    plan={userPlan}
                    onUpgrade={() => setIsSalesModalOpen(true)}
                />
            </div>
        </>
    )

    return (
        <>
            {/* Mobile Header */}
            <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-[#0a0a0a]/80 backdrop-blur-xl border-b border-white/5 flex items-center justify-between px-4 z-40 transition-all duration-300">
                <div className="flex items-center gap-2 flex-1">
                    <button
                        onClick={() => toggleMobileMenu(true)}
                        className="p-2 -ml-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors flex-shrink-0"
                    >
                        <Menu className="w-6 h-6" />
                    </button>

                    {/* Logo Icon Only on Mobile to save space */}
                    <div className="flex-shrink-0">
                        <BrandLogo withText={false} size="sm" />
                    </div>

                    <div className="relative flex-1 max-w-[200px]">
                        <button
                            onClick={() => setIsModeSelectorOpen(!isModeSelectorOpen)}
                            className={cn(
                                "w-full flex items-center justify-between gap-2 px-3 py-1.5 rounded-full border transition-all duration-300 shadow-lg group",
                                isModeSelectorOpen
                                    ? "bg-[#111] border-violet-500/50 text-white"
                                    : "bg-[#111] border-white/10 text-gray-300 hover:border-white/20"
                            )}
                        >
                            <span className="text-xs font-semibold bg-clip-text text-transparent bg-gradient-to-r from-violet-400 to-fuchsia-400 truncate">
                                Áreas de Trabajo
                            </span>
                            <ChevronDown className={cn(
                                "w-3 h-3 text-gray-400 transition-transform duration-200 flex-shrink-0",
                                isModeSelectorOpen && "rotate-180"
                            )} />
                        </button>

                        {/* Mode Selector Popup */}
                        {isModeSelectorOpen && (
                            <>
                                <div
                                    className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
                                    onClick={() => setIsModeSelectorOpen(false)}
                                />
                                <div className="absolute top-full left-0 right-0 mt-3 bg-[#18181b] border border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200 origin-top p-1.5">
                                    <div className="grid gap-1">
                                        {MODES.map((mode) => {
                                            const isActive = getActiveMode(pathname) === mode.id
                                            const Icon = mode.icon
                                            return (
                                                <Link
                                                    key={mode.id}
                                                    href={branchSlug ? mode.href.replace('/dashboard', `/dashboard/${branchSlug}`) : mode.href}
                                                    onClick={() => setIsModeSelectorOpen(false)}
                                                    className={cn(
                                                        "flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-all duration-200 items-start",
                                                        isActive
                                                            ? "bg-gradient-to-r from-violet-600/20 to-indigo-600/20 text-white border border-white/5"
                                                            : "text-gray-400 hover:text-white hover:bg-white/5 border border-transparent"
                                                    )}
                                                >
                                                    <div className={cn(
                                                        "p-2 rounded-lg transition-colors bg-[#0a0a0a] border border-white/5",
                                                        isActive ? "text-violet-400 shadow-[0_0_10px_rgba(139,92,246,0.3)]" : "text-gray-500 group-hover:text-gray-300"
                                                    )}>
                                                        <Icon className="w-4 h-4" />
                                                    </div>
                                                    <div>
                                                        <span className={cn("block font-semibold", isActive ? "text-white" : "text-gray-300")}>
                                                            {mode.label}
                                                        </span>
                                                        <span className="text-[10px] text-gray-500 font-normal">
                                                            {mode.label === 'Encuestas' && 'Gestiona tus métricas'}
                                                            {mode.label === 'Lealtad' && 'Premios y clientes'}
                                                            {mode.label === 'Procesos' && 'Flujos y tareas'}
                                                            {mode.label === 'Reservas' && 'Agenda y citas'}
                                                        </span>
                                                    </div>
                                                </Link>
                                            )
                                        })}
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>
                {/* Notifications on Mobile */}
                <div className="flex items-center gap-2">
                    <NotificationsBell />
                </div>
            </div>

            {/* Mobile Drawer */}
            {isMobileMenuOpen && (
                <div className="fixed inset-0 z-50 md:hidden">
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                        onClick={() => toggleMobileMenu(false)}
                    />
                    {/* Sidebar container */}
                    <aside className="absolute inset-y-0 left-0 w-64 bg-[#111] border-r border-white/10 flex flex-col h-full shadow-2xl animate-in slide-in-from-left duration-200">
                        <SidebarContent />
                    </aside>
                </div>
            )}

            {/* Desktop Sidebar */}
            <aside className="w-64 bg-[#111] border-r border-white/10 flex-col h-screen sticky top-0 hidden md:flex z-50">
                <SidebarContent />
            </aside>
            <CommandCenter />
        </>
    )
}

