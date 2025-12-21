'use client'

import { useState, useEffect } from 'react'
import { X, Copy, Check, Sparkles, RefreshCw } from 'lucide-react'
import { generateCampaignCopy } from '@/actions/content-generator'

interface CopyGeneratorModalProps {
    isOpen: boolean
    onClose: () => void
    segment: string
    platform: 'meta' | 'whatsapp'
    surveyTitle?: string
}

export default function CopyGeneratorModal({ isOpen, onClose, segment, platform, surveyTitle = 'General' }: CopyGeneratorModalProps) {
    const [messages, setMessages] = useState<string[]>([])
    const [loading, setLoading] = useState(false)
    const [copiedIndex, setCopiedIndex] = useState<number | null>(null)

    useEffect(() => {
        if (isOpen && messages.length === 0) {
            handleGenerate()
        }
    }, [isOpen])

    const handleGenerate = async () => {
        setLoading(true)
        const msgs = await generateCampaignCopy(segment, platform, surveyTitle)
        setMessages(msgs)
        setLoading(false)
    }

    const copyToClipboard = (text: string, index: number) => {
        navigator.clipboard.writeText(text)
        setCopiedIndex(index)
        setTimeout(() => setCopiedIndex(null), 2000)
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="relative w-full max-w-2xl bg-[#0f1115] border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-white/5 bg-gradient-to-r from-violet-500/10 to-transparent">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-violet-500/20 rounded-lg">
                            <Sparkles className="w-5 h-5 text-violet-400" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-white">Generador de Mensajes IA</h3>
                            <p className="text-xs text-gray-400">
                                Segmento: <span className="text-violet-300 font-medium capitalize">{segment}</span> • {platform === 'meta' ? 'Meta Ads' : 'WhatsApp'}
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition text-gray-400 hover:text-white">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto custom-scrollbar">
                    {loading ? (
                        <div className="space-y-4 py-8">
                            <div className="flex justify-center">
                                <div className="w-12 h-12 border-4 border-violet-500/30 border-t-violet-500 rounded-full animate-spin" />
                            </div>
                            <p className="text-center text-sm text-gray-400 animate-pulse">
                                Escribiendo opciones persuasivas para ti...
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {messages.map((msg, idx) => (
                                <div key={idx} className="group relative bg-white/5 hover:bg-white/10 border border-white/5 hover:border-violet-500/30 rounded-xl p-5 transition-all duration-300">
                                    <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={() => copyToClipboard(msg, idx)}
                                            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition ${copiedIndex === idx
                                                    ? 'bg-green-500/20 text-green-400'
                                                    : 'bg-violet-600 hover:bg-violet-500 text-white shadow-lg shadow-violet-500/20'
                                                }`}
                                        >
                                            {copiedIndex === idx ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                                            {copiedIndex === idx ? 'Copiado' : 'Copiar'}
                                        </button>
                                    </div>
                                    <h4 className="text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">Opción {idx + 1}</h4>
                                    <p className="text-gray-200 text-sm leading-relaxed whitespace-pre-wrap">
                                        {msg}
                                    </p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-white/5 bg-[#121212] flex justify-between items-center">
                    <p className="text-xs text-gray-500">
                        IA Gemini • Revisa el texto antes de enviar.
                    </p>
                    <button
                        onClick={handleGenerate}
                        disabled={loading}
                        className="text-xs flex items-center gap-2 text-violet-400 hover:text-violet-300 transition disabled:opacity-50"
                    >
                        <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                        Regenerar Opciones
                    </button>
                </div>
            </div>
        </div>
    )
}
