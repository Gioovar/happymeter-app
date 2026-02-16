'use client'

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
import { Loader2, Trash2 } from "lucide-react"

interface DeleteConfirmationDialogProps {
    isOpen: boolean
    onOpenChange: (open: boolean) => void
    onConfirm: () => void
    title: string
    description: string
    isLoading?: boolean
}

export default function DeleteConfirmationDialog({
    isOpen,
    onOpenChange,
    onConfirm,
    title,
    description,
    isLoading = false
}: DeleteConfirmationDialogProps) {
    return (
        <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
            <AlertDialogContent className="bg-[#111] border-white/10 text-white max-w-[400px]">
                <AlertDialogHeader>
                    <div className="w-12 h-12 rounded-full bg-rose-500/10 flex items-center justify-center mb-4 mx-auto sm:mx-0">
                        <Trash2 className="w-6 h-6 text-rose-500" />
                    </div>
                    <AlertDialogTitle className="text-xl font-bold">{title}</AlertDialogTitle>
                    <AlertDialogDescription className="text-gray-400">
                        {description}
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className="mt-6">
                    <AlertDialogCancel
                        disabled={isLoading}
                        className="bg-transparent border-white/10 text-white hover:bg-white/5 hover:text-white rounded-xl"
                    >
                        Cancelar
                    </AlertDialogCancel>
                    <AlertDialogAction
                        onClick={(e) => {
                            e.preventDefault()
                            onConfirm()
                        }}
                        disabled={isLoading}
                        className="bg-rose-500 hover:bg-rose-600 text-white border-none rounded-xl shadow-lg shadow-rose-500/20 px-6"
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Eliminando...
                            </>
                        ) : (
                            "Confirmar Eliminación"
                        )}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}
