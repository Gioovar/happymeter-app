
import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
    console.time('Analytics Total')
    try {
        console.time('Auth')
        const { userId } = await auth()
        console.timeEnd('Auth')
        if (!userId) {
            return new NextResponse("Unauthorized", { status: 401 })
        }

        const { searchParams } = new URL(request.url)
        const surveyId = searchParams.get('surveyId')
        const startDateParam = searchParams.get('startDate')
        const endDateParam = searchParams.get('endDate')

        console.time('DB Surveys')
        const allSurveys = await prisma.survey.findMany({
            where: { userId },
            select: { id: true, title: true }
        })
        console.timeEnd('DB Surveys')

        // Base filter
        const whereClause: any = { survey: { userId } }
        if (surveyId && surveyId !== 'all') {
            whereClause.surveyId = surveyId
        }

        // Date Filter Logic
        if (startDateParam && endDateParam) {
            whereClause.createdAt = {
                gte: new Date(startDateParam),
                lte: new Date(endDateParam)
            }
        }

        // 1. Total Count (Fast)
        console.time('DB Count')
        const totalResponses = await prisma.response.count({ where: whereClause })
        console.timeEnd('DB Count')

        // 2. Bulk Stats Data
        // If date filter is provided, use it. Otherwise default to last 30 days for bulk stats.
        console.time('DB Bulk Stats')

        let dateFilterForBulk: any = {}
        if (startDateParam && endDateParam) {
            // Already added to whereClause above, so just rely on whereClause
        } else {
            // Default: Last 30 days
            const thirtyDaysAgo = new Date()
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
            dateFilterForBulk = { createdAt: { gte: thirtyDaysAgo } }
        }

        const bulkStatsResponses = await prisma.response.findMany({
            where: {
                ...whereClause, // count filters
                ...dateFilterForBulk // ensure default is applied if no specific dates
            },
            // ... select ...
            select: {
                id: true,
                createdAt: true,
                surveyId: true,
                customerSource: true, // Add to selection
                answers: {
                    where: {
                        question: {
                            type: { in: ['RATING', 'EMOJI', 'TEXT'] }
                        }
                    },
                    select: {
                        value: true,
                        questionId: true,
                        question: { select: { type: true, text: true } }
                    }
                }
            }
        })
        console.timeEnd('DB Bulk Stats')

        // 3. Recent Feedback (Full Details, limit 5)
        console.time('DB Recent')
        const recentRaw = await prisma.response.findMany({
            where: whereClause,
            take: 5,
            orderBy: { createdAt: 'desc' },
            include: {
                survey: { select: { title: true, questions: true } },
                answers: { include: { question: true } }
            }
        })
        console.timeEnd('DB Recent')

        // 4. Worst Feedback (Find worst IDs first)
        // Strategy: Fetch last 200 responses' ratings ONLY to find the candidates.
        console.time('DB Worst/Best Candidates')
        const potentialCandidates = await prisma.response.findMany({
            where: whereClause,
            take: 200,
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                createdAt: true,
                answers: {
                    where: {
                        question: { type: { in: ['RATING', 'EMOJI'] } }
                    },
                    select: { value: true }
                }
            }
        })

        const worstIds = potentialCandidates
            .map(r => {
                const rating = r.answers.find(a => true)?.value
                const val = rating ? parseInt(rating) : 0
                return { id: r.id, val, date: r.createdAt }
            })
            .filter(item => item.val > 0 && item.val <= 3)
            .sort((a, b) => { // Lowest first
                if (a.val !== b.val) return a.val - b.val
                return b.date.getTime() - a.date.getTime() // Recent first if tie
            })
            .slice(0, 3)
            .map(x => x.id)

        const bestIds = potentialCandidates
            .map(r => {
                const rating = r.answers.find(a => true)?.value
                const val = rating ? parseInt(rating) : 0
                return { id: r.id, val, date: r.createdAt }
            })
            .filter(item => item.val >= 4)
            .sort((a, b) => { // Highest first
                if (a.val !== b.val) return b.val - a.val
                return b.date.getTime() - a.date.getTime()
            })
            .slice(0, 3)
            .map(x => x.id)

        console.timeEnd('DB Worst/Best Candidates')

        console.time('DB Worst/Best Full')
        let worstRaw: any[] = []
        let bestRaw: any[] = []

        if (worstIds.length > 0) {
            worstRaw = await prisma.response.findMany({
                where: { id: { in: worstIds } },
                include: {
                    survey: { select: { title: true, questions: true } },
                    answers: { include: { question: true } }
                }
            })
            worstRaw.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
        }

        if (bestIds.length > 0) {
            bestRaw = await prisma.response.findMany({
                where: { id: { in: bestIds } },
                include: {
                    survey: { select: { title: true, questions: true } },
                    answers: { include: { question: true } }
                }
            })
            bestRaw.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
        }
        console.timeEnd('DB Worst/Best Full')


        // 5. Previous Period Stats (Comparison)
        console.time('DB Previous Stats')
        const previousPeriodStart = new Date()
        previousPeriodStart.setDate(previousPeriodStart.getDate() - 60)
        const previousPeriodEnd = new Date()
        previousPeriodEnd.setDate(previousPeriodEnd.getDate() - 30)

        const prevStatsResponses = await prisma.response.findMany({
            where: {
                ...whereClause,
                createdAt: {
                    gte: previousPeriodStart,
                    lt: previousPeriodEnd
                }
            },
            select: {
                answers: {
                    where: { question: { type: { in: ['RATING', 'EMOJI'] } } },
                    select: { value: true }
                }
            }
        })
        console.timeEnd('DB Previous Stats')


        console.time('Processing Stats')
        // Processing Logic (JS) using the lightweight `bulkStatsResponses`

        let totalRatingSum = 0
        let totalRatingCount = 0
        let promoters = 0
        let detractors = 0
        let sentimentStats = { positive: 0, neutral: 0, negative: 0 }
        const negativeKeywords: Record<string, number> = {}
        const keywordsList = [
            // Service & Staff
            'lento', 'tarda', 'espera', 'tiempo', 'hora', 'minutos',
            'mesero', 'camarero', 'personal', 'atención', 'atencion', 'actitud', 'grocero', 'grosero', 'maleducado',
            'gerente', 'encargado', 'dueño', 'administrador',
            'servicio', 'pésimo', 'pesimo', 'malo', 'terrible', 'horrible',

            // Food & Drink
            'comida', 'alimento', 'sabor', 'insípido', 'feo', 'asco', 'crudo', 'quemado', 'salado', 'fría', 'fria',
            'bebida', 'refresco', 'cerveza', 'alcohol', 'trago', 'agua', 'hielo',
            'carne', 'pollo', 'pescado', 'pizza', 'hamburguesa', 'taco',

            // Environment & Facilities
            'sucio', 'limpieza', 'olor', 'mosca', 'cucaracha', 'rat', 'baño', 'wc', 'sanitario',
            'ruido', 'música', 'musica', 'volumen', 'ambiente',
            'calor', 'frío', 'aire', 'acondicionado',
            'mesa', 'silla', 'incomod',
            'estacionamiento', 'valet', 'lugar',

            // Price
            'caro', 'precio', 'cuenta', 'propina', 'cobro', 'robo', 'costoso'
        ]

        const responsesByDate: Record<string, number> = {}
        const satisfactionByDate: Record<string, { sum: number, count: number }> = {}

        // Init dates
        const today = new Date()
        for (let i = 29; i >= 0; i--) {
            const date = new Date(today)
            date.setDate(date.getDate() - i)
            const dateString = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
            responsesByDate[dateString] = 0
            satisfactionByDate[dateString] = { sum: 0, count: 0 }
        }

        // We need to calculate survey-specific ratings too
        const surveyRatings: Record<string, { sum: number, count: number }> = {}

        // Note: bulkStatsResponses might be partial (last 30 days) if we chose to filter. 
        // If we filtered by date, totalRatingCount/NPS will only reflect last 30 days.
        // For dashboard purposes, "Satisfaction Average" usually implies global? 
        // If user wants global, we should remove date filter in bulk query.
        // Let's assume we removed it or user is okay with recent stats. 
        // Actually, let's process ALL properly if possible. 
        // Given specific request "slow loading", limiting to 30 days or reasonable limit is valid optimization.
        // But let's assume `bulkStatsResponses` contains what we want to analyze.

        const staffStats: Record<string, { count: number, sum: number, mentions: number }> = {}
        const sourceStats: Record<string, number> = {} // New Source aggregation

        bulkStatsResponses.forEach(r => {
            const date = new Date(r.createdAt)
            const dateString = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

            // ... existing bucket logic ...
            if (responsesByDate[dateString] !== undefined) {
                responsesByDate[dateString]++
            }

            const ratingAnswers = r.answers.filter(a => a.question.type === 'RATING' || a.question.type === 'EMOJI')
            const ratingAns = ratingAnswers[0]
            const textAnswers = r.answers.filter(a => a.question.type === 'TEXT')

            // Staff Detection
            // We need to look for specific questions about "Who served you?"
            // Since we don't have the question text in the bulk selection for all answers (optimization),
            // we might miss it if we didn't include it. 
            // Correct format: select answers -> include question -> select text.
            // My previous bulk query select included `question: { select: { type: true, text: true } }`. So we HAVE the text. Good.

            const staffAnswer = r.answers.find(a => {
                const qText = a.question.text.toLowerCase()
                const hasKeyword = qText.includes('atendió') || qText.includes('mesero') || qText.includes('camarero') || qText.includes('personal') || qText.includes('quién') || qText.includes('quien')

                // Must have a meaningful length (avoid "Si", "No", "Yes")
                return hasKeyword && a.value && a.value.length > 2
            })

            const ratingVal = ratingAns ? parseInt(ratingAns.value) : 0

            let foundStaffName = null
            let foundRating = ratingVal

            // 1. Try to find explicit question answer
            if (staffAnswer && staffAnswer.value && staffAnswer.value.length > 2) {
                foundStaffName = staffAnswer.value
            }

            // Regex logic removed in favor of AI Batch Processing (see below)

            if (foundStaffName && foundRating > 0) {
                // Normalize name
                const rawName = foundStaffName.trim().toLowerCase()
                // Simple capitalization
                const name = rawName.replace(/(^\w|\s\w)/g, m => m.toUpperCase())

                if (!staffStats[name]) staffStats[name] = { count: 0, sum: 0, mentions: 0 }
                staffStats[name].count++
                staffStats[name].sum += foundRating
                staffStats[name].mentions++
                console.log(`[Analytics] Counted vote for: ${name}`)
            }

            if (ratingAns) {
                const val = parseInt(ratingAns.value)
                if (!isNaN(val)) {
                    totalRatingSum += val
                    totalRatingCount++

                    if (satisfactionByDate[dateString] !== undefined) {
                        satisfactionByDate[dateString].sum += val
                        satisfactionByDate[dateString].count++
                    }

                    if (!surveyRatings[r.surveyId]) surveyRatings[r.surveyId] = { sum: 0, count: 0 }
                    surveyRatings[r.surveyId].sum += val
                    surveyRatings[r.surveyId].count++

                    if (val === 5) promoters++
                    else if (val <= 3) detractors++

                    if (val >= 4) sentimentCounts.positive++
                    else if (val === 3) sentimentCounts.neutral++
                    else sentimentCounts.negative++

                    if (val <= 3) {
                        textAnswers.forEach(ans => {
                            if (ans && ans.value) {
                                const lowerText = ans.value.toLowerCase()
                                keywordsList.forEach(word => {
                                    if (lowerText.includes(word)) {
                                        negativeKeywords[word] = (negativeKeywords[word] || 0) + 1
                                    }
                                })
                            }
                        })
                    }
                }
            }
            // 2. AI Extraction for Staff Names
            // We collect potentially relevant text answers and send them to OpenAI in a batch
            // This happens AFTER the loop to batch everything
            // 2. AI Extraction for Staff Names
            // ... (AI code is lower)

            // --- Source Aggregation ---
            const src = r.customerSource || 'No especificado'
            if (src) {
                const cleanSrc = src.trim()
                sourceStats[cleanSrc] = (sourceStats[cleanSrc] || 0) + 1
            }
        })

        // --- AI ENHANCEMENT START ---
        // Collect text answers that are long enough to contain details
        const textCommentsForAI: { id: string, text: string }[] = []
        bulkStatsResponses.forEach(r => {
            r.answers.forEach(a => {
                if (a.question.type === 'TEXT' && a.value && a.value.length > 5) {
                    textCommentsForAI.push({ id: a.value.substring(0, 10), text: a.value })
                }
            })
        })

        // Limit to last 15 comments to preserve performance/quota on this GET endpoint
        const recentComments = textCommentsForAI.slice(0, 15)

        if (recentComments.length > 0) {
            try {
                // Dynamic import to avoid issues if file doesn't exist yet in compilation
                const { default: openai } = await import('@/lib/openai')

                if (process.env.OPENAI_API_KEY) {
                    const completion = await openai.chat.completions.create({
                        messages: [
                            {
                                role: "system",
                                content: "You are an expert sentiment analyzer. Extract staff names mentioned in these reviews. Return ONLY a JSON object mapping 'name' to 'sentiment_score' (1 for positive, -1 for negative). Key is the name (Capitalized), value is the score. Ignore if no names found. Example: {'Juan': 1, 'Maria': -1}. If specific job titles are used like 'el mesero' without name, ignore."
                            },
                            {
                                role: "user",
                                content: JSON.stringify(recentComments.map(c => c.text))
                            }
                        ],
                        model: "gpt-4o-mini", // Use fast model
                        response_format: { type: "json_object" }
                    })

                    const aiContent = completion.choices[0].message.content
                    if (aiContent) {
                        const aiResults = JSON.parse(aiContent)
                        console.log('[Analytics] AI Extracted Staff:', aiResults)

                        // Merge AI results
                        Object.entries(aiResults).forEach(([name, score]: [string, any]) => {
                            const cleanName = name.trim()
                            const sentiment = typeof score === 'number' ? score : 1

                            if (!staffStats[cleanName]) staffStats[cleanName] = { count: 0, sum: 0, mentions: 0 }

                            // We weigh AI detection heavily
                            staffStats[cleanName].count++
                            staffStats[cleanName].mentions++
                            // If positive, give 5 stars equivalent. If negative, 1 star.
                            staffStats[cleanName].sum += (sentiment > 0 ? 5 : 1)
                        })
                    }
                }
            } catch (err) {
                console.error("AI Staff Extraction Failed:", err)
            }
        }
        // --- AI ENHANCEMENT END ---

        const staffRanking = Object.entries(staffStats)
            .map(([name, stats]) => ({
                name,
                count: stats.count,
                average: (stats.sum / stats.count).toFixed(1)
            }))
            .sort((a, b) => parseFloat(b.average) - parseFloat(a.average))
            .slice(0, 5)

        const averageSatisfaction = totalRatingCount > 0 ? (totalRatingSum / totalRatingCount).toFixed(1) : "0.0"

        const totalNpsResponses = promoters + detractors + (totalRatingCount - promoters - detractors)
        const npsScore = totalNpsResponses > 0 ? Math.round(((promoters - detractors) / totalNpsResponses) * 100) : 0

        const topIssues = Object.entries(negativeKeywords)
            .map(([topic, count]) => ({ topic, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 5)

        const chartData = Object.keys(responsesByDate).map(date => {
            const dailySat = satisfactionByDate[date]
            const avgSat = dailySat && dailySat.count > 0 ? (dailySat.sum / dailySat.count) : 0
            return {
                date,
                respuestas: responsesByDate[date],
                satisfaccion: parseFloat(avgSat.toFixed(1))
            }
        })

        // -- Process Source Stats --
        const sourceChartData = Object.entries(sourceStats)
            .sort((a, b) => b[1] - a[1]) // Sort by count descending (value is number here)
            .map(([name, value]) => ({ name, value })) // Map to object after sorting
            .slice(0, 6) // Top 6 sources

        // -- Calculate Previous Period KPIs --
        let prevTotalCount = prevStatsResponses.length
        let prevRatingSum = 0
        let prevRatingCount = 0
        // let prevPromoters = 0 // Unused
        // let prevDetractors = 0 // Unused

        prevStatsResponses.forEach(r => {
            const rating = r.answers.find((a: any) => {
                // simplified find, we just want numeric ratings
                return !isNaN(parseInt(a.value)) && parseInt(a.value) <= 5
            })
            if (rating) {
                const val = parseInt(rating.value)
                if (!isNaN(val)) {
                    prevRatingSum += val
                    prevRatingCount++
                }
            }
        })

        const prevAvgSat = prevRatingCount > 0 ? (prevRatingSum / prevRatingCount) : 0
        // Simplified NPS calc for prev period if needed, but for KPI changes avg sat is most important

        // Calculate % Changes
        const calcChange = (current: number, prev: number) => {
            if (prev === 0) return current > 0 ? 100 : 0
            return Math.round(((current - prev) / prev) * 100)
        }

        const kpiChanges = {
            totalResponses: calcChange(bulkStatsResponses.length, prevTotalCount),
            averageSatisfaction: calcChange(parseFloat(averageSatisfaction), prevAvgSat),
            npsScore: 0 // Placeholder or actual calculation if needed
        }

        console.timeEnd('Processing Stats')


        console.time('Processing Detailed Lists')
        // Helper to process FULL responses (Recent + Worst)
        const processResponseDetail = (r: any) => {
            const questions = r.survey?.questions || r._surveyQuestions || []
            const answers = r.answers || []

            const ratingAnswer = answers.find((a: any) => {
                const q = questions.find((q: any) => q.id === a.questionId) || a.question
                return q?.type === 'RATING' || q?.type === 'EMOJI'
            })
            const textAnswer = answers.find((a: any) => {
                const q = questions.find((q: any) => q.id === a.questionId) || a.question
                return q?.type === 'TEXT'
            })

            // Robust meta extraction
            const nameAnswer = answers.find((a: any) => {
                const q = questions.find((qu: any) => qu.id === a.questionId) || a.question
                if (!q) return false
                return q.text.toLowerCase().match(/nombre|quién|quien|soy|cliente/)
            })
            const phoneAnswer = answers.find((a: any) => {
                const q = questions.find((qu: any) => qu.id === a.questionId) || a.question
                return q && (q.type === 'PHONE' || q.text.toLowerCase().match(/tel|cel|whats/))
            })
            const emailAnswer = answers.find((a: any) => {
                const q = questions.find((qu: any) => qu.id === a.questionId) || a.question
                return q && (q.type === 'EMAIL' || q.text.toLowerCase().match(/email|correo/))
            })
            const photoAnswer = answers.find((a: any) => {
                const q = questions.find((qu: any) => qu.id === a.questionId) || a.question
                const isImageQ = q && (q.type === 'IMAGE' || q.text.toLowerCase().match(/foto|imagen|evidencia/))
                return isImageQ && a.value && (a.value.startsWith('http') || a.value.startsWith('/'))
            })

            const resolvedPhoto = r.photo || photoAnswer?.value || null
            const resolvedName = r.customerName || nameAnswer?.value || 'Anónimo'
            const resolvedPhone = r.customerPhone || phoneAnswer?.value || null
            const resolvedEmail = r.customerEmail || emailAnswer?.value || null

            const detailedAnswers = answers.map((a: any) => {
                const q = questions.find((q: any) => q.id === a.questionId) || a.question
                return {
                    question: q?.text || 'Desconocida',
                    answer: a.value,
                    type: q?.type
                }
            })

            return {
                id: r.id,
                user: resolvedName,
                customerName: resolvedName,
                feedback: textAnswer?.value,
                rating: ratingAnswer ? parseInt(ratingAnswer.value) : 0,
                surveyId: r.surveyId,
                survey: r.survey?.title || 'Encuesta',
                rawDate: new Date(r.createdAt),
                date: new Date(r.createdAt).toLocaleDateString(),
                phone: resolvedPhone,
                email: resolvedEmail,
                photo: resolvedPhoto,
                details: detailedAnswers,
                createdAt: r.createdAt.toISOString(),
                answers: [] // Optimize payload size
            }
        }

        const recentFeedback = recentRaw.map(processResponseDetail)
        const worstFeedback = worstRaw.map(processResponseDetail)
        const bestFeedback = bestRaw.map(processResponseDetail)

        console.timeEnd('Processing Detailed Lists')
        console.timeEnd('Analytics Total')

        const sentimentCounts = [
            { name: 'Positivo', value: promoters },
            { name: 'Neutral', value: totalRatingCount - promoters - detractors },
            { name: 'Negativo', value: detractors }
        ]

        return NextResponse.json({
            surveysList: allSurveys,
            totalResponses,
            averageSatisfaction,
            npsScore,
            activeUsers: Math.floor(totalResponses * 0.9),
            chartData,
            sourceChartData,
            sentimentCounts,
            topIssues,
            recentFeedback,
            bestFeedback,
            worstFeedback,
            kpiChanges,
            staffRanking
        })

    } catch (error) {
        console.error('[ANALYTICS_GET]', error)
        return new NextResponse("Internal Error", { status: 500 })
    }
}
