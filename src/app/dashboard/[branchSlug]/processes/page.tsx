
import {
    GitMerge,
    Clock,
    AlertCircle,
    CheckCircle2,
    ArrowUpRight,
    ArrowDownRight,
    MapPin,
    Layers,
    BarChart3,
    Zap
} from 'lucide-react';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { getDashboardContext } from "@/lib/auth-context"
import { redirect } from "next/navigation"
import { getDashboardProcessStats } from '@/actions/processes';

import ProcessTemplateGallery from '@/components/processes/ProcessTemplateGallery';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"

export default async function BranchProcessesPage({ params }: { params: { branchSlug: string } }) {
    const context = await getDashboardContext(params.branchSlug);
    if (!context || !context.userId) return redirect('/dashboard');

    const userId = context.userId;
    const branchSlug = params.branchSlug;

    // Fetch Data
    const zonesPromise = prisma.processZone.findMany({
        where: { userId },
        include: {
            _count: {
                select: { tasks: true }
            }
        },
        orderBy: { createdAt: 'desc' }
    });

    const statsPromise = getDashboardProcessStats(userId);

    const [zones, stats] = await Promise.all([zonesPromise, statsPromise]);

    const newFlowLink = `/dashboard/${branchSlug}/processes/new`

    return (
        <div className="space-y-8 h-full">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
                        Procesos & Operaciones
                        <span className="text-xs bg-cyan-900/30 text-cyan-400 border border-cyan-500/20 px-3 py-1 rounded-full font-mono">
                            {context.name}
                        </span>
                    </h1>
                    <p className="text-gray-400 mt-2 max-w-2xl">
                        Panel de control operativo. Monitorea el cumplimiento de tareas en tiempo real.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="hidden md:flex flex-col items-end mr-4">
                        <span className="text-sm text-gray-400">Hoy</span>
                        <span className="text-xl font-bold text-white font-mono">{new Date().toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric' })}</span>
                    </div>
                    <Link href={newFlowLink} className="bg-white text-black px-6 py-3 rounded-xl font-bold shadow-lg shadow-white/10 hover:bg-gray-200 hover:scale-105 transition-all flex items-center gap-2">
                        <GitMerge className="w-5 h-5" />
                        Nuevo Flujo
                    </Link>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Compliance Card */}
                <div className="bg-[#111] border border-white/10 p-6 rounded-3xl relative overflow-hidden group hover:border-cyan-500/30 transition-all">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-3xl -mr-16 -mt-16 transition-opacity group-hover:opacity-100" />
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <p className="text-gray-400 text-xs font-bold uppercase tracking-wider">Cumplimiento Hoy</p>
                            <h3 className="text-4xl font-black text-white mt-2">{stats.complianceRate}%</h3>
                        </div>
                        <div className="w-10 h-10 rounded-xl bg-cyan-500/20 flex items-center justify-center">
                            <BarChart3 className="w-5 h-5 text-cyan-400" />
                        </div>
                    </div>
                    <Progress value={stats.complianceRate} className="h-1.5 bg-gray-800" indicatorClassName="bg-gradient-to-r from-cyan-500 to-blue-500" />
                </div>

                {/* Completed Tasks */}
                <div className="bg-[#111] border border-white/10 p-6 rounded-3xl relative overflow-hidden group hover:border-green-500/30 transition-all">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/10 rounded-full blur-3xl -mr-16 -mt-16 transition-opacity group-hover:opacity-100" />
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <p className="text-gray-400 text-xs font-bold uppercase tracking-wider">Completadas</p>
                            <h3 className="text-4xl font-black text-white mt-2">{stats.completed}</h3>
                        </div>
                        <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center">
                            <CheckCircle2 className="w-5 h-5 text-green-400" />
                        </div>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-green-400 bg-green-900/20 w-fit px-2 py-1 rounded-lg">
                        <ArrowUpRight className="w-3 h-3" />
                        <span>Excelente ritmo</span>
                    </div>
                </div>

                {/* Missed Tasks */}
                <div className="bg-[#111] border border-white/10 p-6 rounded-3xl relative overflow-hidden group hover:border-red-500/30 transition-all">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/10 rounded-full blur-3xl -mr-16 -mt-16 transition-opacity group-hover:opacity-100" />
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <p className="text-gray-400 text-xs font-bold uppercase tracking-wider">No Realizadas</p>
                            <h3 className="text-4xl font-black text-white mt-2">{stats.missed}</h3>
                        </div>
                        <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center">
                            <AlertCircle className="w-5 h-5 text-red-400" />
                        </div>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-red-400 bg-red-900/20 w-fit px-2 py-1 rounded-lg">
                        <ArrowDownRight className="w-3 h-3" />
                        <span>Requiere atención</span>
                    </div>
                </div>

                {/* Active Zones */}
                <div className="bg-[#111] border border-white/10 p-6 rounded-3xl relative overflow-hidden group hover:border-purple-500/30 transition-all">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl -mr-16 -mt-16 transition-opacity group-hover:opacity-100" />
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <p className="text-gray-400 text-xs font-bold uppercase tracking-wider">Zonas Activas</p>
                            <h3 className="text-4xl font-black text-white mt-2">{zones.length}</h3>
                        </div>
                        <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
                            <Layers className="w-5 h-5 text-purple-400" />
                        </div>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-purple-400 bg-purple-900/20 w-fit px-2 py-1 rounded-lg">
                        <Zap className="w-3 h-3" />
                        <span>Operación activa</span>
                    </div>
                </div>
            </div>

            <Tabs defaultValue="zones" className="w-full">
                <TabsList className="bg-black/50 border border-white/10 p-1 rounded-xl mb-6">
                    <TabsTrigger value="zones" className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-black data-[state=active]:font-bold transition-all px-6">Mis Zonas & Flujos</TabsTrigger>
                    <TabsTrigger value="templates" className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-black data-[state=active]:font-bold transition-all px-6">Galería de Plantillas</TabsTrigger>
                </TabsList>

                <TabsContent value="zones" className="mt-0 space-y-6">
                    {/* Zones List Grid */}
                    {zones.length === 0 ? (
                        <div className="text-center py-20 text-gray-500 bg-[#111] rounded-3xl border border-white/10 border-dashed">
                            <Layers className="w-16 h-16 mx-auto mb-4 opacity-20 text-white" />
                            <h3 className="text-xl font-bold text-white mb-2">No tienes zonas configuradas</h3>
                            <p className="text-sm max-w-md mx-auto">Comienza creando tu primera zona de operación o utiliza una plantilla predefinida para agilizar el proceso.</p>
                            <div className="mt-6">
                                <Link href={newFlowLink} className="text-cyan-400 hover:text-cyan-300 font-bold underline">
                                    Crear Zona Manualmente
                                </Link>
                            </div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {zones.map((zone) => (
                                <Link
                                    href={`/dashboard/${branchSlug}/processes/${zone.id}`}
                                    key={zone.id}
                                    className="block group relative"
                                >
                                    <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 to-blue-600/20 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                                    <div className="bg-[#111] border border-white/10 rounded-3xl p-6 h-full relative hover:-translate-y-1 transition-transform duration-300">
                                        <div className="flex justify-between items-start mb-6">
                                            <div className="p-3 bg-white/5 rounded-2xl group-hover:bg-cyan-500/20 group-hover:text-cyan-400 transition-colors">
                                                <MapPin className="w-6 h-6 text-gray-300 group-hover:text-cyan-400" />
                                            </div>
                                            <div className="bg-white/5 px-3 py-1 rounded-full border border-white/5">
                                                <span className="text-xs font-mono text-gray-300">{zone._count.tasks} Tareas</span>
                                            </div>
                                        </div>

                                        <h4 className="text-xl font-bold text-white mb-2 group-hover:text-cyan-400 transition-colors">{zone.name}</h4>
                                        <p className="text-sm text-gray-400 line-clamp-2 mb-6">{zone.description || "Zona operativa sin descripción detallada."}</p>

                                        <div className="flex items-center gap-2 text-xs font-bold text-cyan-400 group-hover:translate-x-1 transition-transform">
                                            Gestionar Zona <ArrowUpRight className="w-3 h-3" />
                                        </div>
                                    </div>
                                </Link>
                            ))}

                            {/* Create New Card (Inline) */}
                            <Link href={newFlowLink} className="block group relative border border-white/10 border-dashed rounded-3xl hover:border-white/30 transition-all bg-white/5 hover:bg-white/10 flex flex-col items-center justify-center p-6 text-center h-full min-h-[200px]">
                                <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                    <GitMerge className="w-6 h-6 text-white" />
                                </div>
                                <h4 className="text-lg font-bold text-white">Crear Nueva Zona</h4>
                                <p className="text-xs text-gray-400 mt-1">Configura un nuevo flujo operativo</p>
                            </Link>
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="templates" className="mt-0">
                    <ProcessTemplateGallery branchId={userId} />
                </TabsContent>
            </Tabs>
        </div>
    );
}
