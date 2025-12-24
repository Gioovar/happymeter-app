'use client'

import { useState } from 'react'
import { Share2, Copy, Loader2, Download } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import { getReportShareLink } from '@/actions/analytics'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'
import { format } from 'date-fns'

interface ShareButtonProps {
    surveyId: string
    surveyTitle: string
    publicToken?: string
    className?: string
    variant?: 'header' | 'footer'
}

export default function ShareButton({ surveyId, surveyTitle, publicToken, className, variant = 'header' }: ShareButtonProps) {
    const [showMenu, setShowMenu] = useState(false)
    const [shareLink, setShareLink] = useState<string>("")
    const [isLoading, setIsLoading] = useState(false)

    const toggleMenu = async () => {
        if (!showMenu) {
            let link = window.location.href
            if (!publicToken) {
                setIsLoading(true)
                try {
                    link = await getReportShareLink(surveyId)
                } catch (e) {
                    toast.error("Error generando enlace")
                    setIsLoading(false)
                    return
                }
                setIsLoading(false)
            }
            setShareLink(link)
        }
        setShowMenu(!showMenu)
    }

    const handleDownloadPDF = async () => {
        // Target elements prepared for printing (hidden in view but existing in DOM)
        // Or specific print-page elements if they exist
        const pages = document.querySelectorAll('.print-page')

        if (pages.length === 0) {
            toast.error("No se encontró contenido para generar el PDF")
            return
        }

        try {
            toast.info("Generando PDF (esto puede tardar unos segundos)...")
            setShowMenu(false)

            await new Promise(resolve => setTimeout(resolve, 500))

            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a4'
            })

            for (let i = 0; i < pages.length; i++) {
                const page = pages[i] as HTMLElement

                if (i > 0) {
                    pdf.addPage()
                }

                const canvas = await html2canvas(page, {
                    scale: 2,
                    backgroundColor: '#ffffff',
                    logging: false,
                    useCORS: true
                })

                const imgData = canvas.toDataURL('image/png')
                const imgWidth = 210
                const imgHeight = (canvas.height * imgWidth) / canvas.width

                pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight)
            }

            pdf.save(`HappyMeter_Reporte_${format(new Date(), 'yyyy-MM-dd')}.pdf`)
            toast.success("PDF descargado con éxito")

        } catch (error) {
            console.error("PDF Error:", error)
            toast.error("Error al generar el PDF")
        }
    }

    const shareToWhatsApp = () => {
        // Append ?action=download to force PDF download on open
        // Check if shareLink already has query params
        const separator = shareLink.includes('?') ? '&' : '?'
        const finalLink = `${shareLink}${separator}action=download`

        const text = `¡Hola! Aquí tienes tu Reporte PDF de HappyMeter para ${surveyTitle}: ${finalLink}`
        window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank')
        setShowMenu(false)
    }

    const copyToClipboard = async () => {
        // Append ?action=download to force PDF download on open
        const separator = shareLink.includes('?') ? '&' : '?'
        const finalLink = `${shareLink}${separator}action=download`

        await navigator.clipboard.writeText(finalLink)
        toast.success("Enlace PDF copiado")
        setShowMenu(false)
    }

    // Default Styles
    const baseStyles = "flex items-center gap-2 font-bold rounded-full transition-all shadow-lg"
    const variantStyles = variant === 'header'
        ? "px-5 py-2 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white text-sm hover:brightness-110 shadow-violet-500/20"
        : "px-6 py-3 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white hover:brightness-110 shadow-violet-500/20 justify-center" // Footer matches header style

    return (
        <div className="relative z-[50]">
            {/* Backdrop to close */}
            {showMenu && (
                <div className="fixed inset-0 z-[40]" onClick={() => setShowMenu(false)} />
            )}

            <button
                onClick={toggleMenu}
                disabled={isLoading}
                className={`${baseStyles} ${variantStyles} ${className || ''} ${isLoading ? 'opacity-80 cursor-wait' : ''}`}
            >
                {isLoading ? (
                    <Loader2 className={`animate-spin ${variant === 'header' ? "w-4 h-4" : "w-5 h-5"}`} />
                ) : (
                    <Share2 className={variant === 'header' ? "w-4 h-4" : "w-5 h-5"} />
                )}
                {isLoading ? 'Generando...' : 'Compartir'}
            </button>

            {/* Menu Popover */}
            <AnimatePresence>
                {showMenu && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 10 }}
                        className={`absolute ${variant === 'header' ? 'left-0' : 'bottom-full left-1/2 -translate-x-1/2 mb-2'} mt-3 w-64 bg-[#1a1d26] rounded-2xl shadow-2xl border border-white/10 overflow-hidden flex flex-col p-2 z-[60] backdrop-blur-xl`}
                    >
                        <div className="px-3 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-white/5 mb-1">
                            Compartir reporte
                        </div>

                        <button
                            onClick={shareToWhatsApp}
                            className="flex items-center gap-3 px-3 py-3 hover:bg-white/5 rounded-xl transition-all text-left group border border-transparent hover:border-white/5"
                        >
                            <div className="w-10 h-10 rounded-full bg-[#25D366]/20 flex items-center justify-center group-hover:bg-[#25D366] transition-all shadow-lg shadow-[#25D366]/10 group-hover:shadow-[#25D366]/30">
                                <svg viewBox="0 0 24 24" className="w-5 h-5 fill-[#25D366] group-hover:fill-white transition-colors" xmlns="http://www.w3.org/2000/svg"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.008-.57-.008-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" /></svg>
                            </div>
                            <div>
                                <div className="font-bold text-white text-sm group-hover:text-[#25D366] transition-colors">WhatsApp</div>
                                <div className="text-[11px] text-slate-400 group-hover:text-slate-300">Enviar mensaje directo</div>
                            </div>
                        </button>

                        <button
                            onClick={copyToClipboard}
                            className="flex items-center gap-3 px-3 py-3 hover:bg-white/5 rounded-xl transition-all text-left group border border-transparent hover:border-white/5"
                        >
                            <div className="w-10 h-10 rounded-full bg-violet-500/20 flex items-center justify-center group-hover:bg-violet-600 transition-all shadow-lg shadow-violet-500/10 group-hover:shadow-violet-500/30">
                                <Copy className="w-5 h-5 text-violet-400 group-hover:text-white transition-colors" />
                            </div>
                            <div>
                                <div className="font-bold text-white text-sm group-hover:text-violet-400 transition-colors">Copiar Enlace</div>
                                <div className="text-[11px] text-slate-400 group-hover:text-slate-300">Pegar en cualquier lado</div>
                            </div>
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
