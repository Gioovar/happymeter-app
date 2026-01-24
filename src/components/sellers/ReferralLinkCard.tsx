'use client'

import { useState } from 'react'
import { Link2, Copy, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

export default function ReferralLinkCard({ referralCode }: { referralCode: string | null }) {
    const [copied, setCopied] = useState(false)

    if (!referralCode) return null

    // Determine base URL (default to production if verifying, but flexible)
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://www.happymeters.com'
    const referralLink = `${baseUrl}?ref=${referralCode}`

    const handleCopy = () => {
        navigator.clipboard.writeText(referralLink)
        setCopied(true)
        toast.success('Enlace copiado al portapapeles')
        setTimeout(() => setCopied(false), 2000)
    }

    return (
        <div className="p-6 bg-gradient-to-br from-violet-900/50 to-fuchsia-900/50 border border-violet-500/30 rounded-2xl text-white relative overflow-hidden group">
            <div className="absolute inset-0 bg-grid-white/[0.05] bg-[size:16px_16px]" />
            <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="space-y-1">
                    <h3 className="text-lg font-bold flex items-center gap-2 text-white">
                        <Link2 className="w-5 h-5 text-violet-400" />
                        Tu Enlace de Atribución Directa
                    </h3>
                    <p className="text-sm text-gray-300 max-w-xl">
                        Comparte este enlace con tus clientes potenciales. Si se registran usándolo, la venta se te atribuirá automáticamente a ti, sin importar su ubicación geográfica.
                    </p>
                </div>

                <div className="flex items-center gap-2 bg-black/40 p-1.5 rounded-xl border border-white/10 w-full md:w-auto">
                    <code className="px-3 py-1.5 text-sm font-mono text-violet-200 truncate max-w-[200px] md:max-w-[300px]">
                        {referralLink}
                    </code>
                    <button
                        onClick={handleCopy}
                        className={cn(
                            "p-2 rounded-lg transition-all",
                            copied
                                ? "bg-emerald-500/20 text-emerald-400"
                                : "bg-white/10 hover:bg-white/20 text-white"
                        )}
                    >
                        {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </button>
                </div>
            </div>
        </div>
    )
}
