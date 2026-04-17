import React from 'react';
import { cn } from '../../lib/utils';
import { TrendingUp, TrendingDown, LucideIcon } from 'lucide-react';

export interface MetricCardProps {
    title: string;
    value: string | number;
    icon: LucideIcon;
    trend?: 'up' | 'down' | 'neutral';
    trendValue?: string;
    subtext?: string;
    gradient?: string;
    onClick?: () => void;
}

export function MetricCard({
    title,
    value,
    icon: Icon,
    trend,
    trendValue,
    subtext,
    gradient = "from-violet-500/20 to-fuchsia-500/20",
    onClick
}: MetricCardProps) {
    
    const isInteractive = !!onClick;
    
    return (
        <div 
            onClick={onClick}
            className={cn(
                "relative p-6 rounded-2xl bg-[#111] border border-white/5 overflow-hidden transition-all duration-300",
                isInteractive ? "cursor-pointer hover:border-white/20 hover:shadow-xl hover:-translate-y-1" : ""
            )}
        >
            {/* Background Gradient Accent */}
            <div className={cn(
                "absolute -top-10 -right-10 w-32 h-32 blur-3xl opacity-30 bg-gradient-to-br rounded-full pointer-events-none",
                gradient
            )} />

            <div className="relative z-10 flex flex-col h-full justify-between">
                <div className="flex justify-between items-start mb-4">
                    <p className="text-sm font-medium text-gray-400">{title}</p>
                    <div className="p-2 rounded-xl bg-white/5 text-gray-300">
                        <Icon className="w-5 h-5" />
                    </div>
                </div>

                <div>
                    <h3 className="text-3xl font-bold text-white mb-1 tracking-tight">{value}</h3>
                    
                    <div className="flex items-center gap-2">
                        {trend && trendValue && (
                            <div className={cn(
                                "flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full border",
                                trend === 'up' ? "text-emerald-400 bg-emerald-400/10 border-emerald-400/20" : 
                                trend === 'down' ? "text-red-400 bg-red-400/10 border-red-400/20" :
                                "text-gray-400 bg-gray-400/10 border-gray-400/20"
                            )}>
                                {trend === 'up' && <TrendingUp className="w-3 h-3" />}
                                {trend === 'down' && <TrendingDown className="w-3 h-3" />}
                                <span>{trendValue}</span>
                            </div>
                        )}
                        
                        {subtext && (
                            <span className="text-xs text-gray-500">{subtext}</span>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
