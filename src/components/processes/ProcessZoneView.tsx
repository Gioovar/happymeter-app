'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Clock, CheckCircle2, Camera, Video, AlertTriangle, Upload, X, UserPlus, User, Pencil, ChevronRight, Search, Filter } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { toast } from 'sonner'
import { submitTaskEvidence, reportTaskIssue, addEvidenceComment } from '@/actions/processes'
import { assignTask } from '@/actions/processes-mutations'
import { getOperators } from '@/actions/team'
import Image from 'next/image'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import ProcessHistoryView from './ProcessHistoryView'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import AssignTaskDialog from './AssignTaskDialog'
import EditTaskDialog from './EditTaskDialog'
import TaskHistoryDialog from './TaskHistoryDialog'
import TaskCamera from '@/components/ops/TaskCamera'
// @ts-ignore
import { upload } from '@vercel/blob/client'

interface Task {
    id: string
    title: string
    description: string | null
    limitTime: string | null
    evidenceType: string
    evidences: any[]
    assignedStaff?: {
        name: string | null
        user: {
            businessName: string | null
            photoUrl: string | null
        } | null
    } | null
}

type EvidenceStep = 'IDLE' | 'PHOTO' | 'VIDEO' | 'REVIEW' | 'SUCCESS' | 'ADD_COMMENT'

export default function ProcessZoneView({ zones, memberId, branchId }: { zones: any[], memberId: string, branchId: string }) {
    const router = useRouter()
    const [selectedZoneId, setSelectedZoneId] = useState(zones[0]?.id)
    const activeZone = zones.find(z => z.id === selectedZoneId) || zones[0]

    const [selectedTask, setSelectedTask] = useState<Task | null>(null)
    const [isSubmitting, setIsSubmitting] = useState(false)

    // Multi-Step Evidence State
    const [evidenceStep, setEvidenceStep] = useState<EvidenceStep>('IDLE')
    const [tempPhoto, setTempPhoto] = useState<File | null>(null)
    const [tempVideo, setTempVideo] = useState<File | null>(null)
    const [photoPreview, setPhotoPreview] = useState<string | null>(null)
    const [videoPreview, setVideoPreview] = useState<string | null>(null)
    const [location, setLocation] = useState<{ lat: number, lng: number } | null>(null)
    const [lastEvidenceIds, setLastEvidenceIds] = useState<string[]>([])
    const [postSubmitComment, setPostSubmitComment] = useState('')
    const [isSubmittingComment, setIsSubmittingComment] = useState(false)

    // Reporting State
    const [isReportDialogOpen, setIsReportDialogOpen] = useState(false)
    const [reportReason, setReportReason] = useState('')
    const [isSubmittingReport, setIsSubmittingReport] = useState(false)

    // Assignment States
    const [assignDialogOpen, setAssignDialogOpen] = useState(false)
    const [taskToAssign, setTaskToAssign] = useState<Task | null>(null)
    const [staffList, setStaffList] = useState<any[]>([])
    const [loadingStaff, setLoadingStaff] = useState(false)

    // Edit State
    const [editDialogOpen, setEditDialogOpen] = useState(false)
    const [taskToEdit, setTaskToEdit] = useState<Task | null>(null)

    const [historyDialogOpen, setHistoryDialogOpen] = useState(false)
    const [taskForHistory, setTaskForHistory] = useState<Task | null>(null)

    const [evidenceComment, setEvidenceComment] = useState('')

    // --- Search & Filter State ---
    const [searchQuery, setSearchQuery] = useState('')
    const [statusFilter, setStatusFilter] = useState('ALL') // ALL, COMPLETED, PENDING, LATE
    const [staffFilter, setStaffFilter] = useState('ALL') // ALL, UNASSIGNED, staffId

    // Reset state when dialog closes
    useEffect(() => {
        if (!selectedTask) {
            setEvidenceStep('IDLE')
            setTempPhoto(null)
            setTempVideo(null)
            setPhotoPreview(null)
            setVideoPreview(null)
            setEvidenceComment('')
            setLocation(null)
            setLastEvidenceIds([])
            setPostSubmitComment('')
        }
    }, [selectedTask])

    // Initialize Step based on Task Type
    const startTask = (task: Task) => {
        setSelectedTask(task)
        if (task.evidenceType === 'BOTH' || task.evidenceType === 'PHOTO') {
            setEvidenceStep('PHOTO')
        } else {
            setEvidenceStep('VIDEO')
        }
    }

    const handleCapture = (file: File, meta: { lat: number, lng: number, capturedAt: Date, type: 'PHOTO' | 'VIDEO' }) => {
        if (meta.lat !== 0 || meta.lng !== 0) {
            setLocation({ lat: meta.lat, lng: meta.lng })
        }

        if (meta.type === 'PHOTO') {
            setTempPhoto(file)
            setPhotoPreview(URL.createObjectURL(file))

            if (selectedTask?.evidenceType === 'BOTH' && !tempVideo) {
                setEvidenceStep('VIDEO')
            } else {
                setEvidenceStep('REVIEW')
            }
        } else {
            setTempVideo(file)
            setVideoPreview(URL.createObjectURL(file))
            setEvidenceStep('REVIEW')
        }
    }

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

    const handleReportSubmit = async () => {
        if (!selectedTask || !reportReason.trim()) return

        try {
            setIsSubmittingReport(true)
            await reportTaskIssue(selectedTask.id, reportReason)
            toast.success('Reporte enviado al dueño.')
            setIsReportDialogOpen(false)
            setSelectedTask(null)
            setReportReason('')
            router.refresh()
        } catch (error) {
            toast.error('Error al enviar reporte')
            console.error(error)
        } finally {
            setIsSubmittingReport(false)
        }
    }

    const handlePostSubmitComment = async () => {
        if (!lastEvidenceIds.length || !postSubmitComment.trim()) return

        setIsSubmittingComment(true)
        try {
            // Add comment to all evidences submitted in this batch
            await Promise.all(lastEvidenceIds.map(id => addEvidenceComment(id, postSubmitComment)))
            toast.success('Comentario agregado')
            setEvidenceStep('SUCCESS') // Go back to success screen or close? 
            // User probably wants to finish after comment.
            setSelectedTask(null)
            setEvidenceStep('IDLE')
            router.refresh()
        } catch (error) {
            console.error(error)
            toast.error('Error al guardar comentario')
        } finally {
            setIsSubmittingComment(false)
        }
    }

    const handleSubmit = async () => {
        if (!selectedTask) return
        if (!tempPhoto && !tempVideo) return

        setIsSubmitting(true)
        const newIds: string[] = []

        try {
            // Upload Photo if exists
            if (tempPhoto) {
                // FIXME: Start using Vercel Blob when credentials are ready
                // const blob = await upload(tempPhoto.name, tempPhoto, { access: 'public', handleUploadUrl: '/api/upload' })
                // const url = blob.url
                const fakeUrl = `https://fake-evidence.com/photo-${Date.now()}.jpg`

                const res = await submitTaskEvidence({
                    taskId: selectedTask.id,
                    fileUrl: fakeUrl,
                    capturedAt: new Date(),
                    comments: evidenceComment,
                    latitude: location?.lat,
                    longitude: location?.lng
                })
                if (res?.evidence?.id) newIds.push(res.evidence.id)
            }

            // Upload Video if exists
            if (tempVideo) {
                const fakeUrl = `https://fake-evidence.com/video-${Date.now()}.mp4`
                const res = await submitTaskEvidence({
                    taskId: selectedTask.id,
                    fileUrl: fakeUrl,
                    capturedAt: new Date(),
                    comments: evidenceComment,
                    latitude: location?.lat,
                    longitude: location?.lng
                })
                if (res?.evidence?.id) newIds.push(res.evidence.id)
            }

            toast.success('Evidencia guardada correctamente')
            setLastEvidenceIds(newIds)
            setEvidenceStep('SUCCESS') // Transition to Success instead of closing
            // Don't close selectedTask yet
        } catch (error) {
            console.error(error)
            toast.error('Error al guardar evidencia')
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleUnassign = async (taskId: string) => {
        toast.promise(assignTask(taskId, null), {
            loading: 'Eliminando asignación...',
            success: 'Asignación eliminada',
            error: 'Error al eliminar asignación'
        })
    }

    const openAssignDialog = async (task: Task, e: React.MouseEvent) => {
        e.stopPropagation() // Prevent opening detail modal
        setTaskToAssign(task)
        setAssignDialogOpen(true)
        setLoadingStaff(true)
        try {
            // Pass branchId to get only staff from current branch
            const staff = await getOperators(branchId)
            setStaffList(staff)
        } catch (error) {
            console.error("Failed to load staff", error)
            toast.error("Error cargando empleados")
        } finally {
            setLoadingStaff(false)
        }
    }

    const openEditDialog = (task: Task, e: React.MouseEvent) => {
        e.stopPropagation()
        setTaskToEdit(task)
        setEditDialogOpen(true)
    }

    // Compute filtered tasks using useMemo
    const filteredTasks = useMemo(() => {
        return activeZone?.tasks?.filter((task: any) => {
            // Search
            if (searchQuery && !task.title.toLowerCase().includes(searchQuery.toLowerCase())) {
                return false
            }

            // Status
            const status = getTaskStatus(task)
            if (statusFilter === 'COMPLETED' && status.label !== 'Completado') return false
            if (statusFilter === 'PENDING' && status.label !== 'Pendiente') return false
            if (statusFilter === 'LATE' && status.label !== 'Atrasado') return false

            // Staff
            if (staffFilter === 'UNASSIGNED' && task.assignedStaff) return false
            if (staffFilter !== 'ALL' && staffFilter !== 'UNASSIGNED') {
                if (task.assignedStaff?.name !== staffFilter) return false
            }

            return true
        }) || []
    }, [activeZone?.tasks, searchQuery, statusFilter, staffFilter])

    // Get unique staff list from current tasks for filter dropdown
    const availableStaff = useMemo(() => {
        const staffSet = new Set<string>()
        activeZone?.tasks?.forEach((task: any) => {
            if (task.assignedStaff?.name) {
                staffSet.add(task.assignedStaff.name)
            }
        })
        return Array.from(staffSet).sort()
    }, [activeZone?.tasks])

    if (!activeZone) {
        return <div className="p-8 text-center text-gray-500">No hay zonas operativas disponibles.</div>
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 mb-2">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => router.back()} className="text-gray-400 hover:text-white">
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                            {activeZone.name}
                        </h1>
                        <p className="text-gray-400 text-sm">{activeZone.description || 'Lista de tareas operativas'}</p>
                    </div>
                </div>

                {/* Zone Selector */}
                {zones.length > 1 && (
                    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                        {zones.map((z) => (
                            <Button
                                key={z.id}
                                variant={z.id === selectedZoneId ? "default" : "outline"}
                                onClick={() => setSelectedZoneId(z.id)}
                                className={`rounded-full ${z.id === selectedZoneId ? 'bg-cyan-600 hover:bg-cyan-700 border-transparent text-white' : 'border-white/10 text-gray-400 hover:text-white hover:bg-white/5'}`}
                                size="sm"
                            >
                                {z.name}
                            </Button>
                        ))}
                    </div>
                )}
            </div>

            {/* Filters Bar */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
                {/* Search */}
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <input
                        type="text"
                        placeholder="Buscar tarea..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-[#111] border border-white/10 rounded-lg pl-9 pr-4 py-2 text-sm text-white focus:outline-none focus:border-cyan-500/50"
                    />
                </div>

                {/* Status Filter */}
                <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="bg-[#111] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500/50 appearance-none cursor-pointer"
                >
                    <option value="ALL">Todos los estados</option>
                    <option value="PENDING">Pendientes</option>
                    <option value="COMPLETED">Completados</option>
                    <option value="LATE">Atrasados</option>
                </select>

                {/* Staff Filter */}
                <select
                    value={staffFilter}
                    onChange={(e) => setStaffFilter(e.target.value)}
                    className="bg-[#111] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500/50 appearance-none cursor-pointer"
                >
                    <option value="ALL">Todo el personal</option>
                    <option value="UNASSIGNED">Sin Asignar</option>
                    {availableStaff.map((staffName) => (
                        <option key={staffName} value={staffName}>
                            {staffName}
                        </option>
                    ))}
                </select>
            </div>

            <Tabs defaultValue="today" className="w-full">
                <div className="flex justify-center mb-8">
                    <TabsList className="grid w-full max-w-md grid-cols-2 bg-black/40 border border-white/10 p-1 rounded-full backdrop-blur-xl">
                        <TabsTrigger
                            value="today"
                            className="rounded-full data-[state=active]:bg-cyan-500 data-[state=active]:text-black data-[state=active]:font-bold data-[state=active]:shadow-[0_0_20px_rgba(6,182,212,0.4)] transition-all duration-300"
                        >
                            Tareas de Hoy
                        </TabsTrigger>
                        <TabsTrigger
                            value="history"
                            className="rounded-full data-[state=active]:bg-cyan-500 data-[state=active]:text-black data-[state=active]:font-bold data-[state=active]:shadow-[0_0_20px_rgba(6,182,212,0.4)] transition-all duration-300"
                        >
                            Historial
                        </TabsTrigger>
                    </TabsList>
                </div>


                <TabsContent value="today" className="mt-0 space-y-3">
                    {filteredTasks.length === 0 ? (
                        <div className="text-center py-10 text-gray-500 border border-dashed border-white/10 rounded-xl">
                            <p>No se encontraron tareas con los filtros actuales.</p>
                            <Button
                                variant="link"
                                onClick={() => {
                                    setSearchQuery('')
                                    setStatusFilter('ALL')
                                    setStaffFilter('ALL')
                                }}
                                className="text-cyan-400"
                            >
                                Limpiar filtros
                            </Button>
                        </div>
                    ) : (
                        filteredTasks.map((task: Task) => {
                            const status = getTaskStatus(task)
                            const StatusIcon = status.icon
                            const assignedStaff = task.assignedStaff
                            const assignedToName = assignedStaff?.user?.businessName || assignedStaff?.name
                            const assignedToPhoto = assignedStaff?.user?.photoUrl

                            return (
                                <div
                                    key={task.id}
                                    className={`group relative bg-[#111] border border-white/10 rounded-xl p-4 hover:border-cyan-500/30 transition-all cursor-pointer overflow-hidden flex flex-col md:flex-row md:items-center gap-4 ${task.evidences?.[0] ? 'opacity-75' : ''}`}
                                    onClick={() => {
                                        setTaskForHistory(task)
                                        setHistoryDialogOpen(true)
                                    }}
                                >
                                    <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

                                    {/* Status Icon */}
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 relative z-10 ${status.color}`}>
                                        <StatusIcon className="w-5 h-5" />
                                    </div>

                                    {/* Main Content */}
                                    <div className="flex-1 min-w-0 relative z-10">
                                        <div className="flex items-center gap-2 mb-1">
                                            <h3 className="font-bold text-base text-white truncate group-hover:text-cyan-400 transition-colors">
                                                {task.title}
                                            </h3>
                                            <Badge variant="outline" className={`${status.color} border-0 text-[10px] h-5 px-1.5`}>
                                                {status.label}
                                            </Badge>
                                        </div>

                                        {task.description && (
                                            <p className="text-sm text-gray-400 line-clamp-1 mb-2">{task.description}</p>
                                        )}

                                        {assignedStaff && (
                                            <div className="flex items-center gap-2 mt-2">
                                                <Avatar className="w-6 h-6 border border-white/10">
                                                    {assignedToPhoto && <AvatarImage src={assignedToPhoto} />}
                                                    <AvatarFallback className="text-[10px] bg-cyan-600 text-white">
                                                        {assignedToName?.charAt(0).toUpperCase()}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <span className="text-xs text-gray-400">{assignedToName}</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Metadata & Action */}
                                    <div className="flex items-center gap-4 shrink-0 relative z-10 w-full md:w-auto justify-between md:justify-end mt-2 md:mt-0">
                                        <div className="flex items-center gap-3">
                                            {task.limitTime && (
                                                <div className="flex items-center gap-1.5 text-xs text-gray-400 bg-white/5 px-2 py-1 rounded">
                                                    <Clock className="w-3.5 h-3.5 text-orange-400" />
                                                    <span className="font-mono">{task.limitTime}</span>
                                                </div>
                                            )}
                                            <div className="flex items-center gap-1.5 text-xs text-gray-400 bg-white/5 px-2 py-1 rounded">
                                                {task.evidenceType === 'BOTH' ? (
                                                    <>
                                                        <Camera className="w-3.5 h-3.5 text-purple-400" />
                                                        <span className="text-gray-600">|</span>
                                                        <Video className="w-3.5 h-3.5 text-blue-400" />
                                                        <span className="hidden sm:inline">Foto & Video</span>
                                                    </>
                                                ) : task.evidenceType === 'VIDEO' ? (
                                                    <>
                                                        <Video className="w-3.5 h-3.5 text-blue-400" />
                                                        <span className="hidden sm:inline">Video</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <Camera className="w-3.5 h-3.5 text-purple-400" />
                                                        <span className="hidden sm:inline">Foto</span>
                                                    </>
                                                )}
                                            </div>
                                        </div>

                                        {!task.evidences?.[0] && (
                                            <div className="flex items-center gap-1">
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={(e) => openEditDialog(task, e)}
                                                    className="text-gray-400 hover:text-white hover:bg-white/10 p-2 h-8 w-8 rounded-full"
                                                    title="Editar Tarea"
                                                >
                                                    <Pencil className="w-3.5 h-3.5" />
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={(e) => openAssignDialog(task, e)}
                                                    className="text-cyan-400 hover:text-cyan-300 hover:bg-cyan-950 p-2 h-auto font-bold text-xs gap-1 hidden md:flex"
                                                >
                                                    {assignedStaff ? 'Reasignar' : 'Asignar'} <UserPlus className="w-3.5 h-3.5" />
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )
                        })
                    )}
                </TabsContent>

                <TabsContent value="history" className="mt-0">
                    <ProcessHistoryView zoneId={activeZone.id} />
                </TabsContent>
            </Tabs>

            {/* Evidence Wizard Dialog */}
            <Dialog open={!!selectedTask} onOpenChange={(open) => {
                if (!open) {
                    if (evidenceStep === 'SUCCESS') {
                        // Refresh on close if success
                        router.refresh()
                    }
                    setSelectedTask(null)
                }
            }}>
                <DialogContent className="bg-[#111] border-white/10 text-white sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>{selectedTask?.title}</DialogTitle>
                    </DialogHeader>

                    {evidenceStep === 'PHOTO' && (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between text-sm text-purple-300 bg-purple-500/10 px-3 py-2 rounded-lg border border-purple-500/20">
                                <span className="flex items-center gap-2"><Camera className="w-4 h-4" /> Paso 1: Captura Foto</span>
                                {selectedTask?.evidenceType === 'BOTH' && <span className="text-xs opacity-50">1/2</span>}
                            </div>
                            <div className="rounded-xl overflow-hidden bg-black border border-white/10">
                                <TaskCamera
                                    evidenceType="PHOTO"
                                    onCapture={(f, meta) => handleCapture(f, meta)}
                                />
                            </div>
                        </div>
                    )}

                    {evidenceStep === 'VIDEO' && (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between text-sm text-blue-300 bg-blue-500/10 px-3 py-2 rounded-lg border border-blue-500/20">
                                <span className="flex items-center gap-2"><Video className="w-4 h-4" /> Paso {selectedTask?.evidenceType === 'BOTH' ? '2' : '1'}: Captura Video</span>
                                {selectedTask?.evidenceType === 'BOTH' && <span className="text-xs opacity-50">2/2</span>}
                            </div>
                            <div className="rounded-xl overflow-hidden bg-black border border-white/10">
                                <TaskCamera
                                    evidenceType="VIDEO"
                                    onCapture={(f, meta) => handleCapture(f, meta)}
                                />
                            </div>
                        </div>
                    )}

                    {evidenceStep === 'REVIEW' && (
                        <div className="space-y-6">
                            <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3 text-green-400 text-sm flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4" />
                                Evidencia capturada. Revisa antes de enviar.
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                                {photoPreview && (
                                    <div className="relative aspect-square bg-black rounded-lg overflow-hidden border border-white/10">
                                        <Image src={photoPreview} alt="Foto" fill className="object-cover" unoptimized />
                                        <Badge className="absolute bottom-2 left-2 bg-purple-500 text-white border-0 text-[10px]">FOTO</Badge>
                                        <button
                                            onClick={() => setEvidenceStep('PHOTO')}
                                            className="absolute top-2 right-2 p-1 bg-black/50 rounded-full hover:bg-white/20 text-white"
                                        >
                                            <Pencil className="w-3 h-3" />
                                        </button>
                                    </div>
                                )}
                                {videoPreview && (
                                    <div className="relative aspect-square bg-black rounded-lg overflow-hidden border border-white/10">
                                        <video src={videoPreview} className="w-full h-full object-cover" />
                                        <Badge className="absolute bottom-2 left-2 bg-blue-500 text-white border-0 text-[10px]">VIDEO</Badge>
                                        <button
                                            onClick={() => setEvidenceStep('VIDEO')}
                                            className="absolute top-2 right-2 p-1 bg-black/50 rounded-full hover:bg-white/20 text-white"
                                        >
                                            <Pencil className="w-3 h-3" />
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Comments Input */}
                            {/* Removed comments here as requested, moving to SUCCESS step or keep? 
                                User said: "CUANDO TERMINA... QUIERO QUE SALGA UN BOTON DE ENVIAR Y OTRO DE COMENTARIOS"
                                So main comments here are fine, but the *extra* comments come after success. 
                                We'll keep this initial comment field as is for clarity.
                            */}
                            <div>
                                <label className="text-xs text-gray-500 mb-1 block">Comentarios (Opcional)</label>
                                <textarea
                                    value={evidenceComment}
                                    onChange={(e) => setEvidenceComment(e.target.value)}
                                    placeholder="Añadir nota sobre la evidencia..."
                                    className="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-white text-sm focus:outline-none focus:border-cyan-500/50 h-20 resize-none"
                                />
                            </div>

                            <div className="flex flex-col gap-3">
                                <Button
                                    onClick={handleSubmit}
                                    disabled={isSubmitting}
                                    className="w-full bg-cyan-600 hover:bg-cyan-700 text-white"
                                >
                                    {isSubmitting ? 'Subiendo...' : 'Confirmar y Enviar'}
                                </Button>
                            </div>
                        </div>
                    )}

                    {evidenceStep === 'SUCCESS' && (
                        <div className="py-8 flex flex-col items-center text-center space-y-6 animate-in fade-in zoom-in duration-300">
                            <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mb-2">
                                <CheckCircle2 className="w-10 h-10 text-green-500" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-white mb-2">¡Evidencia Subida!</h3>
                                <p className="text-gray-400 text-sm max-w-[260px] mx-auto">
                                    La tarea se ha registrado correctamente.
                                </p>
                            </div>

                            <div className="w-full space-y-3 pt-4">
                                <Button
                                    className="w-full bg-white text-black hover:bg-gray-200 font-bold"
                                    onClick={() => {
                                        setSelectedTask(null)
                                        setEvidenceStep('IDLE')
                                        router.refresh()
                                    }}
                                >
                                    Finalizar
                                </Button>

                                <Button
                                    variant="outline"
                                    className="w-full border-white/10 text-gray-300 hover:bg-white/5 hover:text-white"
                                    onClick={() => setEvidenceStep('ADD_COMMENT')}
                                >
                                    Agregar Novedad / Comentario
                                </Button>
                            </div>
                        </div>
                    )}

                    {evidenceStep === 'ADD_COMMENT' && (
                        <div className="space-y-4 py-2 animate-in slide-in-from-right-10 duration-300">
                            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3 text-yellow-200 text-sm flex items-center gap-2">
                                <AlertTriangle className="w-4 h-4 text-yellow-500" />
                                Reportar novedad o falta de materiales
                            </div>

                            <textarea
                                value={postSubmitComment}
                                onChange={(e) => setPostSubmitComment(e.target.value)}
                                placeholder="Ej: No se pudo limpiar bien porque falta desengrasante..."
                                className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-yellow-500/50 min-h-[120px] resize-none"
                                autoFocus
                            />

                            <div className="flex gap-3 pt-2">
                                <Button
                                    variant="ghost"
                                    className="flex-1 text-gray-400 hover:text-white"
                                    onClick={() => setEvidenceStep('SUCCESS')}
                                >
                                    Cancelar
                                </Button>
                                <Button
                                    className="flex-1 bg-yellow-600 hover:bg-yellow-700 text-white"
                                    onClick={handlePostSubmitComment}
                                    disabled={!postSubmitComment.trim() || isSubmittingComment}
                                >
                                    {isSubmittingComment ? 'Enviando...' : 'Enviar Comentario'}
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* Common Report Button - Only show in capture/review steps */}
                    {['PHOTO', 'VIDEO', 'REVIEW'].includes(evidenceStep) && (
                        <div className="pt-2">
                            <Button
                                onClick={() => setIsReportDialogOpen(true)}
                                variant="ghost"
                                className="w-full text-red-400 hover:text-red-300 hover:bg-red-500/10 h-8 text-xs"
                            >
                                <AlertTriangle className="w-3 h-3 mr-2" />
                                Reportar Problema
                            </Button>
                        </div>
                    )}

                </DialogContent>
            </Dialog>

            {/* Report Issue Dialog */}
            <Dialog open={isReportDialogOpen} onOpenChange={setIsReportDialogOpen}>
                <DialogContent className="bg-[#111] border-white/10 text-white sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-red-400 flex items-center gap-2">
                            <AlertTriangle className="w-5 h-5" />
                            Reportar Problema
                        </DialogTitle>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <p className="text-sm text-gray-400">
                            Describe por qué no puedes completar esta tarea (ej. falta de materiales, equipo dañado, etc).
                            El dueño recibirá una alerta inmediata.
                        </p>
                        <textarea
                            value={reportReason}
                            onChange={(e) => setReportReason(e.target.value)}
                            placeholder="Escribe el motivo aquí..."
                            className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-red-500/50 min-h-[100px]"
                        />
                    </div>

                    <DialogFooter>
                        <Button
                            variant="ghost"
                            onClick={() => setIsReportDialogOpen(false)}
                            className="text-gray-400 hover:text-white"
                        >
                            Cancelar
                        </Button>
                        <Button
                            onClick={handleReportSubmit}
                            disabled={!reportReason.trim() || isSubmittingReport}
                            className="bg-red-600 hover:bg-red-700 text-white"
                        >
                            {isSubmittingReport ? 'Enviando...' : 'Enviar Reporte'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Assignment Dialog */}
            <AssignTaskDialog
                open={assignDialogOpen}
                onOpenChange={setAssignDialogOpen}
                task={taskToAssign}
                staffList={staffList}
                refreshData={() => router.refresh()}
                branchId={branchId} // Pass current branch ID
            />

            {/* Edit Task Dialog */}
            <EditTaskDialog
                open={editDialogOpen}
                onOpenChange={setEditDialogOpen}
                task={taskToEdit}
                onSuccess={() => router.refresh()}
            />
            {/* Task History Dialog */}
            <TaskHistoryDialog
                open={historyDialogOpen}
                onOpenChange={setHistoryDialogOpen}
                task={taskForHistory}
                onStartTask={() => {
                    if (taskForHistory) {
                        startTask(taskForHistory)
                    }
                }}
                onAssign={() => {
                    if (taskForHistory) {
                        // Open Assign Dialog
                        setTaskToAssign(taskForHistory)
                        setAssignDialogOpen(true)
                        // Load staff logic repeated or moved? 
                        // It's cleaner to trigger the existing openAssignDialog logic, but we need the event object there.
                        // Simplified:
                        setLoadingStaff(true)
                        getOperators(branchId).then(staff => {
                            setStaffList(staff)
                            setLoadingStaff(false)
                        }).catch(() => {
                            setLoadingStaff(false)
                            toast.error("Error cargando empleados")
                        })
                    }
                }}
            />
        </div>
    )
}
