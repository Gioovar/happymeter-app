'use client'

import { useState, Suspense } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useSearchParams, useParams } from 'next/navigation'
import { Menu, X, Home, LogOut, Settings, LayoutDashboard, Shield, Store, Calendar, HelpCircle, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { SignOutButton } from '@clerk/nextjs'
import BrandLogo from '@/components/BrandLogo'
import NotificationsBell from '@/components/notifications/NotificationsBell'
import CommandCenter from '@/components/CommandCenter'
import PWAInstallButton from '@/components/PWAInstallButton'

import { GLOBAL_NAV_ITEMS, NAVIGATION_CONFIG, NavigationMode, MODES } from '@/config/navigation'

// Helper to determine mode from pathname (Shared logic, could be extracted but fine here)
const getActiveMode = (pathname: string | null): NavigationMode => {
    if (pathname?.includes('/dashboard/loyalty') || pathname?.includes('/dashboard/games') || pathname?.includes('/dashboard/achievements')) return 'loyalty';
    if (pathname?.includes('/dashboard/processes')) return 'processes';
    if (pathname?.includes('/dashboard/reservations')) return 'reservations';
    return 'surveys';
};

// Navigation Component that uses searchParams (Must be wrapped in Suspense)
function SidebarNav({ setIsMobileOpen }: { setIsMobileOpen: (val: boolean) => void }) {
    const pathname = usePathname()
    const searchParams = useSearchParams()

    // Get branchSlug from params (URL source of truth)
    const params = useParams()
    const branchSlug = params?.branchSlug as string

    // Get items for current mode
    const activeMode = getActiveMode(pathname)
    const currentModeItems = NAVIGATION_CONFIG[activeMode] || []

    // Combine mode items + separator + global items if needed, or just render them
    // For now, let's render Mode Items primarily. Global items might go at bottom or shared.
    // The design often puts Global items at the bottom separate section.
    // Let's check the original design. It had "Ayuda" at bottom.
    // We will render ONLY the mode specific items here in the main nav.

    // Actually, looking at the layout, there is a separate section at the bottom key 299 for "Global" things.
    // So we just iterate currentModeItems here.

    return (
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto custom-scrollbar">
            {/* Mode Specific Items */}
            {currentModeItems.map((item) => {
                const Icon = item.icon

                // Construct the correct HREF based on context
                let finalHref = item.href;
                if (branchSlug) {
                    // Start replace '/dashboard' with '/dashboard/slug'
                    // But handle carefully. item.href usually starts with /dashboard
                    if (finalHref === '/dashboard') {
                        finalHref = `/dashboard/${branchSlug}`
                    } else if (finalHref.startsWith('/dashboard/')) {
                        finalHref = finalHref.replace('/dashboard', `/dashboard/${branchSlug}`)
                    }
                    // If href is external or root '/', leave it? 
                    // Usually we want to stay in dashboard.
                }

                // Logic to check if active considering query params
                const isActive = (() => {
                    const [itemPath, itemQuery] = finalHref.split('?')

                    // 1. Path check
                    // If we are in branch mode, pathname handles the slug relative match?
                    // Actually pathname includes the slug. finalHref includes slug. So exact match works.
                    if (pathname !== itemPath) return false;

                    // 2. Query check (same as before)
                    if (item.query || itemQuery) {
                        const targetParams = item.query || Object.fromEntries(new URLSearchParams(itemQuery));
                        for (const [key, value] of Object.entries(targetParams)) {
                            if (searchParams?.get(key) !== value) return false
                        }
                        return true
                    }

                    // 3. Sibling check (same as before) with updated HREFs? 
                    // This creates complexity if we change hrefs dynamically. 
                    // Simplified: just match path/query.

                    return true;
                })()

                return (
                    <Link
                        key={item.title} // Use title as key since href might be duplicated with diff queries
                        href={item.query ? `${finalHref}?${new URLSearchParams(item.query)}` : finalHref}
                        onClick={() => setIsMobileOpen(false)}
                        className={cn(
                            "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200",
                            isActive
                                ? "bg-violet-600 text-white shadow-lg shadow-violet-600/20"
                                : "text-gray-400 hover:text-white hover:bg-white/5"
                        )}
                    >
                        <Icon className="w-5 h-5" />
                        {item.title}
                    </Link>
                )
            })}
        </nav>
    )
}

import { useDashboard } from '@/context/DashboardContext'

export default function DashboardSidebar({ isCreator, userRole }: { isCreator?: boolean, userRole?: string }) {
    const { isMobileMenuOpen, toggleMobileMenu } = useDashboard()
    const params = useParams()
    const branchSlug = params?.branchSlug as string
    const [isModeSelectorOpen, setIsModeSelectorOpen] = useState(false)
    const pathname = usePathname() // Safe to use here without Suspense in Layout generally, but safer to keep high

    const SidebarContent = () => (
        <>
            <div className="p-6 border-b border-white/10 flex justify-between items-center bg-[#111]">
                <div>
                    <Link href={branchSlug ? `/dashboard/${branchSlug}` : '/dashboard'} className="block hover:opacity-90 transition-opacity">
                        <BrandLogo className="mb-1" />
                    </Link>
                    <p className="text-xs text-gray-500 mt-1">Panel de Usuario</p>
                </div>

                {/* Desktop Notification Bell (Only visible when not mobile drawer close button) */}
                <div className="hidden md:block">
                    <NotificationsBell align="left" />
                </div>

                {/* Close button for mobile only */}
                <button
                    onClick={() => toggleMobileMenu(false)}
                    className="md:hidden p-2 text-gray-400 hover:text-white"
                >
                    <X className="w-6 h-6" />
                </button>
            </div>

            <div className="px-4 pb-2 pt-2">
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
            </div>

            <Suspense fallback={<div className="flex-1 p-4"><div className="w-full h-8 bg-white/5 rounded-xl animate-pulse" /></div>}>
                <SidebarNav setIsMobileOpen={toggleMobileMenu} />
            </Suspense>

            <div className="px-4 pb-3 mt-6">

                <div className="mt-2">
                    <PWAInstallButton className="w-full" />
                </div>
            </div>


            {
                isCreator && (
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
                )
            }

            {
                /* Link to Chains/Branches - Visible for everyone except purely Staff/Creators restricted modes, 
                   but for simplicity, we show it to standard users who might want to upgrade. */
                (!isCreator && userRole !== 'STAFF' && userRole !== 'OPERATOR') && (
                    <div className="px-4 pb-3">
                        <Link
                            href="/chains"
                            onClick={() => toggleMobileMenu(false)}
                            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gradient-to-r from-amber-600 to-yellow-600 text-white shadow-md hover:shadow-amber-600/20 transition-all group"
                        >
                            <Store className="w-4 h-4 group-hover:scale-110 transition-transform" />
                            <div className="flex flex-col">
                                <span className="text-[10px] font-medium text-white/80 uppercase leading-none">Negocios</span>
                                <span className="text-xs font-bold leading-tight">Mis Sucursales</span>
                            </div>
                        </Link>
                    </div>
                )
            }

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

            <div className="p-4 border-t border-white/10 space-y-2 bg-[#111]">
                <Link
                    href="/"
                    onClick={() => toggleMobileMenu(false)}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl hover:bg-white/5 cursor-pointer transition text-gray-400 hover:text-white"
                >
                    <Home className="w-5 h-5" />
                    <span className="text-sm font-medium">Ir al Inicio</span>
                </Link>
                <Link
                    href={branchSlug ? `/dashboard/${branchSlug}/settings` : '/dashboard/settings'}
                    onClick={() => toggleMobileMenu(false)}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl hover:bg-white/5 cursor-pointer transition text-gray-400 hover:text-white"
                >
                    <Settings className="w-5 h-5" />
                    <span className="text-sm font-medium">Configuración</span>
                </Link>
                <SignOutButton>
                    <button className="w-full flex items-center gap-2 px-4 py-2 rounded-xl hover:bg-red-500/10 text-gray-400 hover:text-red-400 cursor-pointer transition">
                        <LogOut className="w-5 h-5" />
                        <span className="text-sm font-medium">Cerrar Sesión</span>
                    </button>
                </SignOutButton>
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

