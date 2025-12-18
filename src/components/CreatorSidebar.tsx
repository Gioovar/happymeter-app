
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutGrid, Sparkles, DollarSign, FolderOpen, LogOut, Settings, Users, Home, PieChart, Lock, Store, Trophy } from 'lucide-react'
import { cn } from '@/lib/utils'
import { SignOutButton } from '@clerk/nextjs'
import BrandLogo from '@/components/BrandLogo'

const menuItems = [
    {
        title: 'Dashboard',
        href: '/creators/dashboard',
        icon: LayoutGrid
    },
    {
        title: 'Mis Leads',
        href: '/creators/leads',
        icon: Users
    },
    {
        title: 'AI Coach',
        href: '/creators/chat',
        icon: Sparkles
    },
    {
        title: 'Locaciones',
        href: '/creators/places',
        icon: Store
    },
    {
        title: 'Comisiones',
        href: '/creators/commissions',
        icon: DollarSign
    },
    {
        title: 'Recursos de Marca',
        href: '/creators/assets',
        icon: FolderOpen
    },
    {
        title: 'Mi Perfil',
        href: '/creators/profile',
        icon: Settings
    },
    {
        title: 'Mis Logros',
        href: '/creators/achievements',
        icon: Trophy
    }
]

export default function CreatorSidebar() {
    const pathname = usePathname()

    return (
        <aside className="w-64 bg-[#111] border-r border-white/10 flex flex-col h-screen sticky top-0 hidden md:flex relative">

            <div className="p-6 border-b border-white/10">
                <div className="flex items-center gap-2">
                    <BrandLogo withText={false} size="sm" />
                    <div>
                        <h2 className="text-xl font-bold text-white tracking-tight">
                            Happy<span className="text-violet-500">Creators</span>
                        </h2>
                        <p className="text-xs text-gray-500 mt-1">Panel de Afiliados</p>
                    </div>
                </div>
            </div>

            <nav className="flex-1 p-4 space-y-1 opacity-100 disabled:opacity-50">
                {menuItems.map((item) => {
                    const Icon = item.icon
                    const isActive = pathname === item.href

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
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

            <div className="p-4 border-t border-white/10 space-y-2">
                <Link href="/" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/5 cursor-pointer transition text-gray-400 hover:text-white">
                    <Home className="w-5 h-5" />
                    <span className="text-sm font-medium">Ir al Inicio</span>
                </Link>

                <SignOutButton>
                    <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-red-500/10 text-gray-400 hover:text-red-400 cursor-pointer transition z-[60] relative">
                        <LogOut className="w-5 h-5" />
                        <span className="text-sm font-medium">Cerrar Sesión</span>
                    </button>
                </SignOutButton>
            </div>
        </aside>
    )
}
