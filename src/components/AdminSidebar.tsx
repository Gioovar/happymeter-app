
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Users, Ticket, FolderOpen, LogOut, Settings } from 'lucide-react'
import { cn } from '@/lib/utils'

const menuItems = [
    {
        title: 'Estadísticas',
        href: '/admin',
        icon: LayoutDashboard
    },
    {
        title: 'Usuarios',
        href: '/admin/users',
        icon: Users
    },
    {
        title: 'Cupones',
        href: '/admin/coupons',
        icon: Ticket
    },
    {
        title: 'Recursos de Marca',
        href: '/admin/assets',
        icon: FolderOpen
    }
]

export default function AdminSidebar() {
    const pathname = usePathname()

    return (
        <aside className="w-64 bg-[#111] border-r border-white/10 flex flex-col h-screen sticky top-0">
            <div className="p-6 border-b border-white/10">
                <h2 className="text-xl font-bold text-white tracking-tight">
                    Admin<span className="text-violet-500">Panel</span>
                </h2>
                <p className="text-xs text-gray-500 mt-1">Gestión de HappyMeter</p>
            </div>

            <nav className="flex-1 p-4 space-y-1">
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

            <div className="p-4 border-t border-white/10">
                <div className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/5 cursor-pointer transition text-gray-400 hover:text-white">
                    <Settings className="w-5 h-5" />
                    <span className="text-sm font-medium">Configuración</span>
                </div>
            </div>
        </aside>
    )
}
