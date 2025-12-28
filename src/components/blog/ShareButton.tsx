'use client'

import { useState } from 'react'
import { Share2, Check, Link as LinkIcon } from 'lucide-react'

interface ShareButtonProps {
    title: string
    text: string
}

export default function ShareButton({ title, text }: ShareButtonProps) {
    const [copied, setCopied] = useState(false)

    const handleShare = async () => {
        const url = window.location.href

        // Try Native Share API (Mobile)
        if (navigator.share) {
            try {
                await navigator.share({
                    title,
                    text,
                    url
                })
                return
            } catch (error) {
                console.log('Error sharing:', error)
            }
        }

        // Fallback: Copy to Clipboard
        try {
            await navigator.clipboard.writeText(url)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        } catch (err) {
            console.error('Failed to copy', err)
        }
    }

    return (
        <button
            onClick={handleShare}
            className="text-gray-400 hover:text-white transition flex items-center gap-2"
            title="Compartir artículo"
        >
            {copied ? (
                <>
                    <Check className="w-4 h-4 text-green-400" />
                    <span className="text-xs text-green-400 font-medium hidden md:block">Copiado</span>
                </>
            ) : (
                <Share2 className="w-4 h-4" />
            )}
        </button>
    )
}
