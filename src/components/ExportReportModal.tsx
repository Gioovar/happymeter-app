'use client'

import { useState } from 'react'
import { X, Download, Calendar } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface ExportReportModalProps {
    isOpen: boolean
    onClose: () => void
    surveys: { id: string, title: string }[]
}

export default function ExportReportModal({ isOpen, onClose, surveys }: ExportReportModalProps) {
    const [startDate, setStartDate] = useState('')
    const [endDate, setEndDate] = useState('')
    const [selectedSurvey, setSelectedSurvey] = useState('all')
    const [isExporting, setIsExporting] = useState(false)

    const handleExport = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsExporting(true)

        try {
            const params = new URLSearchParams({
                surveyId: selectedSurvey,
                startDate: startDate || new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString(),
                endDate: endDate || new Date().toISOString()
            })

            const response = await fetch(`/api/analytics/export?${params.toString()}`)

            if (!response.ok) throw new Error('Export failed')

            const blob = await response.blob()
            const url = window.URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `reporte-happymeter-${new Date().toISOString().split('T')[0]}.csv`
            document.body.appendChild(a)
            a.click()
            window.URL.revokeObjectURL(url)
            onClose()
        } catch (error) {
            console.error('Export error:', error)
            alert('Error al descargar el reporte')
        } finally {
            setIsExporting(false)
        }
    }

    if (!isOpen) return null

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={onClose}>
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    onClick={(e) => e.stopPropagation()}
                    className="bg-[#1a1a1a] border border-white/10 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl"
                >
                    <div className="p-6 border-b border-white/10 flex justify-between items-center">
                        <h3 className="text-xl font-bold text-white flex items-center gap-2">
                            <Download className="w-5 h-5 text-violet-400" />
                            Exportar Reporte
                        </h3>
                        <button onClick={onClose} className="text-gray-400 hover:text-white transition">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <form onSubmit={handleExport} className="p-6 space-y-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-300">Seleccionar Encuesta</label>
                            <select
                                value={selectedSurvey}
                                onChange={(e) => setSelectedSurvey(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-violet-500 transition"
                            >
                                <option value="all">Todas las Encuestas</option>
                                {surveys.map(s => (
                                    <option key={s.id} value={s.id}>{s.title}</option>
                                ))}
                            </select>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-300">Fecha Inicio</label>
                                <div className="relative">
                                    <input
                                        type="date"
                                        value={startDate}
                                        onChange={(e) => setStartDate(e.target.value)}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-violet-500 transition [color-scheme:dark]"
                                        required
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-300">Fecha Fin</label>
                                <div className="relative">
                                    <input
                                        type="date"
                                        value={endDate}
                                        onChange={(e) => setEndDate(e.target.value)}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-violet-500 transition [color-scheme:dark]"
                                        required
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="pt-2">
                            <button
                                type="submit"
                                disabled={isExporting}
                                className="w-full bg-violet-600 hover:bg-violet-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl transition flex items-center justify-center gap-2"
                            >
                                {isExporting ? 'Generando...' : 'Descargar CSV'}
                                {!isExporting && <Download className="w-5 h-5" />}
                            </button>
                        </div>
                    </form>
                </motion.div>
            </div>
        </AnimatePresence>
    )
}
