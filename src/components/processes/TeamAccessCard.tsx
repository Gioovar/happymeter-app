'use client'

import { useState, useEffect } from 'react'
import { Copy, Check, Smartphone, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

export default function TeamAccessCard() {
    const [copied, setCopied] = useState(false)
    const [link, setLink] = useState('')

    useEffect(() => {
        // Construct the full URL on the client to ensure correct origin
        setLink(`${window.location.origin}/ops/login`)
    }, [])

    const handleCopy = () => {
        navigator.clipboard.writeText(link)
        setCopied(true)
        toast.success('Enlace copiado al portapapeles')
        setTimeout(() => setCopied(false), 2000)
    }

    return (
        <div className="bg-[#111] border border-white/5 p-6 rounded-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl -mr-16 -mt-16 transition-opacity group-hover:opacity-100" />

            <div className="flex justify-between items-start mb-4">
                <div className="w-10 h-10 rounded-lg bg-indigo-500/20 flex items-center justify-center">
                    <Smartphone className="w-5 h-5 text-indigo-400" />
                </div>
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-gray-400 hover:text-white hover:bg-white/5"
                    onClick={() => window.open(link, '_blank')}
                    title="Abrir enlace"
                >
                    <ExternalLink className="w-4 h-4" />
                </Button>
            </div>

            <p className="text-gray-400 text-sm font-medium">App Operativa</p>
            <h3 className="text-xl font-bold text-white mt-1 mb-1">Portal de Staff</h3>

            <p className="text-xs text-slate-500 mb-4 h-8 overflow-hidden line-clamp-2">
                Comparte este enlace con tu equipo para acceso móvil.
            </p>

            <div className="flex items-center gap-2 bg-black/20 rounded-lg p-1.5 border border-white/5">
                <code className="text-[10px] text-gray-400 flex-1 truncate px-2 font-mono">
                    {link || 'Cargando enlace...'}
                </code>
                <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 hover:bg-white/10"
                    onClick={handleCopy}
                >
                    {copied ? (
                        <Check className="w-3 h-3 text-green-400" />
                    ) : (
                        <Copy className="w-3 h-3 text-gray-400" />
                    )}
                </Button>
            </div>
        </div>
    )
}
