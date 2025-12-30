'use client'

import { useState, Suspense } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useSearchParams } from 'next/navigation'
import { LayoutDashboard, PlusCircle, HelpCircle, Settings, LogOut, Home, PieChart, Megaphone, Menu, X, FileText, Gamepad2, MessageSquare, Trophy, Shield, Store, Calendar, Users, GraduationCap, ScanLine } from 'lucide-react'
import { cn } from '@/lib/utils'
import { SignOutButton } from '@clerk/nextjs'
import BrandLogo from '@/components/BrandLogo'
import NotificationsBell from '@/components/notifications/NotificationsBell'
import CommandCenter from '@/components/CommandCenter'
import PWAInstallButton from '@/components/PWAInstallButton'

const menuItems = [
    {
        title: 'Mis Encuestas',
        href: '/dashboard',
        icon: LayoutDashboard
    },
    {
        title: 'Crear Nueva',
        href: '/dashboard/create',
        icon: PlusCircle
    },
    {
        title: 'Buzón Staff',
        href: '/dashboard/create?mode=anonymous',
        icon: Shield
    },
    {
        title: 'Respuestas',
        href: '/dashboard/responses',
        icon: MessageSquare
    },
    {
        title: 'Equipo',
        href: '/dashboard/team',
        icon: Users
    },
    {
        title: 'Configuración',
        href: '/dashboard/settings',
        icon: Settings
    },
    {
        title: 'Estadísticas',
        href: '/dashboard/analytics',
        icon: PieChart
    },
    {
        title: 'Reportes',
        href: '/dashboard/reports',
        icon: FileText
    },
    {
        title: 'Campañas',
        href: '/dashboard/campaigns',
        icon: Megaphone
    },
    {
        title: 'Lealtad',
        href: '/dashboard/loyalty',
        icon: ScanLine
    },
    {
        title: 'Clientes',
        href: '/dashboard/loyalty?tab=clients',
        icon: Users
    },
    {
        title: 'Juegos',
        href: '/dashboard/games',
        icon: Gamepad2
    },
    {
        title: 'Logros',
        href: '/dashboard/achievements',
        icon: Trophy
    },
    {
        title: 'Academy',
        href: '/dashboard/academy',
        icon: GraduationCap
    },
    {
        title: 'Ayuda y Soporte',
        href: '/dashboard/help',
        icon: HelpCircle
    }
]

// Navigation Component that uses searchParams (Must be wrapped in Suspense)
function SidebarNav({ setIsMobileOpen }: { setIsMobileOpen: (val: boolean) => void }) {
    const pathname = usePathname()
    const searchParams = useSearchParams()

    return (
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto custom-scrollbar">
            {menuItems.map((item) => {
                const Icon = item.icon
                // Logic to check if active considering query params
                const isActive = (() => {
                    const [itemPath, itemQuery] = item.href.split('?')

                    // 1. Path must match
                    if (pathname !== itemPath) return false

                    // 2. If item has query params, they must match current params
                    if (itemQuery) {
                        const params = new URLSearchParams(itemQuery)
                        for (const [key, value] of Array.from(params.entries())) {
                            if (searchParams?.get(key) !== value) return false
                        }
                        return true
                    }

                    // 3. If item has NO query params (e.g. /create), but current URL DOES (e.g. /create?mode=anonymous),
                    // we must ensure we don't accidentally highlight the generic one.
                    if (itemPath === '/dashboard/create' && searchParams?.get('mode') === 'anonymous') return false

                    return true
                })()

                return (
                    <Link
                        key={item.href}
                        id={`nav-item-${item.title.toLowerCase().replace(/\s+/g, '-')}`}
                        href={item.href}
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
    const pathname = usePathname() // Safe to use here without Suspense in Layout generally, but safer to keep high

    const SidebarContent = () => (
        <>
            <div className="p-6 border-b border-white/10 flex justify-between items-center bg-[#111]">
                <div>
                    <Link href="/dashboard" className="block hover:opacity-90 transition-opacity">
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
                    href="/dashboard/chat"
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
                    href="/dashboard/settings"
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
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => toggleMobileMenu(true)}
                        className="p-2 -ml-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                    >
                        <Menu className="w-6 h-6" />
                    </button>
                    <span className="font-bold text-lg text-white tracking-tight">
                        Happy<span className="bg-clip-text text-transparent bg-gradient-to-r from-violet-500 to-fuchsia-500 animate-text-gradient">Meter</span>
                    </span>
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

