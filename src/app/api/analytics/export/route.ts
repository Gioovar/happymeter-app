import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
    const { userId } = await auth()
    if (!userId) {
        return new NextResponse('Unauthorized', { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const surveyId = searchParams.get('surveyId')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    if (!startDate || !endDate) {
        return new NextResponse('Missing date range', { status: 400 })
    }

    try {
        // Build query
        const whereClause: any = {
            survey: { userId },
            createdAt: {
                gte: new Date(startDate),
                lte: new Date(new Date(endDate).setHours(23, 59, 59, 999))
            }
        }

        if (surveyId && surveyId !== 'all') {
            whereClause.surveyId = surveyId
        }

        const responses = await prisma.response.findMany({
            where: whereClause,
            include: {
                survey: { select: { title: true } },
                answers: {
                    include: { question: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        })

        // Generate CSV
        const headers = ['Fecha', 'Hora', 'Encuesta', 'Cliente', 'Email', 'Teléfono', 'Respuestas']
        const rows = responses.map(r => {
            const date = r.createdAt.toISOString().split('T')[0]
            const time = r.createdAt.toISOString().split('T')[1].split('.')[0]

            // Format answers as a readable string "Q: A | Q: A"
            const answersSummary = r.answers
                .map(a => `${a.question.text}: ${a.value}`)
                .join(' | ')

            // Escape fields for CSV
            const escape = (field: string | null) => {
                if (!field) return ''
                return `"${field.replace(/"/g, '""')}"`
            }

            return [
                escape(date),
                escape(time),
                escape(r.survey.title),
                escape(r.customerName || 'Anónimo'),
                escape(r.customerEmail),
                escape(r.customerPhone),
                escape(answersSummary)
            ].join(',')
        })

        const csvContent = [headers.join(','), ...rows].join('\n')

        return new NextResponse(csvContent, {
            headers: {
                'Content-Type': 'text/csv; charset=utf-8',
                'Content-Disposition': `attachment; filename="reporte_happymeter_${startDate}_${endDate}.csv"`,
            }
        })

    } catch (error) {
        console.error('Export error:', error)
        return new NextResponse('Internal Server Error', { status: 500 })
    }
}
