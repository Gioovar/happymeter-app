import React from 'react';
import { AppLayout } from '../layouts/AppLayout';
import { MetricCard } from '../components/cards/MetricCard';
import { Button } from '../components/buttons/Button';
import { Users, Star, MessageSquare, TrendingUp, Plus, Filter, Download } from 'lucide-react';

export function DashboardScreen() {
    return (
        <AppLayout
            sidebarProps={{
                businessName: "Asombro Pizza",
                role: "Propietario",
                plan: "PREMIUM",
                activeItem: "#metrics"
            }}
            topbarProps={{
                userName: "Carlos Sánchez",
                userInitials: "CS"
            }}
        >
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                {/* Header Actions */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-white">Métricas Creador</h1>
                        <p className="text-gray-400 mt-1">Resumen del rendimiento de tu sucursal en los últimos 30 días.</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                        <Button variant="secondary" iconLeft={Filter}>
                            Filtrar
                        </Button>
                        <Button variant="outline" iconLeft={Download}>
                            Exportar
                        </Button>
                        <Button variant="primary" iconLeft={Plus}>
                            Nueva Campaña
                        </Button>
                    </div>
                </div>

                {/* Metrics Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <MetricCard 
                        title="Nuevos Clientes" 
                        value="1,248" 
                        icon={Users} 
                        trend="up" 
                        trendValue="+12.5%" 
                        subtext="vs mes anterior" 
                        gradient="from-blue-500/20 to-cyan-500/20"
                    />
                    <MetricCard 
                        title="Satisfacción (CSAT)" 
                        value="4.8/5" 
                        icon={Star} 
                        trend="up" 
                        trendValue="+0.2" 
                        gradient="from-amber-500/20 to-orange-500/20"
                    />
                    <MetricCard 
                        title="Feedback Recibido" 
                        value="342" 
                        icon={MessageSquare} 
                        trend="neutral" 
                        trendValue="Igual" 
                        gradient="from-violet-500/20 to-fuchsia-500/20"
                    />
                    <MetricCard 
                        title="Tasa de Crecimiento" 
                        value="24.8%" 
                        icon={TrendingUp} 
                        trend="up" 
                        trendValue="+4.1%" 
                        gradient="from-emerald-500/20 to-teal-500/20"
                    />
                </div>

                {/* Mock Chart / Content Area */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 p-6 rounded-2xl bg-[#111] border border-white/5">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-bold text-white">Evolución de Visitas</h3>
                            <Button variant="ghost" size="sm">Ver Detalles</Button>
                        </div>
                        {/* Mock Chart Area */}
                        <div className="w-full h-64 bg-[#1a1a1a] rounded-xl flex items-center justify-center border border-white/5 relative overflow-hidden">
                            <p className="text-gray-500 font-medium z-10">Gráfico Interactivo Placeholder</p>
                            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-violet-500 via-transparent to-transparent"></div>
                            {/* Decorative mock lines for visualization */}
                            <svg className="absolute inset-0 w-full h-full opacity-20" preserveAspectRatio="none">
                                <path d="M0,150 Q100,50 200,100 T400,80 T600,120 T800,90 T1000,40 V200 H0 Z" fill="url(#grad)" />
                                <defs>
                                    <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#8b5cf6" stopOpacity="1" />
                                        <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0" />
                                    </linearGradient>
                                </defs>
                            </svg>
                        </div>
                    </div>

                    <div className="p-6 rounded-2xl bg-[#111] border border-white/5 flex flex-col">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-bold text-white">Comentarios Recientes</h3>
                        </div>
                        <div className="space-y-4 flex-1">
                            {[1, 2, 3].map((_, i) => (
                                <div key={i} className="p-4 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors cursor-pointer">
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="flex text-amber-400">
                                            {[1, 2, 3, 4, 5].map((star) => (
                                                <Star key={star} className="w-3 h-3 fill-current" />
                                            ))}
                                        </div>
                                        <span className="text-xs text-gray-500">Hace 2 horas</span>
                                    </div>
                                    <p className="text-sm text-gray-300 line-clamp-2">"Excelente servicio, la pizza estuvo deliciosa y el ambiente inmejorable."</p>
                                </div>
                            ))}
                        </div>
                        <div className="mt-4 pt-4 border-t border-white/5">
                            <Button fullWidth variant="secondary">View All Reviews</Button>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    )
}
