'use client';

import { usePathname, useParams } from 'next/navigation';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import {
    BarChart3,
    Gift,
    Settings2,
    Calendar,
    LayoutDashboard,
    Lock
} from 'lucide-react';
import { useMemo } from 'react';
import { NavigationMode, MODES } from '@/config/navigation';
import { useDashboard } from '@/context/DashboardContext';

export default function ModeSelector() {
    const pathname = usePathname();
    const params = useParams();
    const branchSlug = params?.branchSlug as string;

    // Hide on Chain Dashboard (Exclusive Selection View)
    if (pathname === '/dashboard/chains') return null;

    // Determine active mode based on path
    const activeMode: NavigationMode = useMemo(() => {
        if (pathname?.includes('/loyalty') || pathname?.includes('/games') || pathname?.includes('/achievements')) return 'loyalty';
        if (pathname?.includes('/processes') || pathname?.includes('/supervision')) return 'processes';
        if (pathname?.includes('/reservations')) return 'reservations';
        return 'surveys'; // Default mode
    }, [pathname]);

    const { checkModuleAccess } = useDashboard();

    return (
        <div className="flex items-center gap-2 bg-[#111] p-1.5 rounded-full border border-white/10 shadow-lg overflow-x-auto max-w-full no-scrollbar">
            {MODES.map((mode) => {
                const isActive = activeMode === mode.id;
                const Icon = mode.icon;
                const isLocked = !checkModuleAccess(mode.id);

                let finalHref = mode.href;
                if (branchSlug) {
                    if (finalHref === '/dashboard') {
                        finalHref = `/dashboard/${branchSlug}`;
                    } else if (finalHref.startsWith('/dashboard/')) {
                        finalHref = finalHref.replace('/dashboard', `/dashboard/${branchSlug}`);
                    }
                }

                return (
                    <Link
                        key={mode.id}
                        href={finalHref as any}
                        className={cn(
                            "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 relative overflow-hidden group whitespace-nowrap",
                            isActive
                                ? "text-white shadow-md"
                                : "text-gray-400 hover:text-white hover:bg-white/5",
                            isLocked && "opacity-70 hover:opacity-100"
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
                            {isLocked && <Lock className="w-3 h-3 text-gray-500 ml-1" />}
                        </div>
                    </Link>
                );
            })}
        </div>
    );
}
