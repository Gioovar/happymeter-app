'use client'

import React, { useState } from 'react'
import { jsPDF } from 'jspdf'
import { Download, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface PayoutReceiptButtonProps {
    payout: {
        id: string
        amount: number
        status: string
        createdAt: Date | string
        notes?: string // We might need to fetch the notification or store msg on Payout to be precise, but for now we format generic.
    }
    creatorName: string
    variant?: 'icon' | 'full'
}

export default function PayoutReceiptButton({ payout, creatorName, variant = 'icon' }: PayoutReceiptButtonProps) {
    const [generating, setGenerating] = useState(false)

    const generatePDF = async () => {
        setGenerating(true)
        try {
            const doc = new jsPDF()

            // Colors
            const primaryColor = '#7c3aed' // Violet-600

            // Header Background
            doc.setFillColor(245, 243, 255) // violet-50
            doc.rect(0, 0, 210, 40, 'F')

            // Logo / Brand
            doc.setFontSize(22)
            doc.setTextColor(primaryColor)
            doc.setFont('helvetica', 'bold')
            doc.text('HappyMeter', 15, 25)

            doc.setFontSize(10)
            doc.setTextColor(100)
            doc.setFont('helvetica', 'normal')
            doc.text('Comprobante de Pago Oficial', 200, 25, { align: 'right' })

            // Title
            doc.setFontSize(18)
            doc.setTextColor(0)
            doc.text('Detalle de Transacción', 15, 60)

            // Info Grid
            doc.setFontSize(11)
            doc.setTextColor(100)

            // Left Column
            doc.text('ID de Transacción:', 15, 80)
            doc.text('Fecha:', 15, 90)
            doc.text('Beneficiario:', 15, 100)
            doc.text('Estado:', 15, 110)

            // Right Column Values
            doc.setTextColor(0)
            doc.setFont('helvetica', 'bold')
            doc.text(payout.id.slice(0, 8).toUpperCase(), 60, 80)
            doc.text(new Date(payout.createdAt).toLocaleDateString() + ' ' + new Date(payout.createdAt).toLocaleTimeString(), 60, 90)
            doc.text(creatorName, 60, 100)
            doc.text(payout.status === 'COMPLETED' || payout.status.includes('STRIPE') ? 'PAGADO' : payout.status, 60, 110)

            // Divider
            doc.setDrawColor(230)
            doc.line(15, 125, 195, 125)

            // Amount Section
            doc.setFontSize(14)
            doc.setTextColor(100)
            doc.text('Monto Total', 15, 140)

            doc.setFontSize(24)
            doc.setTextColor(primaryColor)
            doc.text(`$${payout.amount.toFixed(2)} USD`, 195, 140, { align: 'right' })

            // Notes / Deductions Context
            // Since we don't strictly have the "reason" column on Payout, 
            // we imply it from the context or show a generic disclaimer if no message available.
            doc.setFontSize(12)
            doc.setTextColor(0)
            doc.text('Detalles Adicionales / Notas', 15, 160)

            doc.setFontSize(10)
            doc.setTextColor(80)
            const noteText = "Este pago corresponde al saldo acumulado disponible en su cuenta de creador HappyMeter. Cualquier deducción o ajuste aplicado (penalizaciones) se ha reflejado en el saldo previo a este retiro."
            const splitNotes = doc.splitTextToSize(noteText, 180)
            doc.text(splitNotes, 15, 170)

            // Footer
            doc.setFontSize(9)
            doc.setTextColor(150)
            doc.text('Este documento es un comprobante digital generado automáticamente por HappyMeter Inc.', 105, 280, { align: 'center' })
            doc.text(`Generado el: ${new Date().toLocaleString()}`, 105, 285, { align: 'center' })

            doc.save(`recibo_${payout.id.slice(0, 8)}.pdf`)
            toast.success('Recibo descargado')
        } catch (error) {
            console.error(error)
            toast.error('Error generando PDF')
        } finally {
            setGenerating(false)
        }
    }

    if (variant === 'full') {
        return (
            <button
                onClick={generatePDF}
                disabled={generating}
                className="flex items-center gap-2 px-3 py-1.5 bg-violet-600 hover:bg-violet-500 text-white rounded-lg text-xs font-bold transition"
            >
                {generating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Download className="w-3 h-3" />}
                Descargar Recibo
            </button>
        )
    }

    return (
        <button
            onClick={generatePDF}
            disabled={generating}
            className="p-1.5 hover:bg-white/10 text-gray-400 hover:text-white rounded-full transition"
            title="Descargar Comprobante"
        >
            {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
        </button>
    )
}
