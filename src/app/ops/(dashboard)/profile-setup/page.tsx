"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { updateUserProfile } from "@/actions/user"
import { Camera, Phone, User, Loader2, UploadCloud } from "lucide-react"
import { toast } from "sonner"
import Image from "next/image"

export default function ProfileSetupPage() {
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(false)
    const [phone, setPhone] = useState("")
    const [name, setName] = useState("")
    const [jobTitle, setJobTitle] = useState("")
    const [photoPreview, setPhotoPreview] = useState<string | null>(null)
    const [photoBase64, setPhotoBase64] = useState<string | null>(null)

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
            setPhotoPreview(result)
            setPhotoBase64(result)
        }
        reader.readAsDataURL(file)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!phone || !photoBase64 || !name || !jobTitle) {
            toast.error("Por favor completa todos los campos")
            return
        }

        setIsLoading(true)
        try {
            const res = await updateUserProfile({
                phone,
                photoUrl: photoBase64,
                name,
                jobTitle
            })

            if (res.success) {
                toast.success("Perfil completado")
                router.push("/ops/tasks")
                router.refresh()
            } else {
                toast.error("Error al guardar perfil")
            }
        } catch (error) {
            toast.error("Error de conexión")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="max-w-md mx-auto mt-8">
            <div className="text-center mb-8">
                <h1 className="text-2xl font-bold text-white mb-2">Configura tu Perfil</h1>
                <p className="text-slate-400 text-sm">Necesitamos tus datos para identificarte en el equipo.</p>
            </div>

            <form onSubmit={handleSubmit} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
                {/* Photo Upload */}
                <div className="flex flex-col items-center gap-4">
                    <div className="relative group cursor-pointer w-32 h-32 rounded-full overflow-hidden bg-slate-800 border-2 border-dashed border-slate-700 hover:border-indigo-500 transition-colors">
                        {photoPreview ? (
                            <Image src={photoPreview} alt="Preview" fill className="object-cover" />
                        ) : (
                            <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500">
                                <UploadCloud className="w-8 h-8 mb-1" />
                                <span className="text-[10px] uppercase font-bold">Subir Foto</span>
                            </div>
                        )}
                        <input
                            type="file"
                            accept="image/*"
                            onChange={handleFileChange}
                            className="absolute inset-0 opacity-0 cursor-pointer"
                        />
                    </div>
                    <p className="text-xs text-slate-500">Toca para cambiar tu foto</p>
                </div>

                {/* Name Input */}
                <div className="space-y-2">
                    <label className="text-xs uppercase font-bold text-slate-500 flex items-center gap-2">
                        <User className="w-4 h-4" /> Nombre Completo
                    </label>
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Ej. Juan Pérez"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white outline-none focus:border-indigo-500 transition-colors"
                        required
                    />
                </div>

                {/* Job Title Input */}
                <div className="space-y-2">
                    <label className="text-xs uppercase font-bold text-slate-500 flex items-center gap-2">
                        <User className="w-4 h-4" /> Puesto / Cargo
                    </label>
                    <input
                        type="text"
                        value={jobTitle}
                        onChange={(e) => setJobTitle(e.target.value)}
                        placeholder="Ej. Gerente de Sucursal"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white outline-none focus:border-indigo-500 transition-colors"
                        required
                    />
                </div>

                {/* Phone Input */}
                <div className="space-y-2">
                    <label className="text-xs uppercase font-bold text-slate-500 flex items-center gap-2">
                        <Phone className="w-4 h-4" /> Teléfono Celular
                    </label>
                    <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="55 1234 5678"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white outline-none focus:border-indigo-500 transition-colors"
                        required
                    />
                </div>

                <button
                    type="submit"
                    disabled={isLoading || !photoBase64 || !phone || !name || !jobTitle}
                    className="w-full py-4 bg-indigo-600 rounded-xl text-white font-bold hover:bg-indigo-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                    {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <User className="w-5 h-5" />}
                    <span>Completar Registro</span>
                </button>
            </form>
        </div>
    )
}
