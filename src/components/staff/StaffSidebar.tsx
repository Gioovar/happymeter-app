'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Users, MessageSquare, LogOut, ShieldCheck, UserCheck, Store, Calendar, Trophy } from 'lucide-react'
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

export default function StaffSidebar() {
    const pathname = usePathname()

    return (
        <aside className="w-64 bg-[#0a0a0a] border-r border-white/10 flex flex-col h-screen sticky top-0 hidden md:flex">
            <div className="p-6 border-b border-white/10">
                <Link href="/staff" className="block hover:opacity-90 transition-opacity">
                    <BrandLogo className="mb-1" />
                </Link>
                <div className="flex items-center gap-2 mt-2 px-2 py-1 bg-blue-500/10 border border-blue-500/20 rounded-md w-fit">
                    <ShieldCheck className="w-3 h-3 text-blue-500" />
                    <p className="text-[10px] font-bold text-blue-400 uppercase tracking-wider">Staff</p>
                </div>
            </div>

            <nav className="flex-1 p-4 space-y-1">
                {menuItems.map((item) => {
                    const Icon = item.icon
                    const isActive = pathname === item.href || pathname.startsWith(item.href + '/')

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200",
                                isActive
                                    ? "bg-blue-600/10 text-blue-500 border border-blue-500/20 shadow-[0_0_15px_rgba(59,130,246,0.1)]"
                                    : "text-gray-400 hover:text-white hover:bg-white/5"
                            )}
                        >
                            <Icon className="w-5 h-5" />
                            {item.title}
                        </Link>
                    )
                })}
            </nav>

            <div className="p-4 border-t border-white/10 space-y-2">
                <Link
                    href="/admin"
                    className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-orange-500/10 cursor-pointer transition text-gray-400 hover:text-orange-400"
                >
                    <ShieldCheck className="w-5 h-5" />
                    <span className="text-sm font-medium">Centro de Mando</span>
                </Link>
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
        </aside>
    )
}
