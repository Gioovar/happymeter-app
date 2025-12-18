'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Users, CreditCard, BarChart2, ShieldAlert, Settings, LogOut, Lock, Globe, Briefcase, Award, Menu, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { SignOutButton } from '@clerk/nextjs'
import BrandLogo from '@/components/BrandLogo'

const menuItems = [
    {
        title: 'Overview Global',
        href: '/admin',
        icon: LayoutDashboard
    },
    {
        title: 'Tenants & Negocios',
        href: '/admin/tenants',
        icon: Briefcase
    },
    {
        title: 'Usuarios',
        href: '/admin/users',
        icon: Users
    },
    {
        title: 'Planes y Pagos',
        href: '/admin/plans',
        icon: CreditCard
    },
    {
        title: 'Global Analytics',
        href: '/admin/analytics',
        icon: BarChart2
    },
    {
        title: 'Creators & Afiliados',
        href: '/admin/creators',
        icon: Award
    },
    {
        title: 'Auditoría & Logs',
        href: '/admin/audit',
        icon: ShieldAlert
    },
    {
        title: 'Configuración',
        href: '/admin/settings',
        icon: Settings
    },
    {
        title: 'Panel Operativo',
        href: '/staff',
        icon: Globe
    },
]

export default function AdminSidebar() {
    const pathname = usePathname()
    const [isMobileOpen, setIsMobileOpen] = useState(false)

    const SidebarContent = () => (
        <>
            <div className="p-6 border-b border-white/10 flex justify-between items-center bg-black">
                <div>
                    <Link href="/admin" className="block hover:opacity-90 transition-opacity">
                        <BrandLogo className="mb-1" />
                    </Link>
                    <div className="flex items-center gap-2 mt-2 px-2 py-1 bg-red-500/10 border border-red-500/20 rounded-md w-fit">
                        <Lock className="w-3 h-3 text-red-500" />
                        <p className="text-[10px] font-bold text-red-400 uppercase tracking-wider">Super Admin</p>
                    </div>
                </div>

                {/* Close button for mobile only */}
                <button
                    onClick={() => setIsMobileOpen(false)}
                    className="md:hidden p-2 text-gray-400 hover:text-white"
                >
                    <X className="w-6 h-6" />
                </button>
            </div>

            <nav className="flex-1 p-4 space-y-1 overflow-y-auto custom-scrollbar">
                {menuItems.map((item) => {
                    const Icon = item.icon
                    const isActive = pathname === item.href

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            onClick={() => setIsMobileOpen(false)}
                            className={cn(
                                "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200",
                                isActive
                                    ? "bg-red-900/20 text-red-500 border border-red-500/30"
                                    : "text-gray-400 hover:text-white hover:bg-white/5"
                            )}
                        >
                            <Icon className="w-5 h-5" />
                            {item.title}
                        </Link>
                    )
                })}
            </nav>

            <div className="p-4 border-t border-white/10 space-y-2 bg-black">
                <Link
                    href="/dashboard"
                    onClick={() => setIsMobileOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/5 cursor-pointer transition text-gray-400 hover:text-white"
                >
                    <Globe className="w-5 h-5" />
                    <span className="text-sm font-medium">Volver a App</span>
                </Link>
                <SignOutButton>
                    <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-red-500/10 text-gray-400 hover:text-red-400 cursor-pointer transition">
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
                        onClick={() => setIsMobileOpen(true)}
                        className="p-2 -ml-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                    >
                        <Menu className="w-6 h-6" />
                    </button>
                    <span className="font-bold text-lg text-white tracking-tight">
                        Happy<span className="text-red-500">Meter</span>
                    </span>
                </div>
            </div>

            {/* Mobile Drawer */}
            {isMobileOpen && (
                <div className="fixed inset-0 z-50 md:hidden">
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                        onClick={() => setIsMobileOpen(false)}
                    />
                    {/* Sidebar container */}
                    <aside className="absolute inset-y-0 left-0 w-64 bg-black border-r border-white/10 flex flex-col h-full shadow-2xl animate-in slide-in-from-left duration-200">
                        <SidebarContent />
                    </aside>
                </div>
            )}

            {/* Desktop Sidebar */}
            <aside className="w-64 bg-black border-r border-white/10 flex-col h-screen sticky top-0 hidden md:flex z-50">
                <SidebarContent />
            </aside>
        </>
    )
}
