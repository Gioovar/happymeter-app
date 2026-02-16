"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { UserPlus, User, Loader2, Mail, ArrowLeft, Check, Sparkles } from "lucide-react"
import { toast } from "sonner"
import { assignTask } from "@/actions/processes-mutations"
import { inviteMember, createOfflineOperator } from "@/actions/team"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { motion, AnimatePresence } from "framer-motion"

interface Task {
    id: string
    title: string
}

interface AssignTaskDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    task: Task | null
    staffList: any[]
    refreshData: () => void
    branchId: string // Current branch ID for team isolation
}

export default function AssignTaskDialog({ open, onOpenChange, task, staffList, refreshData, branchId }: AssignTaskDialogProps) {
    const [selectedStaffId, setSelectedStaffId] = useState<string>("")
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [mode, setMode] = useState<"ASSIGN" | "CREATE">("ASSIGN")
    const [createMode, setCreateMode] = useState<"EMAIL" | "OFFLINE">("OFFLINE") // Default to Offline for speed

    // Create/Invite State
    const [inviteEmail, setInviteEmail] = useState("")
    const [inviteName, setInviteName] = useState("")
    const [inviteJobTitle, setInviteJobTitle] = useState("")
    const [invitePhone, setInvitePhone] = useState("")

    const [operatorName, setOperatorName] = useState("")
    const [newAccessCode, setNewAccessCode] = useState<string | null>(null)

    useEffect(() => {
        if (!open) {
            // Reset state on close
            setSelectedStaffId("")
            setMode("ASSIGN")
            setCreateMode("OFFLINE")
            setInviteEmail("")
            setInviteName("")
            setInviteJobTitle("")
            setInvitePhone("")
            setOperatorName("")
            setNewAccessCode(null)
        }
    }, [open])

    const handleAssign = async () => {
        if (!task || !selectedStaffId) return

        setIsSubmitting(true)
        try {
            await assignTask(task.id, selectedStaffId)
            toast.success("Tarea asignada correctamente", {
                icon: <Sparkles className="w-4 h-4 text-cyan-400" />
            })
            onOpenChange(false)
            refreshData()
        } catch (error) {
            console.error(error)
            toast.error("Error al asignar tarea")
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleInvite = async () => {
        if (!inviteEmail) return

        setIsSubmitting(true)
        try {
            const formData = new FormData()
            formData.append('email', inviteEmail)
            formData.append('role', 'OPERATOR')
            formData.append('branchId', branchId) // Pass current branch ID
            if (inviteName) formData.append('name', inviteName)
            if (inviteJobTitle) formData.append('jobTitle', inviteJobTitle)
            if (invitePhone) formData.append('phone', invitePhone)
            if (task?.id) formData.append('assignedTaskId', task.id)

            const result = await inviteMember(formData)
            if (!result.success) {
                // @ts-ignore
                throw new Error(result.error || "No se pudo invitar al miembro")
            }

            toast.success("Invitación enviada", {
                description: "El empleado aparecerá en la lista una vez acepte la invitación."
            })
            setMode("ASSIGN")
            setInviteEmail("")
            setInviteName("")
            setInviteJobTitle("")
            setInvitePhone("")
            refreshData()
        } catch (error: any) {
            console.error(error)
            toast.error(error.message || "Error al enviar invitación")
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleCreateOffline = async () => {
        if (!operatorName) return

        setIsSubmitting(true)
        try {
            const res = await createOfflineOperator(operatorName, branchId) // Pass branchId
            if (res.success) {
                setNewAccessCode(res.accessCode!)
                toast.success("Operador creado exitosamente")
                refreshData()
            } else {
                toast.error(res.error || "Error al crear operador")
            }
        } catch (error: any) {
            console.error(error)
            toast.error(error.message || "Error al crear operador")
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleFinishCreation = () => {
        setMode("ASSIGN")
        setNewAccessCode(null)
        setOperatorName("")
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="bg-black/90 border-white/10 text-white sm:max-w-md backdrop-blur-xl p-0 overflow-hidden shadow-2xl shadow-cyan-900/20">
                <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 via-transparent to-purple-500/10 pointer-events-none" />

                <AnimatePresence mode="wait">
                    {mode === "ASSIGN" ? (
                        <motion.div
                            key="assign"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="p-6 space-y-6 relative"
                        >
                            <DialogHeader>
                                <DialogTitle className="text-xl flex items-center gap-2">
                                    <Sparkles className="w-5 h-5 text-cyan-400" />
                                    Asignar Responsable
                                </DialogTitle>
                                <DialogDescription className="text-gray-400">
                                    Selecciona quién se encargará de: <span className="text-white font-medium block mt-1">{task?.title}</span>
                                </DialogDescription>
                            </DialogHeader>

                            <div className="space-y-4">
                                <Select value={selectedStaffId} onValueChange={setSelectedStaffId}>
                                    <SelectTrigger className="w-full h-12 bg-white/5 border-white/10 text-white focus:ring-cyan-500/50 hover:bg-white/10 transition-colors">
                                        <SelectValue placeholder="Seleccionar empleado..." />
                                    </SelectTrigger>
                                    <SelectContent className="bg-[#111] border-white/10 text-white shadow-xl">
                                        {staffList.length > 0 ? (
                                            staffList.map((staff) => (
                                                <SelectItem key={staff.id} value={staff.id} className="focus:bg-cyan-900/30 focus:text-white cursor-pointer py-3">
                                                    <div className="flex items-center gap-3">
                                                        <Avatar className="w-6 h-6 border border-white/10">
                                                            <AvatarImage src={staff.user.photoUrl || undefined} />
                                                            <AvatarFallback className="bg-cyan-900 text-cyan-200 text-[10px]">
                                                                {staff.name?.[0] || staff.user.businessName?.[0] || 'S'}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                        <span className="text-sm font-medium">
                                                            {staff.name || staff.user.businessName || "Empleado"}
                                                        </span>
                                                        {staff.isOffline && <span className="text-[10px] bg-white/10 px-1.5 py-0.5 rounded text-gray-400">PIN</span>}
                                                    </div>
                                                </SelectItem>
                                            ))
                                        ) : (
                                            <div className="p-4 text-center space-y-2">
                                                <p className="text-sm text-gray-400">No hay operadores disponibles</p>
                                                <Button variant="link" size="sm" onClick={() => setMode("CREATE")} className="text-cyan-400">
                                                    Crear el primero
                                                </Button>
                                            </div>
                                        )}
                                    </SelectContent>
                                </Select>

                                <div className="relative">
                                    <div className="absolute inset-0 flex items-center">
                                        <span className="w-full border-t border-white/10" />
                                    </div>
                                    <div className="relative flex justify-center text-xs uppercase">
                                        <span className="bg-[#0a0a0a] px-2 text-gray-500">O también</span>
                                    </div>
                                </div>

                                <Button
                                    variant="outline"
                                    className="w-full border-dashed border-white/20 hover:bg-white/5 hover:border-cyan-500/50 hover:text-cyan-400 text-gray-400 flex items-center gap-2 h-12"
                                    onClick={() => setMode("CREATE")}
                                >
                                    <UserPlus className="w-4 h-4" />
                                    Registrar Nuevo Empleado
                                </Button>
                            </div>

                            <DialogFooter className="gap-2 sm:gap-0">
                                <Button variant="ghost" onClick={() => onOpenChange(false)} className="text-gray-400 hover:text-white hover:bg-white/5">
                                    Cancelar
                                </Button>
                                <Button
                                    onClick={handleAssign}
                                    disabled={!selectedStaffId || isSubmitting}
                                    className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white border-0 shadow-lg shadow-cyan-900/20"
                                >
                                    {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Confirmar Asignación"}
                                </Button>
                            </DialogFooter>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="create"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            className="p-6 space-y-6 relative"
                        >
                            <DialogHeader>
                                <div className="flex items-center gap-2 mb-2">
                                    <Button variant="ghost" size="icon" onClick={() => setMode("ASSIGN")} className="h-6 w-6 -ml-2 text-gray-400 hover:text-white">
                                        <ArrowLeft className="w-4 h-4" />
                                    </Button>
                                    <DialogTitle className="text-xl">Nuevo Empleado</DialogTitle>
                                </div>
                                <DialogDescription className="text-gray-400">
                                    Agrega un nuevo miembro a tu equipo operativo.
                                </DialogDescription>
                            </DialogHeader>

                            {!newAccessCode ? (
                                <>
                                    <div className="flex p-1 bg-white/5 rounded-lg mb-4">
                                        <button
                                            onClick={() => setCreateMode("OFFLINE")}
                                            className={`flex-1 text-sm font-medium py-2 rounded-md transition-colors ${createMode === "OFFLINE" ? "bg-cyan-600 text-white shadow-lg" : "text-gray-400 hover:text-white"}`}
                                        >
                                            Cuenta Local (PIN)
                                        </button>
                                        <button
                                            onClick={() => setCreateMode("EMAIL")}
                                            className={`flex-1 text-sm font-medium py-2 rounded-md transition-colors ${createMode === "EMAIL" ? "bg-cyan-600 text-white shadow-lg" : "text-gray-400 hover:text-white"}`}
                                        >
                                            Invitación Email
                                        </button>
                                    </div>

                                    <div className="space-y-4">
                                        {createMode === "OFFLINE" ? (
                                            <div className="space-y-2">
                                                <Label className="text-xs font-medium text-gray-400 uppercase tracking-wider">Nombre del Empleado</Label>
                                                <div className="relative">
                                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                                                    <Input
                                                        placeholder="Ej. Carlos Mesero"
                                                        value={operatorName}
                                                        onChange={(e) => setOperatorName(e.target.value)}
                                                        className="bg-white/5 border-white/10 pl-10 focus:border-cyan-500/50 text-white"
                                                    />
                                                </div>
                                                <p className="text-[10px] text-gray-500">
                                                    Se generará un código de acceso único para que este empleado pueda ingresar sin correo.
                                                </p>
                                            </div>
                                        ) : (

                                            <div className="space-y-3">
                                                <div className="space-y-1">
                                                    <Label className="text-xs font-medium text-gray-400 uppercase tracking-wider">Nombre del Empleado</Label>
                                                    <div className="relative">
                                                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                                                        <Input
                                                            placeholder="Ej. Ana García"
                                                            value={inviteName}
                                                            onChange={(e) => setInviteName(e.target.value)}
                                                            className="bg-white/5 border-white/10 pl-10 focus:border-cyan-500/50 text-white"
                                                        />
                                                    </div>
                                                </div>

                                                <div className="space-y-1">
                                                    <Label className="text-xs font-medium text-gray-400 uppercase tracking-wider">Correo Electrónico</Label>
                                                    <div className="relative">
                                                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                                                        <Input
                                                            placeholder="ejemplo@correo.com"
                                                            value={inviteEmail}
                                                            onChange={(e) => setInviteEmail(e.target.value)}
                                                            className="bg-white/5 border-white/10 pl-10 focus:border-cyan-500/50 text-white"
                                                        />
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-2 gap-3">
                                                    <div className="space-y-1">
                                                        <Label className="text-xs font-medium text-gray-400 uppercase tracking-wider">Puesto / Cargo</Label>
                                                        <Input
                                                            placeholder="Ej. Recepcionista"
                                                            value={inviteJobTitle}
                                                            onChange={(e) => setInviteJobTitle(e.target.value)}
                                                            className="bg-white/5 border-white/10 focus:border-cyan-500/50 text-white"
                                                        />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <Label className="text-xs font-medium text-gray-400 uppercase tracking-wider">Teléfono (Opcional)</Label>
                                                        <Input
                                                            placeholder="WhatsApp"
                                                            value={invitePhone}
                                                            onChange={(e) => setInvitePhone(e.target.value)}
                                                            className="bg-white/5 border-white/10 focus:border-cyan-500/50 text-white"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </>
                            ) : (
                                <div className="space-y-6 py-4">
                                    <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-6 text-center space-y-4">
                                        <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center mx-auto text-green-400">
                                            <Check className="w-6 h-6" />
                                        </div>
                                        <h3 className="text-lg font-bold text-white">¡Operador Creado!</h3>
                                        <div className="space-y-1">
                                            <p className="text-sm text-gray-400">Comparte este código con {operatorName}:</p>
                                            <div className="text-3xl font-mono font-bold text-cyan-400 tracking-widest py-2 bg-black/40 rounded-lg mt-2 select-all">
                                                {newAccessCode}
                                            </div>
                                        </div>
                                        <p className="text-xs text-yellow-500/80">
                                            Este código sirve para ingresar en el portal de operaciones.
                                        </p>
                                    </div>
                                </div>
                            )}

                            <DialogFooter>
                                {!newAccessCode ? (
                                    <>
                                        <Button variant="ghost" onClick={() => setMode("ASSIGN")} className="text-gray-400 hover:text-white hover:bg-white/5">
                                            Volver
                                        </Button>
                                        <Button
                                            onClick={createMode === "OFFLINE" ? handleCreateOffline : handleInvite}
                                            disabled={(createMode === "OFFLINE" ? !operatorName : !inviteEmail) || isSubmitting}
                                            className="bg-white text-black hover:bg-gray-200 font-medium"
                                        >
                                            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : (createMode === "OFFLINE" ? "Crear Cuenta" : "Enviar Invitación")}
                                        </Button>
                                    </>
                                ) : (
                                    <Button onClick={handleFinishCreation} className="w-full bg-cyan-600 hover:bg-cyan-500 text-white">
                                        Entendido, Volver
                                    </Button>
                                )}
                            </DialogFooter>
                        </motion.div>
                    )
                    }
                </AnimatePresence >
            </DialogContent >
        </Dialog >
    )
}
