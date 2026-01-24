import { prisma } from '@/lib/prisma'
import { unstable_cache } from 'next/cache'

export const getCachedAnalyticsData = unstable_cache(
    async (userId: string | string[], surveyId: string | null, startDateParam: string | null, endDateParam: string | null) => {

        const userIds = Array.isArray(userId) ? userId : [userId];
        const primaryUserId = userIds[0];

        // Base filter
        const whereClause: any = { survey: { userId: { in: userIds } } }
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
        const [totalResponses, userSettings] = await Promise.all([
            prisma.response.count({ where: whereClause }),
            prisma.userSettings.findUnique({ where: { userId: primaryUserId }, select: { plan: true, extraSurveys: true } as any })
        ])

        // 2. Bulk Stats Data
        let dateFilterForBulk: any = {}
        // Use default (all time) only if no date param, effectively matching route logic
        if (!startDateParam || !endDateParam) {
            dateFilterForBulk = {}
        }

        const bulkStatsResponses = await prisma.response.findMany({
            where: {
                ...whereClause, // count filters
                ...dateFilterForBulk
            },
            select: {
                id: true,
                createdAt: true,
                surveyId: true,
                customerSource: true,
                answers: {
                    where: {
                        question: {
                            type: { in: ['RATING', 'EMOJI', 'TEXT', 'YES_NO'] }
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

        // 3. Recent Feedback (Full Details, limit 5)
        const recentRaw = await prisma.response.findMany({
            where: whereClause,
            take: 5,
            orderBy: { createdAt: 'desc' },
            include: {
                survey: { select: { title: true, questions: true } },
                answers: { include: { question: true } }
            }
        })

        // 4. Worst Feedback (Find worst IDs first)
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

        // 5. Previous Period Stats (Comparison)
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

        // Processing Logic (JS)
        let totalRatingSum = 0
        let totalRatingCount = 0
        let promoters = 0
        let detractors = 0
        let sentimentStats = { positive: 0, neutral: 0, negative: 0 }
        const negativeKeywords: Record<string, number> = {}
        const keywordsList = [
            'lento', 'tarda', 'espera', 'tiempo', 'hora', 'minutos',
            'mesero', 'camarero', 'personal', 'atención', 'atencion', 'actitud', 'grocero', 'grosero', 'maleducado',
            'gerente', 'encargado', 'dueño', 'administrador',
            'servicio', 'pésimo', 'pesimo', 'malo', 'terrible', 'horrible',
            'comida', 'alimento', 'sabor', 'insípido', 'feo', 'asco', 'crudo', 'quemado', 'salado', 'fría', 'fria',
            'bebida', 'refresco', 'cerveza', 'alcohol', 'trago', 'agua', 'hielo',
            'carne', 'pollo', 'pescado', 'pizza', 'hamburguesa', 'taco',
            'sucio', 'limpieza', 'olor', 'mosca', 'cucaracha', 'rat', 'baño', 'wc', 'sanitario',
            'ruido', 'música', 'musica', 'volumen', 'ambiente',
            'calor', 'frío', 'aire', 'acondicionado',
            'mesa', 'silla', 'incomod',
            'estacionamiento', 'valet', 'lugar',
            'caro', 'precio', 'cuenta', 'propina', 'cobro', 'robo', 'costoso'
        ]

        const responsesByDate: Record<string, number> = {}
        const satisfactionByDate: Record<string, { sum: number, count: number }> = {}

        const today = new Date()
        for (let i = 29; i >= 0; i--) {
            const date = new Date(today)
            date.setDate(date.getDate() - i)
            const dateString = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
            responsesByDate[dateString] = 0
            satisfactionByDate[dateString] = { sum: 0, count: 0 }
        }

        const surveyRatings: Record<string, { sum: number, count: number }> = {}
        const staffStats: Record<string, { count: number, sum: number, mentions: number }> = {}
        const sourceStats: Record<string, number> = {}

        bulkStatsResponses.forEach(r => {
            const date = new Date(r.createdAt)
            const dateString = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

            if (responsesByDate[dateString] !== undefined) {
                responsesByDate[dateString]++
            }

            const ratingAnswers = r.answers.filter(a => a.question.type === 'RATING' || a.question.type === 'EMOJI')
            const ratingAns = ratingAnswers[0]
            const textAnswers = r.answers.filter(a => a.question.type === 'TEXT')

            // Staff Detection (Basic)
            const staffAnswer = r.answers.find(a => {
                const qText = a.question.text.toLowerCase()
                const hasKeyword = qText.includes('atendió') || qText.includes('mesero') || qText.includes('camarero') || qText.includes('personal') || qText.includes('quién') || qText.includes('quien')
                return hasKeyword && a.value && a.value.length > 2
            })

            const ratingVal = ratingAns ? parseInt(ratingAns.value) : 0
            let foundStaffName = null
            let foundRating = ratingVal

            if (staffAnswer && staffAnswer.value && staffAnswer.value.length > 2) {
                foundStaffName = staffAnswer.value.replace(/^(Sí|Si|Yes)\s*-\s*/i, '').trim()
            }

            if (foundStaffName && foundRating > 0) {
                const rawName = foundStaffName.trim().toLowerCase()
                const name = rawName.replace(/(^\w|\s\w)/g, m => m.toUpperCase())

                if (!staffStats[name]) staffStats[name] = { count: 0, sum: 0, mentions: 0 }
                staffStats[name].count++
                staffStats[name].sum += foundRating
                staffStats[name].mentions++
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

                    if (val >= 4) sentimentStats.positive++
                    else if (val === 3) sentimentStats.neutral++
                    else sentimentStats.negative++

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

            const src = r.customerSource || 'No especificado'
            if (src) {
                const cleanSrc = src.trim()
                sourceStats[cleanSrc] = (sourceStats[cleanSrc] || 0) + 1
            }
        })

        // NOTE: AI Staff Extraction SKIPPED in cached version to improve performance significantly.
        // If critical, we can move it to a background job or separate endpoint.

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

        const sourceChartData = Object.entries(sourceStats)
            .sort((a, b) => b[1] - a[1])
            .map(([name, value]) => ({ name, value }))
            .slice(0, 6)

        let prevTotalCount = prevStatsResponses.length
        let prevRatingSum = 0
        let prevRatingCount = 0

        let prevPromoters = 0
        let prevDetractors = 0
        let prevNpsTotal = 0

        prevStatsResponses.forEach(r => {
            const rating = r.answers.find((a: any) => !isNaN(parseInt(a.value)) && parseInt(a.value) <= 5)
            if (rating) {
                const val = parseInt(rating.value)
                if (!isNaN(val)) {
                    // Standard Stats
                    prevRatingSum += val
                    prevRatingCount++

                    // NPS Stats
                    prevNpsTotal++
                    if (val === 5) prevPromoters++
                    else if (val <= 3) prevDetractors++
                }
            }
        })

        const prevAvgSat = prevRatingCount > 0 ? (prevRatingSum / prevRatingCount) : 0

        const calcChange = (current: number, prev: number) => {
            if (prev === 0) return current > 0 ? 100 : 0
            return Math.round(((current - prev) / prev) * 100)
        }

        const prevNpsScore = prevNpsTotal > 0
            ? Math.round(((prevPromoters - prevDetractors) / prevNpsTotal) * 100)
            : 0

        const kpiChanges = {
            totalResponses: calcChange(bulkStatsResponses.length, prevTotalCount),
            averageSatisfaction: calcChange(parseFloat(averageSatisfaction), prevAvgSat),
            npsScore: npsScore - prevNpsScore // Point difference for NPS is standard, but UI expects logic.
            // Let's us calcChange for consistency if we want % growth, but NPS growth is weird.
            // If we use point difference, we should label it as "pts".
            // For now, let's just return the raw difference as a number, and handle display in UI.
            // Actually, existing UI logic (DashboardView) usually takes a % string or calculates it?
            // DashboardView uses `stat.change` string.
            // StatsData interface defines kpiChanges as numbers.
            // Let's treat NPS change as raw point difference.
        }

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
                answers: []
            }
        }

        const recentFeedback = recentRaw.map(processResponseDetail)
        const worstFeedback = worstRaw.map(processResponseDetail)
        const bestFeedback = bestRaw.map(processResponseDetail)

        const sentimentCounts = [
            { name: 'Positivo', value: promoters },
            { name: 'Neutral', value: totalRatingCount - promoters - detractors },
            { name: 'Negativo', value: detractors }
        ]

        const surveysWithStats = Object.keys(surveyRatings).map(id => ({
            id,
            rating: surveyRatings[id].count > 0 ? (surveyRatings[id].sum / surveyRatings[id].count).toFixed(1) : "0.0"
        }))

        // Also fetch All Surveys list for the dropdown (lightweight)
        const allSurveys = await prisma.survey.findMany({
            where: { userId: { in: userIds } },
            select: { id: true, title: true }
        })

        return {
            plan: userSettings?.plan || 'FREE',
            extraSurveys: (userSettings as any)?.extraSurveys || 0,
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
            staffRanking,
            surveysWithStats
        }
    },
    ['analytics-full-data-v1'], // Cache key
    {
        revalidate: 60, // 60 seconds
        tags: ['analytics-full']
    }
)
