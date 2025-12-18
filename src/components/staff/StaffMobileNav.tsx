'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Menu, X, UserCheck, MessageSquare, LogOut, ShieldCheck, Store, Calendar, Trophy } from 'lucide-react'
import { cn } from '@/lib/utils'
import { SignOutButton } from '@clerk/nextjs'
import BrandLogo from '@/components/BrandLogo'

const menuItems = [
    {
        title: 'Dashboard',
        href: '/staff',
        icon: LayoutDashboard
    },
    {
        title: 'Gestión Creadores',
        href: '/staff/creators',
        icon: UserCheck
    },
    {
        title: 'Logros y Niveles',
        href: '/staff/achievements',
        icon: Trophy
    },
    {
        title: 'Soporte Chat',
        href: '/staff/chat',
        icon: MessageSquare
    },
    {
        title: 'Lugares & Acuerdos',
        href: '/staff/places',
        icon: Store
    },
    {
        title: 'Solicitudes de Visita',
        href: '/staff/visits',
        icon: Calendar
    }
]

export default function StaffMobileNav() {
    const [open, setOpen] = useState(false)
    const pathname = usePathname()

    return (
        <div className="md:hidden">
            {/* Hamburger Trigger */}
            <button
                onClick={() => setOpen(true)}
                className="p-2 text-white hover:bg-white/10 rounded-lg transition"
            >
                <Menu className="w-6 h-6" />
            </button>

            {/* Overlay */}
            {open && (
                <div
                    className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 animate-in fade-in duration-200"
                    onClick={() => setOpen(false)}
                />
            )}

            {/* Drawer */}
            <div className={cn(
                "fixed inset-y-0 left-0 w-[280px] bg-[#0a0a0a] border-r border-white/10 z-[60] transform transition-transform duration-300 ease-in-out flex flex-col",
                open ? "translate-x-0" : "-translate-x-full"
            )}>
                <div className="p-6 border-b border-white/10 flex justify-between items-center">
                    <div>
                        <Link href="/staff" onClick={() => setOpen(false)}>
                            <BrandLogo className="mb-1" />
                        </Link>
                        <div className="flex items-center gap-2 mt-2 px-2 py-1 bg-blue-500/10 border border-blue-500/20 rounded-md w-fit">
                            <ShieldCheck className="w-3 h-3 text-blue-500" />
                            <p className="text-[10px] font-bold text-blue-400 uppercase tracking-wider">Staff</p>
                        </div>
                    </div>
                    <button
                        onClick={() => setOpen(false)}
                        className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-full transition"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                    {menuItems.map((item) => {
                        const Icon = item.icon
                        const isActive = pathname === item.href || pathname.startsWith(item.href + '/')

                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                onClick={() => setOpen(false)}
                                className={cn(
                                    "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200",
                                    isActive
                                        ? "bg-blue-600/10 text-blue-500 border border-blue-500/20"
                                        : "text-gray-400 hover:text-white hover:bg-white/5"
                                )}
                            >
                                <Icon className="w-5 h-5" />
                                {item.title}
                            </Link>
                        )
                    })}
                </nav>

                <div className="p-4 border-t border-white/10 space-y-2 pb-8">
                    <Link
                        href="/dashboard"
                        className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/5 cursor-pointer transition text-gray-400 hover:text-white"
                    >
                        <LayoutDashboard className="w-5 h-5" />
                        <span className="text-sm font-medium">Volver a App</span>
                    </Link>
                    <SignOutButton>
                        <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-red-500/10 text-gray-400 hover:text-red-400 cursor-pointer transition">
                            <LogOut className="w-5 h-5" />
                            <span className="text-sm font-medium">Cerrar Sesión</span>
                        </button>
                    </SignOutButton>
                </div>
            </div>
        </div>
    )
}
