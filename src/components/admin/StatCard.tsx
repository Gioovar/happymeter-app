import { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StatCardProps {
    label: string
    value: string | number
    subValue?: string
    status?: string // e.g. "Active"
    trend?: 'up' | 'down' | 'neutral'
    icon: LucideIcon
    color: string // Tailwind classes for gradient e.g. "from-blue-500 to-cyan-500"
}

export default function StatCard({
    label,
    value,
    subValue,
    icon: Icon,
    color,
}: StatCardProps) {
    return (
        <div className="group relative">
            {/* Gradient Border Effect */}
            <div className={cn(
                "absolute -inset-[1px] rounded-[26px] bg-gradient-to-b opacity-20 group-hover:opacity-100 transition duration-500 blur-sm group-hover:blur-md",
                color
            )} />

            <div className="relative h-full bg-[#0A0A0A] border border-white/5 rounded-3xl p-6 overflow-hidden flex flex-col justify-between group-hover:transform group-hover:-translate-y-1 transition-all duration-300">

                {/* Background Glow */}
                <div className={cn(
                    "absolute -right-6 -top-6 w-32 h-32 rounded-full opacity-10 blur-[60px] group-hover:opacity-20 transition-opacity duration-500 bg-gradient-to-br",
                    color
                )} />

                <div className="relative z-10">
                    <div className="flex justify-between items-start mb-6">
                        {/* Icon Box */}
                        <div className={cn(
                            "w-12 h-12 rounded-2xl flex items-center justify-center border border-white/5 shadow-inner",
                            "bg-gradient-to-br from-white/5 to-transparent"
                        )}>
                            <Icon className={cn("w-6 h-6", "text-white opacity-80 group-hover:opacity-100 transition-opacity")} />
                        </div>

                        {/* Little Sparkle or indicator */}
                        <div className={cn("w-1.5 h-1.5 rounded-full shadow-[0_0_8px_currentColor] animate-pulse", color.split(' ')[1].replace('to-', 'text-'))} />
                    </div>

                    <div className="space-y-1">
                        <h3 className="text-3xl font-bold text-white tracking-tight group-hover:scale-105 origin-left transition-transform duration-300">
                            {value}
                        </h3>
                        <p className="text-sm font-medium text-gray-400 group-hover:text-gray-300 transition-colors">
                            {label}
                        </p>
                    </div>
                </div>

                {/* Subvalue Footer */}
                {subValue && (
                    <div className="relative z-10 mt-4 pt-4 border-t border-white/5">
                        <p className={cn(
                            "text-xs font-mono tracking-wide",
                            "text-gray-500 group-hover:text-gray-400"
                        )}>
                            {subValue}
                        </p>
                    </div>
                )}
            </div>
        </div>
    )
}
