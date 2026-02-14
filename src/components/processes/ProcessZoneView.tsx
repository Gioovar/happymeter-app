
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
}

export default function ProcessZoneView({ zone, branchSlug }: ProcessZoneViewProps) {
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
                    <h1 className="text-2xl font-bold text-white">{zone.name}</h1>
                    <p className="text-gray-400 text-sm">{zone.description || 'Lista de tareas operativas'}</p>
                </div>
            </div>

            <Tabs defaultValue="today" className="w-full">
                <TabsList className="grid w-full grid-cols-2 bg-[#111] border border-white/10 mb-6">
                    <TabsTrigger value="today" className="data-[state=active]:bg-cyan-600 data-[state=active]:text-white">Tareas de Hoy</TabsTrigger>
                    <TabsTrigger value="history" className="data-[state=active]:bg-cyan-600 data-[state=active]:text-white">Historial</TabsTrigger>
                </TabsList>

                <TabsContent value="today" className="mt-0">
                    <div className="grid gap-4">
                        {zone.tasks.map(task => {
                            const status = getTaskStatus(task)
                            const StatusIcon = status.icon

                            return (
                                <Card
                                    key={task.id}
                                    className={`bg-[#111] border-white/10 hover:border-cyan-500/30 transition-all cursor-pointer ${task.evidences?.[0] ? 'opacity-75' : ''}`}
                                    onClick={() => !task.evidences?.[0] && setSelectedTask(task)}
                                >
                                    <CardContent className="p-4 flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${status.color}`}>
                                                <StatusIcon className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-white">{task.title}</h3>
                                                <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                                                    {task.limitTime && (
                                                        <span className="flex items-center gap-1">
                                                            <Clock className="w-3 h-3" />
                                                            Límite: {task.limitTime}
                                                        </span>
                                                    )}
                                                    <span>•</span>
                                                    <span>{task.evidenceType === 'PHOTO' ? '📸 Foto' : '🎥 Video'}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <Badge variant="outline" className={`${status.color} border-0`}>
                                                {status.label}
                                            </Badge>
                                        </div>
                                    </CardContent>
                                </Card>
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
