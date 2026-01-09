"use client"

import { Button } from "@/components/ui/button"
import { Link as LinkIcon, Check } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

interface ReservationLinkButtonProps {
    programId: string
    className?: string
}

export function ReservationLinkButton({ programId, className }: ReservationLinkButtonProps) {
    const [copied, setCopied] = useState(false)

    const handleCopy = () => {
        const url = `${window.location.origin}/book/${programId}`
        navigator.clipboard.writeText(url)
        setCopied(true)
        toast.success("Enlace copiado", {
            description: "Compártelo con tus clientes para que reserven."
        })
        setTimeout(() => setCopied(false), 2000)
    }

    return (
        <Button
            onClick={handleCopy}
            variant="outline"
            className={`gap-2 border-zinc-700 bg-zinc-800 text-white hover:bg-zinc-700 hover:text-white ${className}`}
        >
            {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <LinkIcon className="w-4 h-4 text-zinc-400" />}
            {copied ? "Copiado" : "Copiar Link"}
        </Button>
    )
}
