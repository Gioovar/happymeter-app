'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import {
    BarChart3,
    Gift,
    Settings2,
    Calendar,
    LayoutDashboard
} from 'lucide-react';
import { useMemo } from 'react';
import { NavigationMode } from '@/config/navigation';

export default function ModeSelector() {
    const pathname = usePathname();

    // Determine active mode based on path
    const activeMode: NavigationMode = useMemo(() => {
        if (pathname?.includes('/dashboard/loyalty') || pathname?.includes('/dashboard/games') || pathname?.includes('/dashboard/achievements')) return 'loyalty';
        if (pathname?.includes('/dashboard/processes')) return 'processes';
        if (pathname?.includes('/dashboard/reservations')) return 'reservations';
        return 'surveys'; // Default mode
    }, [pathname]);

    const modes = [
        {
            id: 'surveys',
            label: 'Encuestas',
            href: '/dashboard',
            icon: BarChart3,
            color: 'from-violet-600 to-indigo-600'
        },
        {
            id: 'loyalty',
            label: 'Lealtad',
            href: '/dashboard/loyalty',
            icon: Gift,
            color: 'from-fuchsia-600 to-pink-600'
        },
        {
            id: 'processes',
            label: 'Procesos',
            href: '/dashboard/processes',
            icon: Settings2,
            color: 'from-cyan-600 to-blue-600'
        },
        {
            id: 'reservations',
            label: 'Reservas',
            href: '/dashboard/reservations',
            icon: Calendar,
            color: 'from-amber-500 to-orange-600'
        }
    ];

    return (
        <div className="flex items-center gap-2 bg-[#111] p-1.5 rounded-full border border-white/10 shadow-lg overflow-x-auto max-w-full no-scrollbar">
            {modes.map((mode) => {
                const isActive = activeMode === mode.id;
                const Icon = mode.icon;

                return (
                    <Link
                        key={mode.id}
                        href={mode.href}
                        className={cn(
                            "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 relative overflow-hidden group whitespace-nowrap",
                            isActive
                                ? "text-white shadow-md"
                                : "text-gray-400 hover:text-white hover:bg-white/5"
                        )}
                    >
                        {isActive && (
                            <div className={cn(
                                "absolute inset-0 bg-gradient-to-r opacity-100 transition-opacity",
                                mode.color
                            )} />
                        )}

                        <div className="relative z-10 flex items-center gap-2">
                            <Icon className={cn(
                                "w-4 h-4 transition-transform duration-300",
                                isActive ? "scale-110" : "group-hover:scale-110"
                            )} />
                            <span>{mode.label}</span>
                        </div>
                    </Link>
                );
            })}
        </div>
    );
}
