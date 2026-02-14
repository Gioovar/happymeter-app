'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from 'sonner';
import { Loader2, Copy, CheckCircle2, ChevronRight, Clock, ListChecks, Eye } from 'lucide-react';
import { getProcessTemplates, instantiateTemplate } from '@/actions/processes';
import { useRouter } from 'next/navigation';

interface Template {
    id: string;
    name: string;
    description: string | null;
    category: string;
    tasks: { id: string, title: string, defaultLimitTime: string | null }[];
}

interface ProcessTemplateGalleryProps {
    branchId: string;
}

export default function ProcessTemplateGallery({ branchId }: ProcessTemplateGalleryProps) {
    const [templates, setTemplates] = useState<Template[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
    const [deploying, setDeploying] = useState(false);
    const [zoneName, setZoneName] = useState("");
    const [open, setOpen] = useState(false);
    const router = useRouter();

    useEffect(() => {
        loadTemplates();
    }, []);

    const loadTemplates = async () => {
        try {
            const res = await getProcessTemplates();
            setTemplates(res.templates);
        } catch (error) {
            toast.error("Error cargando plantillas");
        } finally {
            setLoading(false);
        }
    };

    const handleDeploy = async () => {
        if (!selectedTemplate) return;
        setDeploying(true);
        try {
            const finalZoneName = zoneName.trim() || selectedTemplate.name; // Fallback to template name
            await instantiateTemplate(selectedTemplate.id, branchId, finalZoneName);
            toast.success("¡Plantilla importada con éxito!");
            setOpen(false);
            router.refresh();
        } catch (error) {
            toast.error("Error al importar la plantilla");
            console.error(error);
        } finally {
            setDeploying(false);
        }
    };

    if (loading) {
        return <div className="flex justify-center p-8"><Loader2 className="animate-spin text-gray-500" /></div>;
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {templates.map(template => (
                <Card key={template.id} className="group relative overflow-hidden bg-[#0c0c0c] border-white/5 hover:border-violet-500/30 transition-all duration-300 hover:shadow-[0_0_30px_rgba(139,92,246,0.1)]">
                    {/* Decorative Elements */}
                    <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-violet-500/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="absolute -inset-0.5 bg-gradient-to-br from-violet-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

                    <CardHeader>
                        <div className="flex justify-between items-start mb-2">
                            <Badge variant="outline" className="bg-violet-500/10 text-violet-300 border-violet-500/20">
                                {template.category}
                            </Badge>
                            <span className="text-xs text-gray-500 flex items-center gap-1">
                                <ListChecks className="w-3 h-3" />
                                {template.tasks.length} Tareas
                            </span>
                        </div>
                        <CardTitle className="text-white text-lg font-bold group-hover:text-violet-200 transition-colors">
                            {template.name}
                        </CardTitle>
                        <CardDescription className="text-gray-400 line-clamp-2 text-xs">
                            {template.description || "Sin descripción"}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3 mb-6">
                            {template.tasks.slice(0, 3).map(task => (
                                <div key={task.id} className="flex items-center gap-2 text-sm text-gray-400">
                                    <div className="w-1 h-1 rounded-full bg-gray-600" />
                                    <span className="truncate flex-1">{task.title}</span>
                                    {task.defaultLimitTime && (
                                        <span className="text-xs text-gray-600 font-mono bg-white/5 px-1.5 py-0.5 rounded">
                                            {task.defaultLimitTime}
                                        </span>
                                    )}
                                </div>
                            ))}
                            + {template.tasks.length - 3} tareas más...
                        </p>
                            )}
                    </div>

                    <div className="flex gap-2">
                        <Dialog>
                            <DialogTrigger asChild>
                                <Button variant="outline" className="flex-1 border-white/10 hover:bg-white/5 hover:text-white text-gray-400">
                                    <Eye className="w-4 h-4 mr-2" />
                                    Ver
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="bg-[#0c0c0c] border-white/10 text-white max-w-2xl max-h-[80vh] overflow-y-auto">
                                <DialogHeader>
                                    <DialogTitle>{template.name}</DialogTitle>
                                    <DialogDescription className="text-gray-400">Listado completo de tareas</DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4 mt-4">
                                    {template.tasks.map((task, i) => (
                                        <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-white/5 border border-white/5">
                                            <div className="mt-1 min-w-6 h-6 rounded-full bg-violet-500/20 flex items-center justify-center text-violet-400 text-xs font-bold">
                                                {i + 1}
                                            </div>
                                            <div>
                                                <h4 className="font-medium text-white text-sm">{task.title}</h4>
                                                {task.description && <p className="text-gray-400 text-xs mt-1">{task.description}</p>}
                                            </div>
                                            {task.defaultLimitTime && (
                                                <Badge variant="secondary" className="bg-white/10 text-gray-300 ml-auto whitespace-nowrap">
                                                    <Clock className="w-3 h-3 mr-1" />
                                                    {task.defaultLimitTime}
                                                </Badge>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </DialogContent>
                        </Dialog>

                        <Dialog open={open && selectedTemplate?.id === template.id} onOpenChange={(val) => {
                            if (val) setSelectedTemplate(template);
                            setOpen(val);
                        }}>
                            <DialogTrigger asChild>
                                <Button className="flex-[2] bg-white text-black hover:bg-gray-200 font-bold tracking-wide" size="sm">
                                    <Copy className="w-4 h-4 mr-2" />
                                    Usar
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="bg-[#0c0c0c] border-white/10 text-white sm:max-w-md">
                                <DialogHeader>
                                    <div className="mx-auto w-12 h-12 rounded-full bg-violet-500/10 flex items-center justify-center mb-4 text-violet-400">
                                        <Copy className="w-6 h-6" />
                                    </div>
                                    <DialogTitle className="text-center text-xl">Importar "{template.name}"</DialogTitle>
                                    <DialogDescription className="text-center text-gray-400">
                                        Se crearán {template.tasks.length} tareas nuevas en esta sucursal.
                                    </DialogDescription>
                                </DialogHeader>

                                <div className="space-y-4 py-4">
                                    <div className="space-y-2">
                                        <Label className="text-gray-300">Nombre de la Zona / Lista</Label>
                                        <Input
                                            placeholder={template.name}
                                            className="bg-white/5 border-white/10 text-white focus:ring-violet-500/50"
                                            value={zoneName}
                                            onChange={(e) => setZoneName(e.target.value)}
                                        />
                                        <p className="text-xs text-gray-500">
                                            Ejemplo: "Aperturas Salón", "Checklist Diario", etc.
                                        </p>
                                    </div>
                                </div>

                                <DialogFooter>
                                    <Button variant="ghost" onClick={() => setOpen(false)} className="hover:bg-white/5 hover:text-white">
                                        Cancelar
                                    </Button>
                                    <Button
                                        onClick={handleDeploy}
                                        disabled={deploying}
                                        className="bg-violet-600 hover:bg-violet-700 text-white"
                                    >
                                        {deploying ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
                                        Confirmar Importación
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </div>
                </CardContent>
                </Card>
    ))
}
        </div >
    );
}
