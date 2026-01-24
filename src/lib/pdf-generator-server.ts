
import jsPDF from 'jspdf'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

export const generateDiplomaBuffer = (
    winnerName: string,
    badgeTitle: string,
    month: string,
    year: number
): Buffer => {
    const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
    })

    // Colors
    const GOLD = '#F59E0B'
    const DARK = '#111827'
    const GRAY = '#4B5563'

    // Border
    doc.setDrawColor(GOLD)
    doc.setLineWidth(2)
    doc.rect(10, 10, 277, 190)

    doc.setLineWidth(0.5)
    doc.rect(15, 15, 267, 180)

    // Header
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(40)
    doc.setTextColor(DARK)
    doc.text('DIPLOMA DE EXCELENCIA', 148.5, 50, { align: 'center' })

    doc.setFontSize(20)
    doc.setTextColor(GRAY)
    doc.text('Se otorga el presente reconocimiento a:', 148.5, 70, { align: 'center' })

    // Winner Name
    doc.setFontSize(50)
    doc.setTextColor(GOLD)
    doc.text(winnerName.toUpperCase(), 148.5, 100, { align: 'center' })

    // Badge Title
    doc.setFontSize(25)
    doc.setTextColor(DARK)
    doc.text(`Por su destacado desempeño como`, 148.5, 125, { align: 'center' })
    doc.text(`"${badgeTitle.toUpperCase()}"`, 148.5, 138, { align: 'center' })

    // Date
    doc.setFontSize(14)
    doc.setTextColor(GRAY)
    doc.text(`Otorgado este día ${format(new Date(), "d 'de' MMMM, yyyy", { locale: es })}`, 148.5, 160, { align: 'center' })
    doc.text(`correspondiente al mes de ${month} ${year}`, 148.5, 168, { align: 'center' })

    // Footer / Decoration
    doc.setDrawColor(GOLD)
    doc.setLineWidth(1)
    doc.line(80, 180, 217, 180)
    doc.setFontSize(10)
    doc.text('HAPPYMETER STAFF RECOGNITION', 148.5, 185, { align: 'center' })

    return Buffer.from(doc.output('arraybuffer'))
}
