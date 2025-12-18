
import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
    const { userId } = await auth()
    if (!userId) {
        return new NextResponse('Unauthorized', { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const surveyId = searchParams.get('surveyId')
    const segment = searchParams.get('segment') // 'vip', 'neutral', 'angry', 'promo', 'all'

    if (!surveyId) {
        return new NextResponse('Survey ID is required', { status: 400 })
    }

    try {
        // Build filter logic
        const whereClause: any = {
            survey: {
                userId: userId // Ensure user owns the survey
            },
            customerPhone: {
                not: null // Ensure phone exists
            }
        }

        if (surveyId !== 'all') {
            whereClause.surveyId = surveyId
        }

        // Fetch responses with their answers to calculate logic
        const responses = await prisma.response.findMany({
            where: whereClause,
            include: {
                answers: {
                    include: {
                        question: true
                    }
                },
                survey: true
            }
        })

        // Filter by segment
        const filteredResponses = responses.filter((r) => {
            // Find rating answer
            const ratingAnswer = r.answers.find((a) => a.question.type === 'RATING' || a.question.type === 'EMOJI')
            const ratingValue = ratingAnswer ? parseInt(ratingAnswer.value) : 0

            switch (segment) {
                case 'vip': // 5 stars
                    return ratingValue >= 5
                case 'neutral': // 3-4 stars
                    return ratingValue >= 3 && ratingValue < 5
                case 'angry': // 1-2 stars
                    return ratingValue > 0 && ratingValue < 3
                case 'promo': // All valid
                case 'all':
                    return true
                default:
                    return true
            }
        })

        if (filteredResponses.length === 0) {
            // Handle empty result gracefully
            return new NextResponse('No valid contacts found for this segment.', { status: 404 })
        }

        // Generate VCF Content
        let vcfContent = ''
        filteredResponses.forEach((r, index) => {
            if (!r.customerPhone) return

            const name = r.customerName || `Cliente ${segment?.toUpperCase()} ${index + 1}`
            const phone = r.customerPhone

            // Basic VCF 3.0 Structure
            vcfContent += `BEGIN:VCARD\n`
            vcfContent += `VERSION:3.0\n`
            vcfContent += `FN:${name} - ${r.survey.title}\n`
            vcfContent += `TEL;TYPE=CELL:${phone}\n`
            vcfContent += `NOTE:Cliente segmentado por HappyMeter. Segmento: ${segment}\n`
            vcfContent += `END:VCARD\n`
        })

        // Return file
        const filename = `happymeter_${segment}_contacts.vcf`

        return new NextResponse(vcfContent, {
            headers: {
                'Content-Type': 'text/vcard; charset=utf-8',
                'Content-Disposition': `attachment; filename="${filename}"`,
            },
        })

    } catch (error) {
        console.error('Export VCF error:', error)
        return new NextResponse('Internal Server Error', { status: 500 })
    }
}
