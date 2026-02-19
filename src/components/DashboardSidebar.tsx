'use client'

import { useState, Suspense } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useSearchParams, useParams } from 'next/navigation'
import { Menu, X, Home, LogOut, Settings, LayoutDashboard, Shield, Store, Calendar, HelpCircle, ChevronDown, Users, Lock, Sparkles, MessageSquare } from 'lucide-react'
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
import TrialCountdown from '@/components/dashboard/TrialCountdown'


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
    const isChainView = pathname === '/dashboard/chains' || (pathname === '/dashboard/chat' && !branchSlug) || pathname === '/dashboard/team/chat'

    const SidebarContent = () => (
        <>
            <div className="p-6 border-b border-white/10 flex justify-between items-center bg-[#111]">
                <div>
                    <Link href={branchSlug ? `/dashboard/${branchSlug}` : '/dashboard'} className="block hover:opacity-90 transition-opacity">
                        <BrandLogo className="mb-1" />
                    </Link>
                    {(() => {
                        let currentBranchName = null
                        if (branchSlug) {
                            for (const chain of chains) {
                                const found = chain.branches.find(b => b.slug === branchSlug || b.branchId === branchSlug)
                                if (found) {
                                    currentBranchName = found.name || found.branch.businessName || 'Sucursal'
                                    break
                                }
                            }
                        }

                        return currentBranchName ? (
                            <div className="mt-1.5 flex flex-col items-start gap-1">
                                <span className="bg-gradient-to-r from-violet-600/20 to-fuchsia-600/20 text-violet-200 text-[10px] font-bold px-2 py-0.5 rounded-full border border-violet-500/30 uppercase tracking-wider shadow-sm">
                                    {currentBranchName}
                                </span>
                            </div>
                        ) : (
                            <p className="text-xs text-gray-500 mt-1">Panel de Usuario ({userPlan === 'FREE' ? 'Gratuito' : 'Pro'})</p>
                        )
                    })()}
                </div>

                <div className="hidden md:block">
                    <NotificationsBell
                        align="left"
                        currentBranchId={(() => {
                            if (!branchSlug) return undefined
                            // Find Branch ID from Slug in Chains
                            for (const chain of chains) {
                                const branch = chain.branches.find(b => b.slug === branchSlug || b.branchId === branchSlug)
                                if (branch) return branch.branchId
                            }
                            // Fallback: If slug IS the ID (legacy)
                            return branchSlug
                        })()}
                    />
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
                    {/* BACK TO DASHBOARD BUTTON */}
                    <Link
                        href={branchSlug ? `/dashboard/${branchSlug}` : '/dashboard'}
                        onClick={() => toggleMobileMenu(false)}
                        className="flex items-center gap-3 px-3 py-2.5 mb-6 rounded-xl border border-white/5 hover:bg-white/5 text-gray-400 hover:text-white transition-all group"
                    >
                        <div className="p-1.5 rounded-lg bg-gray-800 text-gray-400 group-hover:text-white">
                            <Home className="w-4 h-4" />
                        </div>
                        <span className="text-sm font-bold">Regresar al Dashboard</span>
                    </Link>

                    <FeatureGuard feature="ai_analytics">
                        <Link
                            href="/dashboard/chat"
                            onClick={() => toggleMobileMenu(false)}
                            className="relative group w-full mb-3 rounded-xl overflow-hidden transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-violet-900/20"
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

                    {/* NEW: Empleados Chat Button - REDESIGNED SMALLER */}
                    <Link
                        href="/dashboard/team/chat"
                        onClick={() => toggleMobileMenu(false)}
                        className={cn(
                            "relative group w-full mb-6 mx-0 rounded-xl overflow-hidden transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]",
                            (pathname as string) === '/dashboard/team/chat' ? "bg-emerald-600/10 shadow-lg shadow-emerald-900/20" : "hover:bg-white/5"
                        )}
                    >
                        <div className="relative w-full px-4 py-2.5 flex items-center gap-3 border border-white/5 rounded-xl">
                            {/* Subtler Left Glow Line (Emerald) */}
                            <div className={cn(
                                "absolute left-0 top-1 bottom-1 w-1 z-10 overflow-hidden rounded-full transition-opacity duration-500",
                                (pathname as string) === '/dashboard/team/chat' ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                            )}>
                                <div className="absolute inset-0 bg-gradient-to-b from-emerald-600 via-teal-400 to-emerald-600 bg-[length:100%_200%] animate-pulse" />
                            </div>

                            <div className={cn(
                                "relative z-10 p-1.5 rounded-lg border border-white/5 transition-colors",
                                (pathname as string) === '/dashboard/team/chat' ? "bg-emerald-600 text-white" : "bg-[#1a1a1a] text-emerald-500 group-hover:border-emerald-500/30"
                            )}>
                                <Users className="w-4 h-4" />
                            </div>

                            <div className="relative z-10 flex flex-col justify-center min-w-0">
                                <span className="text-xs font-bold text-white truncate">Chat con Empleados</span>
                                <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest leading-none mt-0.5 group-hover:text-emerald-400/70">Centro de Mensajería</span>
                            </div>

                            <div className="ml-auto relative z-10">
                                <MessageSquare className={cn(
                                    "w-4 h-4 transition-all",
                                    (pathname as string) === '/dashboard/team/chat' ? "text-emerald-400" : "text-gray-600 group-hover:text-emerald-500"
                                )} />
                            </div>
                        </div>
                    </Link>

                    <p className="px-2 text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">Selecciona una Sucursal</p>

                    {chains.length > 0 && chains[0].branches.length > 0 ? (
                        chains[0].branches.map((branch) => {
                            const bSlug = branch.slug || branch.branchId
                            return (
                                <Link
                                    key={branch.id}
                                    href={`/dashboard/${bSlug}`}
                                    onClick={() => toggleMobileMenu(false)}
                                    className={cn(
                                        "flex items-center gap-3 px-3 py-3 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-violet-500/30 text-gray-300 hover:text-white transition-all group shadow-sm hover:shadow-lg hover:shadow-violet-900/10",
                                        branchSlug === bSlug && "bg-violet-600/10 border-violet-500/50 text-white"
                                    )}
                                >
                                    <div className={cn(
                                        "p-2 rounded-lg bg-gradient-to-br transition-colors",
                                        branchSlug === bSlug ? "from-violet-600 to-indigo-600 text-white" : "from-violet-600/20 to-indigo-600/20 text-violet-400 group-hover:text-white"
                                    )}>
                                        <Store className="w-5 h-5" />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-sm font-bold leading-tight group-hover:text-violet-200">
                                            {(branch.name && branch.name !== 'Sede Principal') ? branch.name : (branch.branch.businessName || branch.name || 'Sucursal')}
                                        </span>
                                        <span className="text-[10px] text-gray-500 group-hover:text-gray-400">
                                            {branchSlug === bSlug ? "Gestionando ahora" : "Administrar"}
                                        </span>
                                    </div>
                                </Link>
                            )
                        })
                    ) : (
                        <div className="space-y-3">
                            {/* If no chains, look for user business name (single branch user) */}
                            <Link
                                href={branchSlug ? `/dashboard/${branchSlug}` : '/dashboard'}
                                onClick={() => toggleMobileMenu(false)}
                                className="flex items-center gap-3 px-3 py-3 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-violet-500/30 text-gray-300 hover:text-white transition-all group shadow-sm"
                            >
                                <div className="p-2 rounded-lg bg-gradient-to-br from-violet-600/20 to-indigo-600/20 text-violet-400 group-hover:text-white transition-colors">
                                    <Store className="w-5 h-5" />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-sm font-bold leading-tight group-hover:text-violet-200">
                                        {user?.businessName || 'Mi Negocio'}
                                    </span>
                                    <span className="text-[10px] text-gray-500 group-hover:text-gray-400">Panel Principal</span>
                                </div>
                            </Link>
                            <p className="px-2 text-[9px] text-gray-600 uppercase tracking-tighter italic">No tienes otras sucursales configuradas en cadena.</p>
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
                                href={(() => {
                                    if (branchSlug) return `/dashboard/${branchSlug}/chat`
                                    const firstBranch = chains.flatMap(c => c.branches)[0]
                                    if (firstBranch) return `/dashboard/${firstBranch.slug || firstBranch.branchId}/chat`
                                    return `/dashboard/chat`
                                })()}
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
                                        <div className="mb-3 relative">
                                            {/* Quick Branch Selector */}
                                            <button
                                                type="button"
                                                onClick={() => setIsModeSelectorOpen(!isModeSelectorOpen)}
                                                className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg bg-gradient-to-r from-amber-600 to-yellow-600 text-white shadow-md hover:shadow-amber-600/20 transition-all group text-left"
                                            >
                                                <div className="flex items-center gap-2">
                                                    <Store className="w-4 h-4" />
                                                    <div className="flex flex-col">
                                                        <span className="text-[10px] font-medium text-white/80 uppercase leading-none">Negocios</span>
                                                        <span className="text-xs font-bold leading-tight">Mis Sucursales</span>
                                                    </div>
                                                </div>
                                                <ChevronDown className={cn("w-4 h-4 transition-transform", isModeSelectorOpen ? "rotate-180" : "")} />
                                            </button>

                                            {isModeSelectorOpen && (
                                                <div className="absolute top-full left-0 right-0 mt-2 md:bottom-full md:top-auto md:mt-0 md:mb-2 bg-[#18181b] border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200 origin-top md:origin-bottom">

                                                    {/* Header: Corporate View */}
                                                    <div className="p-2 border-b border-white/5">
                                                        <Link
                                                            href="/dashboard/chains"
                                                            onClick={() => {
                                                                setIsModeSelectorOpen(false)
                                                                toggleMobileMenu(false)
                                                            }}
                                                            className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/5 text-gray-300 hover:text-white transition-all group"
                                                        >
                                                            <div className="p-1.5 rounded-md bg-white/5">
                                                                <LayoutDashboard className="w-4 h-4 text-gray-400 group-hover:text-white" />
                                                            </div>
                                                            <span className="text-sm font-medium">Panel Corporativo</span>
                                                        </Link>
                                                    </div>

                                                    {/* Branch List */}
                                                    <div className="max-h-60 overflow-y-auto custom-scrollbar p-2 space-y-1">
                                                        <p className="px-2 text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Sucursales</p>
                                                        {chains.flatMap(c => c.branches).map(branch => (
                                                            <Link
                                                                key={branch.id}
                                                                href={`/dashboard/${branch.slug || branch.branchId}`}
                                                                onClick={() => {
                                                                    setIsModeSelectorOpen(false)
                                                                    toggleMobileMenu(false)
                                                                }}
                                                                className={cn(
                                                                    "flex items-center gap-2 px-3 py-2 rounded-lg transition-all group",
                                                                    (branch.slug === branchSlug || branch.branchId === branchSlug)
                                                                        ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                                                                        : "hover:bg-white/5 text-gray-400 hover:text-white"
                                                                )}
                                                            >
                                                                <div className={cn(
                                                                    "w-2 h-2 rounded-full",
                                                                    (branch.slug === branchSlug || branch.branchId === branchSlug) ? "bg-amber-500" : "bg-gray-600 group-hover:bg-gray-500"
                                                                )} />
                                                                <span className="text-sm font-medium truncate">
                                                                    {branch.name || branch.branch.businessName || 'Sucursal'}
                                                                </span>
                                                            </Link>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
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

            <div className="mt-auto"> {/* Push this loop section to the bottom if flex-col, wait sidebar content isn't flex-col h-full... */}
                {/* Wait, SidebarContent is just a fragment inside a scroll container? No, let's verify layout. */}
                {/* SidebarContent usage: 'flex-col h-full' in parent */}
                {userPlan === 'FREE' && user?.createdAt && (
                    <Suspense fallback={null}>
                        <TrialCountdown createdAt={user.createdAt} />
                    </Suspense>
                )}
            </div>

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
                    <NotificationsBell
                        currentBranchId={(() => {
                            if (!branchSlug) return undefined
                            for (const chain of chains) {
                                const branch = chain.branches.find(b => b.slug === branchSlug || b.branchId === branchSlug)
                                if (branch) return branch.branchId
                            }
                            return branchSlug
                        })()}
                    />
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

