"use client"

import { useState } from "react"
import { User, Mail, Building2, UploadCloud, CheckCircle2, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { toast } from "sonner"
import Image from "next/image"
import { updateGlobalPromoterProfile } from "@/actions/promoters"

interface EditProfileDialogProps {
    profile: {
        name: string;
        email: string | null;
        bankAccount: string | null;
        avatarUrl: string | null;
        phone: string;
    }
}

export function EditProfileDialog({ profile }: EditProfileDialogProps) {
    const [isOpen, setIsOpen] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    
    const [name, setName] = useState(profile.name || "")
    const [email, setEmail] = useState(profile.email || "")
    const [bankAccount, setBankAccount] = useState(profile.bankAccount || "")
    const [photoBase64, setPhotoBase64] = useState<string | null>(null) // New photo uploaded
    const [previewPhoto, setPreviewPhoto] = useState<string | null>(profile.avatarUrl || null)

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        if (file.size > 5 * 1024 * 1024) {
            toast.error("La imagen no debe pesar más de 5MB")
            return
        }

        const reader = new FileReader()
        reader.onloadend = () => {
            const result = reader.result as string
            setPhotoBase64(result)
            setPreviewPhoto(result)
        }
        reader.readAsDataURL(file)
    }

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault()
        e.stopPropagation()

        if (!name || !email) {
            toast.error("Por favor completa tu Nombre y Correo.")
            return
        }

        setIsLoading(true)
        try {
            const res = await updateGlobalPromoterProfile(
                name.trim(),
                email.trim().toLowerCase(),
                bankAccount.trim(),
                photoBase64 // null means no changes to photo
            )

            if (res.success) {
                toast.success("¡Perfil actualizado con éxito!")
                setIsOpen(false)
            } else {
                toast.error(res.error || "Hubo un error al actualizar")
            }
        } catch (error) {
            toast.error("Ocurrió un error inesperado")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <div 
                    className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-white/5 transition-colors cursor-pointer group"
                    onClick={(e) => {
                        e.preventDefault()
                        setIsOpen(true)
                    }}
                >
                    <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-indigo-500/20 to-blue-500/20 border border-indigo-500/30 flex items-center justify-center shrink-0 group-hover:bg-indigo-500/30 transition-colors">
                        <User className="w-3 h-3 text-indigo-400" />
                    </div>
                    <span className="text-sm font-medium text-white group-hover:text-indigo-300 transition-colors">Mi Perfil</span>
                </div>
            </DialogTrigger>

            <DialogContent className="sm:max-w-md bg-[#0a0a0a] border border-white/10 text-white rounded-3xl shadow-[0_0_80px_rgba(79,70,229,0.15)] p-0 overflow-hidden z-[200]">
                {/* Visual Header */}
                <div className="h-40 bg-[#0a0a0a] relative overflow-hidden flex items-center justify-center">
                    <div className="absolute top-[-50%] left-[-10%] w-[120%] h-[200%] bg-[radial-gradient(ellipse_at_top_center,rgba(79,70,229,0.25)_0%,rgba(0,0,0,0)_60%)] pointer-events-none" />
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-20 mix-blend-screen pointer-events-none" />
                    
                    <div className="relative z-10 flex flex-col items-center mt-6">
                        <div className="relative w-20 h-20 rounded-full border-2 border-indigo-500 shadow-[0_0_30px_rgba(79,70,229,0.5)] overflow-hidden">
                            {previewPhoto ? (
                                <Image src={previewPhoto} alt="Avatar profile" fill className="object-cover" />
                            ) : (
                                <div className="w-full h-full bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center">
                                    <User className="w-8 h-8 text-white" />
                                </div>
                            )}
                            
                            {/* Upload Overlay */}
                            <label className="absolute inset-0 bg-black/50 hover:bg-black/40 flex flex-col items-center justify-center cursor-pointer opacity-0 hover:opacity-100 transition-opacity">
                                <UploadCloud className="w-6 h-6 text-white" />
                                <span className="text-[9px] font-bold mt-1 text-zinc-200">CAMBIAR</span>
                                <input 
                                    type="file" 
                                    accept="image/*" 
                                    className="hidden" 
                                    onChange={handleFileChange}
                                />
                            </label>
                            
                            {/* Visible hint if no photo */}
                            {!previewPhoto && (
                                <label className="absolute inset-0 flex flex-col items-center justify-center cursor-pointer">
                                    <UploadCloud className="w-6 h-6 text-white/50" />
                                    <input 
                                        type="file" 
                                        accept="image/*" 
                                        className="hidden" 
                                        onChange={handleFileChange}
                                    />
                                </label>
                            )}
                        </div>
                    </div>
                </div>

                <div className="px-6 pb-6 relative z-20">
                    <form onSubmit={handleUpdate} className="space-y-4">
                        <DialogHeader className="mb-4 text-center">
                            <DialogTitle className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-indigo-100 to-white tracking-tight">Editar Perfil</DialogTitle>
                            <DialogDescription className="text-zinc-400 text-sm">
                                Actualiza tus datos personales y cuenta bancaria.
                            </DialogDescription>
                        </DialogHeader>

                        {/* Telephone (Readonly) */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider ml-1">Teléfono</label>
                            <div className="relative group/input">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Building2 className="h-4 w-4 text-zinc-500" />
                                </div>
                                <Input
                                    value={profile.phone}
                                    disabled
                                    className="pl-10 h-12 bg-white/5 border-white/10 text-white rounded-xl text-sm focus:ring-0 opacity-50 cursor-not-allowed"
                                />
                            </div>
                        </div>

                        {/* Name */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider ml-1">Nombre Completo</label>
                            <div className="relative group/input">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <User className="h-4 w-4 text-zinc-500" />
                                </div>
                                <Input
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="pl-10 h-12 bg-white/5 border-white/10 text-white rounded-xl text-sm focus-visible:ring-indigo-500 focus:bg-white/10 transition-all placeholder:text-zinc-600"
                                    placeholder="Ej. Juan Pérez"
                                    required
                                />
                            </div>
                        </div>

                        {/* Email */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider ml-1">Correo Electrónico</label>
                            <div className="relative group/input">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Mail className="h-4 w-4 text-zinc-500" />
                                </div>
                                <Input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="pl-10 h-12 bg-white/5 border-white/10 text-white rounded-xl text-sm focus-visible:ring-indigo-500 focus:bg-white/10 transition-all placeholder:text-zinc-600"
                                    placeholder="correo@ejemplo.com"
                                    required
                                />
                            </div>
                        </div>

                        {/* Bank Account */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider ml-1">CLABE o Cuenta Bancaria</label>
                            <div className="relative group/input">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Building2 className="h-4 w-4 text-zinc-500" />
                                </div>
                                <Input
                                    value={bankAccount}
                                    onChange={(e) => setBankAccount(e.target.value)}
                                    className="pl-10 h-12 bg-white/5 border-white/10 text-white rounded-xl text-sm focus-visible:ring-indigo-500 focus:bg-white/10 transition-all placeholder:text-zinc-600"
                                    placeholder="18 dígitos para tus comisiones"
                                />
                            </div>
                        </div>

                        <Button 
                            type="submit"
                            disabled={isLoading}
                            className="w-full mt-4 bg-indigo-500 hover:bg-indigo-600 text-white font-bold h-12 rounded-xl group/btn transition-all duration-300 shadow-[0_0_20px_rgba(99,102,241,0.2)]"
                        >
                            {isLoading ? "Guardando..." : "Guardar Cambios"}
                            {!isLoading && <ArrowRight className="w-4 h-4 ml-2 group-hover/btn:translate-x-1 transition-transform" />}
                        </Button>
                    </form>
                </div>
            </DialogContent>
        </Dialog>
    )
}
