
import {
    GitMerge,
    Clock,
    AlertCircle,
    CheckCircle2,
    ArrowUpRight,
    ArrowDownRight,
    MapPin,
    Layers
} from 'lucide-react';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { getDashboardContext } from "@/lib/auth-context"
import { redirect } from "next/navigation"

import ProcessTemplateGallery from '@/components/processes/ProcessTemplateGallery';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default async function BranchProcessesPage({ params }: { params: { branchSlug: string } }) {
    const context = await getDashboardContext(params.branchSlug);
    if (!context || !context.userId) return redirect('/dashboard');

    const userId = context.userId;
    const branchSlug = params.branchSlug;

    // Fetch Real Data using Context UserId (Branch)
    const zones = await prisma.processZone.findMany({
        where: { userId },
        include: {
            _count: {
                select: { tasks: true }
            }
        },
        orderBy: { createdAt: 'desc' }
    });

    const newFlowLink = `/dashboard/${branchSlug}/processes/new`

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-bold text-white tracking-tight">Procesos & Operaciones <span className="text-xs bg-white/10 px-2 py-1 rounded-full text-gray-300 align-middle">{context.name}</span></h1>
                    <p className="text-gray-400 mt-2">Gestión de flujos y tareas locales.</p>
                </div>
                <Link href={newFlowLink} className="bg-gradient-to-r from-cyan-600 to-blue-600 px-6 py-2.5 rounded-xl font-semibold text-sm shadow-lg shadow-cyan-900/20 hover:scale-105 transition-all text-white flex items-center gap-2">
                    <GitMerge className="w-4 h-4" />
                    Nuevo Flujo
                </Link>
            </div>

            {/* KPI Cards (Static for now) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-[#111] border border-white/5 p-6 rounded-2xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-3xl -mr-16 -mt-16 transition-opacity group-hover:opacity-100" />
                    <div className="flex justify-between items-start mb-4">
                        <div className="w-10 h-10 rounded-lg bg-cyan-500/20 flex items-center justify-center">
                            <Layers className="w-5 h-5 text-cyan-400" />
                        </div>
                    </div>
                    <p className="text-gray-400 text-sm font-medium">Zonas Activas</p>
                    <h3 className="text-3xl font-bold text-white mt-1">{zones.length}</h3>
                </div>
            </div>

            <Tabs defaultValue="zones" className="w-full">
                <TabsList className="bg-[#111] border border-white/10">
                    <TabsTrigger value="zones">Mis Zonas</TabsTrigger>
                    <TabsTrigger value="templates">Galería de Plantillas</TabsTrigger>
                </TabsList>

                <TabsContent value="zones" className="mt-6">
                    {/* Zones List */}
                    <div className="bg-[#111] border border-white/10 rounded-2xl p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-bold text-white">Mis Zonas y Flujos</h3>
                        </div>

                        {zones.length === 0 ? (
                            <div className="text-center py-12 text-gray-500">
                                <Layers className="w-12 h-12 mx-auto mb-4 opacity-50" />
                                <p>No tienes zonas configuradas.</p>
                                <p className="text-sm">Crea una nueva para empezar o usa una plantilla.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {zones.map((zone) => (
                                    <Link
                                        // Link to branch specific process page
                                        href={`/dashboard/${branchSlug}/processes/${zone.id}`}
                                        key={zone.id}
                                        className="block p-4 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors group cursor-pointer"
                                    >
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <h4 className="text-white font-bold flex items-center gap-2">
                                                    <MapPin className="w-4 h-4 text-cyan-400" />
                                                    {zone.name}
                                                </h4>
                                                <p className="text-xs text-gray-400 mt-1">{zone.description || "Sin descripción"}</p>
                                            </div>
                                            <div className="text-right">
                                                <span className="text-2xl font-bold text-white block">{zone._count.tasks}</span>
                                                <span className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">Tareas</span>
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </div>
                </TabsContent>

                <TabsContent value="templates" className="mt-6">
                    <div className="bg-[#111] border border-white/10 rounded-2xl p-6">
                        <div className="mb-6">
                            <h3 className="text-lg font-bold text-white">Galería de Plantillas (Machotes)</h3>
                            <p className="text-gray-400 text-sm">Importa procesos predefinidos para estandarizar tu operación.</p>
                        </div>
                        <ProcessTemplateGallery branchId={userId} />
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}
