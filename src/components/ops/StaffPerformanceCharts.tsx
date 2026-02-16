'use client';

import { Activity, Zap, CheckCircle2, TrendingUp } from 'lucide-react';
import { RadialBarChart, RadialBar, PolarAngleAxis, ResponsiveContainer } from 'recharts';

interface StaffPerformanceChartsProps {
    metrics: {
        compliance: {
            completed: number;
            total: number;
            percentage: number;
        };
        performance: {
            score: number;
            trend: any[];
        };
    };
}

export default function StaffPerformanceCharts({ metrics }: StaffPerformanceChartsProps) {
    const complianceData = [
        {
            name: 'Compliance',
            value: metrics.compliance.percentage,
            fill: metrics.compliance.percentage >= 80 ? '#10b981' : metrics.compliance.percentage >= 50 ? '#f59e0b' : '#ef4444',
        }
    ];

    const performanceData = [
        {
            name: 'Performance',
            value: metrics.performance.score,
            fill: metrics.performance.score >= 90 ? '#8b5cf6' : metrics.performance.score >= 70 ? '#3b82f6' : '#6366f1',
        }
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-2">
            {/* Compliance Chart */}
            <div className="bg-[#16161e] border border-white/5 rounded-3xl p-6 flex items-center justify-between relative overflow-hidden group hover:border-emerald-500/20 transition-colors">
                <div className="relative z-10">
                    <div className="flex items-center gap-2 text-emerald-400 mb-1">
                        <Activity className="w-5 h-5" />
                        <span className="text-sm font-bold uppercase tracking-wider">Cumplimiento</span>
                    </div>
                    <div className="mt-2">
                        <span className="text-4xl font-bold text-white">{metrics.compliance.percentage}%</span>
                        <p className="text-xs text-gray-500 mt-1">
                            {metrics.compliance.completed} de {metrics.compliance.total} tareas hoy
                        </p>
                    </div>
                </div>

                <div className="w-24 h-24 relative">
                    <ResponsiveContainer width="100%" height="100%">
                        <RadialBarChart
                            innerRadius="80%"
                            outerRadius="100%"
                            data={complianceData}
                            startAngle={90}
                            endAngle={-270}
                        >
                            <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
                            <RadialBar
                                background
                                dataKey="value"
                                cornerRadius={10}
                            />
                        </RadialBarChart>
                    </ResponsiveContainer>
                    {/* Center Icon */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <CheckCircle2 className="w-6 h-6 text-emerald-500/50" />
                    </div>
                </div>

                {/* Decorative BG */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-3xl -mr-10 -mt-10" />
            </div>

            {/* Performance Chart (AI Score) */}
            <div className="bg-[#16161e] border border-white/5 rounded-3xl p-6 flex items-center justify-between relative overflow-hidden group hover:border-violet-500/20 transition-colors">
                <div className="relative z-10">
                    <div className="flex items-center gap-2 text-violet-400 mb-1">
                        <Zap className="w-5 h-5" />
                        <span className="text-sm font-bold uppercase tracking-wider">Desempeño IA</span>
                    </div>
                    <div className="mt-2">
                        <span className="text-4xl font-bold text-white">{metrics.performance.score}</span>
                        <div className="flex items-center gap-1 mt-1">
                            <span className="text-[10px] bg-violet-500/20 text-violet-300 px-1.5 py-0.5 rounded border border-violet-500/30">
                                AI ANALYSIS
                            </span>
                        </div>
                    </div>
                </div>

                <div className="w-24 h-24 relative">
                    <ResponsiveContainer width="100%" height="100%">
                        <RadialBarChart
                            innerRadius="80%"
                            outerRadius="100%"
                            data={performanceData}
                            startAngle={180}
                            endAngle={0}
                        >
                            <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
                            <RadialBar
                                background
                                dataKey="value"
                                cornerRadius={10}
                            />
                        </RadialBarChart>
                    </ResponsiveContainer>
                    {/* Center Icon */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none mt-2">
                        <TrendingUp className="w-6 h-6 text-violet-500/50" />
                    </div>
                </div>

                {/* Decorative BG */}
                <div className="absolute bottom-0 right-0 w-32 h-32 bg-violet-500/5 rounded-full blur-3xl -mr-6 -mb-6" />
            </div>
        </div>
    );
}
