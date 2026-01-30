'use client'

import { useState, useRef } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Pencil, Loader2, Upload, Trash2, ImageIcon } from 'lucide-react'
import { updateChain } from '@/actions/chain'
import { toast } from 'sonner'
import Image from 'next/image'
import { compressImage } from '@/lib/image-compression'

interface EditChainModalProps {
    chainId: string
    currentName: string
    currentLogo?: string | null
}

export default function EditChainModal({ chainId, currentName, currentLogo }: EditChainModalProps) {
    const [open, setOpen] = useState(false)
    const [name, setName] = useState(currentName)
    const [logoUrl, setLogoUrl] = useState(currentLogo || '')
    const [isLoading, setIsLoading] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        try {
            const compressed = await compressImage(file)
            setLogoUrl(compressed)
            toast.success('Imagen procesada')
        } catch (error) {
            toast.error('Error al procesar imagen')
        }
    }

    const handleUpdate = async () => {
        if (!name.trim()) return

        setIsLoading(true)
        try {
            const res = await updateChain(chainId, { name, logoUrl })
            if (res.success) {
                toast.success('Marca actualizada correctamente')
                setOpen(false)
            } else {
                toast.error('Error al actualizar: ' + res.error)
            }
        } catch (error) {
            toast.error('Error desconocido')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <button className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 transition-colors group">
                    <Pencil className="w-3.5 h-3.5 text-gray-400 group-hover:text-white" />
                </button>
            </DialogTrigger>
            <DialogContent className="bg-[#111] border-white/10 text-white sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Editar Marca Corporativa</DialogTitle>
                </DialogHeader>
                <div className="space-y-6 py-4">
                    <div className="space-y-2 flex flex-col items-center">
                        <Label>Logo de la Marca</Label>
                        <div
                            onClick={() => fileInputRef.current?.click()}
                            className="relative w-24 h-24 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden group cursor-pointer hover:border-violet-500/50 transition-colors"
                        >
                            {logoUrl ? (
                                <>
                                    <Image
                                        src={logoUrl}
                                        alt="Logo"
                                        fill
                                        className="object-cover"
                                    />
                                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                setLogoUrl('')
                                            }}
                                            className="p-1.5 rounded-full bg-red-500/20 text-red-400 hover:bg-red-500 hover:text-white transition"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                        <div className="p-1.5 rounded-full bg-white/20 text-white">
                                            <Pencil className="w-4 h-4" />
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <div className="flex flex-col items-center gap-2 text-gray-500 group-hover:text-violet-400 transition-colors">
                                    <Upload className="w-6 h-6" />
                                    <span className="text-[10px] font-medium">Subir</span>
                                </div>
                            )}
                        </div>
                        <input
                            type="file"
                            ref={fileInputRef}
                            className="hidden"
                            accept="image/*"
                            onChange={handleFileSelect}
                        />
                        <p className="text-xs text-gray-500">Click para cambiar imagen</p>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="name">Nombre de la Marca</Label>
                        <Input
                            id="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="bg-white/5 border-white/10 focus:ring-violet-500"
                        />
                    </div>
                </div>
                <div className="flex justify-end gap-2">
                    <Button variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button>
                    <Button
                        onClick={handleUpdate}
                        disabled={isLoading || !name.trim()}
                        className="bg-violet-600 hover:bg-violet-700"
                    >
                        {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Guardar Cambios'}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}
