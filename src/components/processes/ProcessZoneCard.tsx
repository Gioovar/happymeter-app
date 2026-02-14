"use client"

import Link from "next/link"
import { MapPin, ArrowUpRight, MoreVertical, Pencil, Trash2, GitMerge } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useState } from "react"
import { ProcessFlowForm } from "./ProcessFlowForm"
import { toast } from "sonner"
import { deleteProcessZone } from "@/actions/processes-mutations"
import { useRouter } from "next/navigation"

interface ProcessZoneCardProps {
    zone: any // Typed properly in real app
    branchSlug: string
    branchId: string
}

export function ProcessZoneCard({ zone, branchSlug, branchId }: ProcessZoneCardProps) {
    const router = useRouter()
    const [isEditOpen, setIsEditOpen] = useState(false)
    const [isDeleteOpen, setIsDeleteOpen] = useState(false)
    const [isDeleting, setIsDeleting] = useState(false)

    const handleDelete = async () => {
        setIsDeleting(true)
        try {
            await deleteProcessZone(zone.id)
            toast.success("Zona eliminada correctamente")
            router.refresh()
        } catch (error) {
            toast.error("Error al eliminar la zona")
        } finally {
            setIsDeleting(false)
            setIsDeleteOpen(false)
        }
    }

    return (
        <div className="bg-[#111] border border-white/10 rounded-3xl p-6 h-full relative group hover:-translate-y-1 transition-transform duration-300">
            {/* Hover Gradient */}
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 to-blue-600/10 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

            <div className="flex justify-between items-start mb-6 relative z-10">
                <div className="p-3 bg-white/5 rounded-2xl group-hover:bg-cyan-500/20 group-hover:text-cyan-400 transition-colors">
                    <MapPin className="w-6 h-6 text-gray-300 group-hover:text-cyan-400" />
                </div>

                <div className="flex items-center gap-2">
                    <div className="bg-white/5 px-3 py-1 rounded-full border border-white/5">
                        <span className="text-xs font-mono text-gray-300">{zone._count?.tasks || 0} Tareas</span>
                    </div>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-white rounded-full">
                                <MoreVertical className="w-4 h-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-[#1a1a1a] border-white/10 text-white">
                            <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => setIsEditOpen(true)} className="cursor-pointer hover:bg-white/10">
                                <Pencil className="w-4 h-4 mr-2" /> Editar
                            </DropdownMenuItem>
                            <DropdownMenuSeparator className="bg-white/10" />
                            <DropdownMenuItem onClick={() => setIsDeleteOpen(true)} className="cursor-pointer text-red-400 hover:text-red-300 hover:bg-red-400/10">
                                <Trash2 className="w-4 h-4 mr-2" /> Eliminar
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            <Link href={`/dashboard/${branchSlug}/processes/${zone.id}`} className="block relative z-10">
                <h4 className="text-xl font-bold text-white mb-2 group-hover:text-cyan-400 transition-colors">{zone.name}</h4>
                <p className="text-sm text-gray-400 line-clamp-2 mb-6 min-h-[40px]">{zone.description || "Zona operativa sin descripción detallada."}</p>

                <div className="flex items-center gap-2 text-xs font-bold text-cyan-400 group-hover:translate-x-1 transition-transform">
                    Gestionar Zona <ArrowUpRight className="w-3 h-3" />
                </div>
            </Link>

            {/* Edit Dialog */}
            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                <DialogContent className="bg-[#111] border-white/10 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Editar Zona</DialogTitle>
                        <DialogDescription className="text-gray-400">
                            Modifica los detalles de la zona y sus tareas.
                        </DialogDescription>
                    </DialogHeader>
                    {/* Pass initialData to Form */}
                    <ProcessFlowForm
                        branchId={branchId}
                        branchSlug={branchSlug}
                        initialData={zone}
                        onSuccess={() => setIsEditOpen(false)}
                    />
                </DialogContent>
            </Dialog>

            {/* Delete Alert */}
            <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
                <AlertDialogContent className="bg-[#111] border-white/10 text-white">
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                        <AlertDialogDescription className="text-gray-400">
                            Esta acción no se puede deshacer. Se eliminarán permanentemente la zona y todas sus tareas asociadas.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel className="bg-transparent border-white/10 text-white hover:bg-white/5 hover:text-white">Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} disabled={isDeleting} className="bg-red-600 hover:bg-red-700 text-white border-0">
                            {isDeleting ? "Eliminando..." : "Eliminar"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
