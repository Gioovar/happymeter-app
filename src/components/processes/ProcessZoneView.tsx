
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Clock, CheckCircle2, Camera, AlertTriangle, Upload, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { toast } from 'sonner'
import { submitTaskEvidence } from '@/actions/processes'
import Image from 'next/image'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import ProcessHistoryView from './ProcessHistoryView'

interface Task {
    id: string
    title: string
    description: string | null
    limitTime: string | null
    evidenceType: string
    evidences: any[]
}

interface ProcessZoneViewProps {
    zone: {
        id: string
        name: string
        description: string | null
        tasks: Task[]
    }
    branchSlug: string
    branchName?: string
}

export default function ProcessZoneView({ zone, branchSlug, branchName }: ProcessZoneViewProps) {
    const router = useRouter()
    const [selectedTask, setSelectedTask] = useState<Task | null>(null)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [previewUrl, setPreviewUrl] = useState<string | null>(null)
    const [fileToUpload, setFileToUpload] = useState<File | null>(null)

    // Helper to determine status
    const getTaskStatus = (task: Task) => {
        const evidence = task.evidences?.[0]
        if (evidence) {
            return { label: 'Completado', color: 'text-green-400 bg-green-400/10', icon: CheckCircle2 }
        }

        // Check if late
        if (task.limitTime) {
            const now = new Date()
            const [hours, minutes] = task.limitTime.split(':').map(Number)
            const limit = new Date()
            limit.setHours(hours, minutes, 0, 0)

            if (now > limit) {
                return { label: 'Atrasado', color: 'text-red-400 bg-red-400/10', icon: AlertTriangle }
            }
        }

        return { label: 'Pendiente', color: 'text-gray-400 bg-gray-400/10', icon: Clock }
    }

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            // Validate image/video based on task requirement
            if (selectedTask?.evidenceType === 'PHOTO' && !file.type.startsWith('image/')) {
                toast.error('Debes subir una imagen')
                return
            }
            if (selectedTask?.evidenceType === 'VIDEO' && !file.type.startsWith('video/')) {
                toast.error('Debes subir un video')
                return
            }

            setFileToUpload(file)
            setPreviewUrl(URL.createObjectURL(file))
        }
    }

    const handleSubmit = async () => {
        if (!selectedTask || !fileToUpload) return

        setIsSubmitting(true)
        try {
            // Upload logic would go here.
            // For now we will create a fake URL or use a base64 string if the server action supports it,
            // but usually we upload to Blob/S3 first.
            // Since I don't have the full Blob upload setup here, I'll assume we pass the fileUrl.
            // Wait, the action `submitTaskEvidence` expects `fileUrl`.
            // I need to implement upload. For this specific step, I will simulate an upload or simpler,
            // check if there is an upload action available.
            // Looking at `src/actions/processes.ts`, it just takes a URL.
            // I will implement a basic client-side upload or placeholder for now.

            // FIXME: Real upload implementation needed using @vercel/blob or similar.
            // For prototype:
            const fakeUrl = `https://fake-evidence.com/${Date.now()}.jpg`

            await submitTaskEvidence({
                taskId: selectedTask.id,
                fileUrl: fakeUrl, // Placeholder
                capturedAt: new Date()
            })

            toast.success('Evidencia guardada')
            setSelectedTask(null)
            setFileToUpload(null)
            setPreviewUrl(null)
            router.refresh()
        } catch (error) {
            toast.error('Error al guardar evidencia')
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4 mb-2">
                <Button variant="ghost" size="icon" onClick={() => router.back()} className="text-gray-400 hover:text-white">
                    <ArrowLeft className="w-5 h-5" />
                </Button>
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                        {zone.name}
                        {branchName && <span className="text-gray-500 font-normal text-lg">| {branchName}</span>}
                    </h1>
                    <p className="text-gray-400 text-sm">{zone.description || 'Lista de tareas operativas'}</p>
                </div>
            </div>

            <Tabs defaultValue="today" className="w-full">
                <TabsList className="grid w-full grid-cols-2 bg-[#111] border border-white/10 mb-6">
                    <TabsTrigger value="today" className="data-[state=active]:bg-cyan-600 data-[state=active]:text-white">Tareas de Hoy</TabsTrigger>
                    <TabsTrigger value="history" className="data-[state=active]:bg-cyan-600 data-[state=active]:text-white">Historial</TabsTrigger>
                </TabsList>

                <TabsContent value="today" className="mt-0">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {zone.tasks.map(task => {
                            const status = getTaskStatus(task)
                            const StatusIcon = status.icon

                            return (
                                <div
                                    key={task.id}
                                    className={`group relative bg-[#111] border border-white/10 rounded-3xl p-1 hover:border-cyan-500/30 transition-all cursor-pointer overflow-hidden ${task.evidences?.[0] ? 'opacity-75' : ''}`}
                                    onClick={() => !task.evidences?.[0] && setSelectedTask(task)}
                                >
                                    <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                                    <div className="relative bg-[#111] rounded-[1.3rem] p-5 h-full flex flex-col justify-between gap-4 border border-white/5">
                                        <div className="flex justify-between items-start">
                                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${status.color}`}>
                                                <StatusIcon className="w-6 h-6" />
                                            </div>
                                            <Badge variant="outline" className={`${status.color} border-0`}>
                                                {status.label}
                                            </Badge>
                                        </div>

                                        <div>
                                            <h3 className="font-bold text-lg text-white leading-tight mb-2 group-hover:text-cyan-400 transition-colors line-clamp-2">
                                                {task.title}
                                            </h3>
                                            <p className="text-sm text-gray-500 line-clamp-2 mb-3">
                                                {task.description || "Sin descripción adicional."}
                                            </p>

                                            <div className="flex items-center gap-3 text-xs text-gray-400 bg-white/5 p-2 rounded-lg w-fit">
                                                {task.limitTime && (
                                                    <span className="flex items-center gap-1.5 border-r border-white/10 pr-3 mr-1">
                                                        <Clock className="w-3.5 h-3.5 text-orange-400" />
                                                        <span className="font-mono">{task.limitTime}</span>
                                                    </span>
                                                )}
                                                <span className="flex items-center gap-1.5">
                                                    {task.evidenceType === 'PHOTO' ? <Camera className="w-3.5 h-3.5 text-purple-400" /> : <div className="i-lucide-video w-3.5 h-3.5 text-blue-400" />}
                                                    {task.evidenceType === 'PHOTO' ? 'Foto' : 'Video'}
                                                </span>
                                            </div>
                                        </div>

                                        {!task.evidences?.[0] && (
                                            <div className="pt-4 mt-auto border-t border-white/5 flex justify-end">
                                                <span className="text-xs font-bold text-cyan-400 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                                                    Completar Tarea <ArrowLeft className="w-3 h-3 rotate-180" />
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </TabsContent>

                <TabsContent value="history" className="mt-0">
                    <ProcessHistoryView zoneId={zone.id} />
                </TabsContent>
            </Tabs>

            <Dialog open={!!selectedTask} onOpenChange={(open) => !open && setSelectedTask(null)}>
                <DialogContent className="bg-[#111] border-white/10 text-white sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>{selectedTask?.title}</DialogTitle>
                    </DialogHeader>

                    <div className="space-y-6 py-4">
                        <div className="bg-white/5 rounded-xl p-4 text-sm text-gray-300">
                            <p>{selectedTask?.description || "Captura la evidencia solicitada para completar esta tarea."}</p>
                        </div>

                        <div className="border-2 border-dashed border-white/20 rounded-xl p-8 flex flex-col items-center justify-center gap-4 hover:bg-white/5 transition-colors cursor-pointer relative overflow-hidden">
                            <input
                                type="file"
                                accept={selectedTask?.evidenceType === 'VIDEO' ? "video/*" : "image/*"}
                                capture="environment"
                                className="absolute inset-0 opacity-0 cursor-pointer"
                                onChange={handleFileSelect}
                            />

                            {previewUrl ? (
                                selectedTask?.evidenceType === 'VIDEO' ? (
                                    <video src={previewUrl} className="w-full h-48 object-cover rounded-lg" controls />
                                ) : (
                                    <Image src={previewUrl} alt="Preview" width={400} height={300} className="w-full h-48 object-cover rounded-lg" />
                                )
                            ) : (
                                <>
                                    <div className="w-12 h-12 rounded-full bg-cyan-500/20 flex items-center justify-center">
                                        <Camera className="w-6 h-6 text-cyan-400" />
                                    </div>
                                    <div className="text-center">
                                        <p className="font-medium text-white">Tocar para capturar</p>
                                        <p className="text-xs text-gray-500 mt-1">
                                            {selectedTask?.evidenceType === 'VIDEO' ? 'Grabar Video' : 'Tomar Foto'}
                                        </p>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    <Button
                        onClick={handleSubmit}
                        disabled={!fileToUpload || isSubmitting}
                        className="w-full bg-cyan-600 hover:bg-cyan-700 text-white"
                    >
                        {isSubmitting ? 'Guardando...' : 'Completar Tarea'}
                    </Button>
                </DialogContent>
            </Dialog>
        </div>
    )
}
