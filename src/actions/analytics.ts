'use server'

import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { startOfDay, subDays, format, endOfDay } from 'date-fns'
import { es } from 'date-fns/locale'
import { getGeminiModel } from '@/lib/gemini'


// --- STATIC STRATEGY GENERATION ---

interface Strategy {
    title: string
    problemDetected: string
    bestPractice: string
    steps: {
        title: string
        desc: string
    }[]
}

interface StaffRanking {
    name: string
    count: number
    average: string
}

interface AnalyticsData {
    metrics: {
        totalFeedback: number
        avgRating: number
        npsScore: number
        activeUsers: number
    }
    chartData: Array<{ name: string; value: number }>
    sentimentData: Array<{ name: string; value: number; color: string; bg: string; glow: string }>
    generatedStrategies: Strategy[]
    staffRanking: StaffRanking[]
}

import { unstable_cache } from 'next/cache'

// --- CACHED DATA FETCHING ---
const getCachedAnalytics = unstable_cache(
    async (userId: string, surveyId: string, startDateStr: string, endDateStr: string, skipAI: boolean, industry: string) => {
        const startDate = new Date(startDateStr)
        const endDate = new Date(endDateStr)

        // 1. Fetch Data (Optimized with Date Filter)
        let allResponses: any[] = []
        let allQuestions: any[] = []

        if (surveyId === 'all') {
            const surveys = await prisma.survey.findMany({
                where: { userId },
                select: {
                    questions: true,
                    responses: {
                        where: {
                            createdAt: {
                                gte: startDate,
                                lte: endDate
                            }
                        },
                        select: {
                            id: true,
                            createdAt: true,
                            customerEmail: true,
                            customerPhone: true,
                            answers: {
                                select: {
                                    questionId: true,
                                    value: true
                                }
                            }
                        },
                        orderBy: { createdAt: 'asc' }
                    }
                }
            })

            // Flatten responses
            allResponses = surveys.flatMap(s => s.responses)
            // Flatten questions (needed for lookup)
            allQuestions = surveys.flatMap(s => s.questions)

        } else {
            const survey = await prisma.survey.findUnique({
                where: { id: surveyId, userId },
                select: {
                    questions: true,
                    responses: {
                        where: {
                            createdAt: {
                                gte: startDate,
                                lte: endDate
                            }
                        },
                        select: {
                            id: true,
                            createdAt: true,
                            customerEmail: true,
                            customerPhone: true,
                            answers: {
                                select: {
                                    questionId: true,
                                    value: true
                                }
                            }
                        },
                        orderBy: { createdAt: 'asc' }
                    }
                }
            })

            if (!survey) return null
            allResponses = survey.responses
            allQuestions = survey.questions
        }

        // Relevant responses are now already filtered by DB
        const relevantResponses = allResponses


        // 3. Calculate Metrics & Weaknesses
        const totalFeedback = relevantResponses.length
        let scores: number[] = []

        // Track scores by topic
        const topicScores: Record<string, number[]> = {
            'speed': [],
            'service': [],
            'product': [],
            'ambience': [],
            'price': []
        }

        relevantResponses.forEach(r => {
            r.answers.forEach((a: any) => {
                const q = allQuestions.find((qu: any) => qu.id === a.questionId)
                if (q) {
                    // Collect scores
                    if (q.type === 'RATING' || q.type === 'EMOJI' || q.type === 'NPS') {
                        const val = parseFloat(a.value)
                        if (!isNaN(val)) {
                            scores.push(val)

                            // Infer Topic
                            const text = q.text.toLowerCase()
                            if (text.includes('tiempo') || text.includes('rapidez') || text.includes('espera')) topicScores['speed'].push(val)
                            else if (text.includes('servicio') || text.includes('atención') || text.includes('amabilidad') || text.includes('mesero')) topicScores['service'].push(val)
                            else if (text.includes('comida') || text.includes('sabor') || text.includes('bebida') || text.includes('menú')) topicScores['product'].push(val)
                            else if (text.includes('ambiente') || text.includes('lugar') || text.includes('limpieza') || text.includes('música')) topicScores['ambience'].push(val)
                            else if (text.includes('precio') || text.includes('costo') || text.includes('valor')) topicScores['price'].push(val)
                            else topicScores['service'].push(val) // Default to service
                        }
                    }
                }
            })
        })

        const avgRating = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0

        // NPS Calculation
        let promoters = 0, detractors = 0
        scores.forEach(s => {
            if (s >= 5) promoters++
            else if (s <= 3) detractors++
        })
        const npsScore = scores.length > 0 ? Math.round(((promoters - detractors) / scores.length) * 100) : 0
        const uniqueUsers = new Set(relevantResponses.map(r => r.customerEmail || r.customerPhone || r.id)).size

        // 3.5 Collect Text Feedback
        let textFeedback: string[] = []
        relevantResponses.forEach(r => {
            r.answers.forEach((a: any) => {
                const q = allQuestions.find((qu: any) => qu.id === a.questionId)
                if (q && (q.type === 'TEXT' || q.type === 'LONG_TEXT') && a.value && a.value.length > 3) {
                    textFeedback.push(`- "${a.value}"`)
                }
            })
        })
        // 4. Generate AI Context (Hybrid: Text + Metrics)
        let aiContextParts: string[] = []

        // A. Quantitative Context (Weaknesses)
        const avgTopicScoresRaw = Object.entries(topicScores).map(([topic, values]) => ({
            topic,
            avg: values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : null,
            count: values.length
        })).filter(t => t.avg !== null)

        const weaknesses = avgTopicScoresRaw.filter(t => (t.avg as number) < 4.0).map(t =>
            `- Problema detectado en área "${t.topic.toUpperCase()}" con calificación promedio de ${(t.avg as number).toFixed(1)}/5 (${t.count} respuestas).`
        )

        if (weaknesses.length > 0) {
            aiContextParts.push("RESUMEN DE MÉTRICAS BAJAS:")
            aiContextParts.push(...weaknesses)
        }

        // B. Qualitative Context (Text)
        if (textFeedback.length > 0) {
            aiContextParts.push("\nCOMENTARIOS TEXTUALES DE CLIENTES:")
            aiContextParts.push(textFeedback.slice(-30).join("\n")) // Last 30 comments
        }

        const fullContext = aiContextParts.join("\n")

        // 5. Generate Strategies
        let generatedStrategies: Strategy[] = []

        // Call AI if we have ANY context (Metrics OR Text) AND skipAI is false
        // Using Geminii 1.5 Flash
        if (!skipAI && process.env.GEMINI_API_KEY && fullContext.length > 10) {
            try {
                // console.log("[Analytics] Calling Gemini with Hybrid Context...")
                generatedStrategies = await generateStrategiesWithAI(industry, fullContext)
            } catch (aiError) {
                console.error("[Analytics] AI Failed.", aiError)
                generatedStrategies = []
            }
        }

        // Fallback: Static Library
        if (generatedStrategies.length === 0) {
            const avgTopicScores = Object.entries(topicScores).map(([topic, values]) => ({
                topic,
                avg: values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 5
            })).sort((a, b) => a.avg - b.avg)

            const weakestTopics = avgTopicScores.filter(t => t.avg < 4.5).map(t => t.topic)
            if (weakestTopics.length < 3) {
                ['speed', 'service', 'product'].forEach(t => { if (!weakestTopics.includes(t)) weakestTopics.push(t) })
            }
            generatedStrategies = weakestTopics.slice(0, 3).map(topic => getStrategyForTopic(industry, topic))
        }

        // 5. Chart & Sentiment (Standard)
        const chartMap = new Map<string, number>()
        // Initialize chart map with zero values for all dates in range
        let iterDate = new Date(startDate)
        while (iterDate <= endDate) {
            chartMap.set(format(iterDate, 'dd MMM', { locale: es }), 0)
            iterDate.setDate(iterDate.getDate() + 1)
        }

        relevantResponses.forEach(r => {
            const key = format(new Date(r.createdAt), 'dd MMM', { locale: es })
            if (chartMap.has(key)) chartMap.set(key, (chartMap.get(key) || 0) + 1)
        })
        const chartData = Array.from(chartMap.entries()).map(([name, value]) => ({ name: name.charAt(0).toUpperCase() + name.slice(1), value }))

        const positive = scores.filter(s => s >= 4).length
        const neutral = scores.filter(s => s > 2 && s < 4).length
        const negative = scores.filter(s => s <= 2).length
        const sentimentData = [
            { name: 'Positivo', value: Math.round((positive / (scores.length || 1)) * 100), color: 'from-emerald-400 to-teal-500', bg: 'bg-emerald-500/20', glow: 'shadow-[0_0_15px_rgba(52,211,153,0.5)]' },
            { name: 'Neutral', value: Math.round((neutral / (scores.length || 1)) * 100), color: 'from-amber-400 to-orange-500', bg: 'bg-amber-500/20', glow: 'shadow-[0_0_15px_rgba(251,191,36,0.5)]' },
            { name: 'Negativo', value: Math.round((negative / (scores.length || 1)) * 100), color: 'from-rose-500 to-red-600', bg: 'bg-rose-500/20', glow: 'shadow-[0_0_15px_rgba(244,63,94,0.5)]' },
        ]

        // 6. Staff Leaderboard Calculation
        const staffMap = new Map<string, { count: number; totalRating: number }>()

        relevantResponses.forEach(r => {
            let staffName = ''
            let rating = 0

            r.answers.forEach((a: any) => {
                const q = allQuestions.find((qu: any) => qu.id === a.questionId)
                if (q) {
                    // Check for Rating
                    if (q.type === 'RATING' || q.type === 'EMOJI' || q.type === 'NPS') {
                        const val = parseFloat(a.value)
                        if (!isNaN(val)) rating = val
                    }
                    // Check for Staff Name (Text answer with keywords)
                    const text = q.text.toLowerCase()
                    const isStaffQuestion = (q.type === 'TEXT' || q.type === 'SHORT_TEXT') &&
                        (text.match(/qui[eé]n te atendi[oó]|nombre.*(mesero|personal|staff)|atendido por/i))

                    if (isStaffQuestion && a.value && a.value.length < 30) { // Limit length to avoid long comments being treated as names
                        staffName = a.value.trim()
                    }
                }
            })

            // If we found both a staff name and a rating in this response
            if (staffName && rating > 0) {
                // Normalize name (Capitalize first letter)
                const normalizedName = staffName.charAt(0).toUpperCase() + staffName.slice(1).toLowerCase()

                const current = staffMap.get(normalizedName) || { count: 0, totalRating: 0 }
                staffMap.set(normalizedName, {
                    count: current.count + 1,
                    totalRating: current.totalRating + rating
                })
            }
        })

        // Convert Map to Array and Sort
        const staffRanking = Array.from(staffMap.entries()).map(([name, stats]) => ({
            name,
            count: stats.count,
            average: (stats.totalRating / stats.count).toFixed(1)
        }))
            .sort((a, b) => parseFloat(b.average) - parseFloat(a.average)) // Sort by rating first
            .sort((a, b) => b.count - a.count)  // Then by popularity (optional, but rating is usually key)
            // Actually showing top rating is better, but maybe weigh by count? 
            // Let's sort by Average Rating (desc), then Count (desc)
            .sort((a, b) => {
                const diff = parseFloat(b.average) - parseFloat(a.average)
                if (Math.abs(diff) < 0.1) return b.count - a.count
                return diff
            })
            .slice(0, 5)

        return {
            metrics: { totalFeedback, avgRating: Number(avgRating.toFixed(1)), npsScore, activeUsers: uniqueUsers },
            chartData,
            sentimentData,
            generatedStrategies,
            staffRanking
        }
    },
    ['survey-analytics'], // Cache key (partial, additional args added automatically)
    {
        revalidate: 60, // Cache for 60 seconds
        tags: ['analytics']
    }
)

export async function getSurveyAnalytics(surveyId: string, dateRange?: { from: Date; to: Date }, industry: string = 'restaurant', skipAI: boolean = false): Promise<AnalyticsData> {
    try {
        const { userId } = await auth()
        if (!userId) throw new Error('Unauthorized')

        // 2. Determine Data Window (Moved up for DB Optimization)
        const toDate = dateRange?.to || new Date()
        const endDate = endOfDay(toDate)
        const startDate = dateRange?.from || subDays(startOfDay(toDate), 30)

        const result = await getCachedAnalytics(
            userId,
            surveyId,
            startDate.toISOString(),
            endDate.toISOString(),
            skipAI,
            industry
        )

        return result || getEmptyAnalytics()

    } catch (error) {
        console.error('ANALYTICS ACTION ERROR:', error)
        return getEmptyAnalytics()
    }
}


// --- AI GENERATION ---
async function generateStrategiesWithAI(industry: string, feedbackContext: string): Promise<Strategy[]> {
    const prompt = `
        Actúa como un Consultor de Operaciones Senior experto en la industria: ${industry.toUpperCase()}.
        
        CONTEXTO:
        Analiza los siguientes datos de quejas y métricas de un negocio real:
        ---
        ${feedbackContext}
        ---

        TAREA:
        Identifica los 3 problemas operativos MÁS CRÍTICOS.
        Para cada uno, genera un "Plan de Acción de Mejores Prácticas" para solucionarlo de raíz.
        No des consejos genéricos ("mejorar servicio"), da instrucciones precisas ("implementar protocolo de saludo en 3 seg").

        FORMATO JSON ARRAY (Estricto):
        [
          {
            "title": "Nombre de la Estrategia (Accionable)",
            "problemDetected": "Explicación breve de qué está fallando según los datos (ej. 'Tiempos de espera > 20min')",
            "bestPractice": "Cuál es el estándar de oro de la industria para esto (ej. 'Sistema FIFO en comandas')",
            "steps": [
               { "title": "Paso 1: Diagnóstico", "desc": "Instrucción precisa" },
               { "title": "Paso 2: Implementación", "desc": "Instrucción precisa" },
               { "title": "Paso 3: Medición", "desc": "Instrucción precisa" },
               { "title": "Paso 4: Ajuste", "desc": "Instrucción precisa" },
               { "title": "Paso 5: Estandarización", "desc": "Instrucción precisa" }
            ]
          }
        ]
    `
    // using gemini-flash-latest
    const model = getGeminiModel('gemini-flash-latest', {
        systemInstruction: "Eres un experto en optimización operativa. Genera JSON.",
        generationConfig: { responseMimeType: "application/json" }
    })

    const result = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }]
    })

    const content = result.response.text()
    if (!content) return []

    // Parse JSON safely
    try {
        const parsed = JSON.parse(content)
        // Handle if AI wraps it in a key like { strategies: [...] } or returns direct array
        if (Array.isArray(parsed)) return parsed
        if (parsed.strategies && Array.isArray(parsed.strategies)) return parsed.strategies
        return []
    } catch (e) {
        console.error("Failed to parse AI strategies JSON", e)
        return []
    }
}


// --- STRATEGY LIBRARY (Static) ---
function getStrategyForTopic(industry: string, topic: string): Strategy {
    const lib: any = {
        restaurant: {
            speed: {
                title: "Optimización de Flujo de Cocina (KDS)",
                problemDetected: "Los clientes perciben esperas injustificadas en horas pico.",
                bestPractice: "Implementación de Sistema de Pantallas (KDS) y roles de 'Expediter'.",
                steps: [
                    { title: "Diagnóstico de Cuellos de Botella", desc: "Cronometra cada estación (Fritura, Plancha, Armado) para hallar el retraso." },
                    { title: "Re-diseño de Línea", desc: "Mueve los ingredientes más usados a la altura de la cintura del cocinero." },
                    { title: "Ticket Flow", desc: "Implementa el sistema 'First In, First Out' estricto con tickets numerados." },
                    { title: "Rol de Expediter", desc: "Asigna a una persona SOLO a terminar y entregar platos, no a cocinar." },
                    { title: "Pre-Producción (Mise en Place)", desc: "Aumenta la preparación previa al turno en un 20% para evitar cortes." }
                ]
            },
            service: {
                title: "Protocolo de Hospitalidad 360",
                problemDetected: "Falta de conexión emocional o atención 'robótica'.",
                bestPractice: "Modelo de Servicio Proactivo (Anticipar vs Reaccionar).",
                steps: [
                    { title: "Regla del 10/4", desc: "Sonreír a 10 pies y saludar verbalmente a 4 pies de distancia." },
                    { title: "Presentación Personal", desc: "El mesero debe dar su nombre y preguntar si es la primera visita en < 1 min." },
                    { title: "Check-Back de Calidad", desc: "Preguntar '¿Cómo está el término?' a los 2 minutos de entregar el plato principal." },
                    { title: "Venta Sugestiva", desc: "No preguntar '¿Postre?', ofrecer '¿Desean probar el Cheesecake de la casa?'." },
                    { title: "Despedida Cálida", desc: "Agradecer por la visita e invitar a volver pronto explícitamente." }
                ]
            },
            product: {
                title: "Ingeniería de Menú (Rentabilidad)",
                problemDetected: "Baja percepción de valor o quejas sobre calidad/precio.",
                bestPractice: "Matriz de Ingeniería de Menú (Popularidad vs Rentabilidad).",
                steps: [
                    { title: "Clasificación de Platos", desc: "Separa el menú en Estrellas (Popular/Rentable) y Perros (Impopular/No rentable)." },
                    { title: "Eliminación Rápida", desc: "Elimina el 10% de los platos 'Perros' para simplificar la operación." },
                    { title: "Renovación de Estrellas", desc: "Invierte en mejores fotos y descripciones para tus platos top." },
                    { title: "Estandarización de Recetas", desc: "Usa básculas y fichas técnicas para asegurar el mismo sabor siempre." },
                    { title: "Control de Mermas", desc: "Registra cada plato devuelto y su causa raíz diaria." }
                ]
            },
            ambience: {
                title: "Auditoría de Atmósfera",
                problemDetected: "El ambiente no invita a quedarse o hay incomodidad física.",
                bestPractice: "Diseño Sensorial Consistente (Vista, Oído, Olfato).",
                steps: [
                    { title: "Curaduría Musical", desc: "Crea playlists por franja horaria (Baja energía AM, Alta energía PM)." },
                    { title: "Iluminación Dinámica", desc: "Baja las luces un 20% después de las 7 PM para cenar." },
                    { title: "Limpieza Profunda", desc: "Programa limpieza de baños cada 30 min con bitácora visible." },
                    { title: "Temperatura", desc: "Mantén el aire entre 21-23°C, validando cada 2 horas." },
                    { title: "Mantenimiento Preventivo", desc: "Repara mesas que cojean y sillas peladas inmediatamente." }
                ]
            },
            price: {
                title: "Estrategia de Valor Percibido",
                problemDetected: "Los clientes sienten que pagan más de lo que reciben.",
                bestPractice: "Psicología de Precios y Anclaje.",
                steps: [
                    { title: "Efecto Señuelo", desc: "Añade una opción 'Premium' cara para que la estándar parezca barata." },
                    { title: "Presentación Visual", desc: "Mejora la vajilla o la presentación para justificar el precio." },
                    { title: "Eliminación de Signos", desc: "Quita el signo de pesos ($) del menú, usa solo números simples." },
                    { title: "Combos de Valor", desc: "Crea paquetes (Entrada + Plato) que den sensación de ahorro." },
                    { title: "Muestras Gratis", desc: "Da una pequeña cortesía al inicio para activar la reciprocidad." }
                ]
            }
        },
    }

    // Default fallback logic to avoid crashes
    const ind = lib[industry] || lib['restaurant']
    const strat = ind[topic] || ind['service']
    return strat
}

// --- PUBLIC SHARING LOGIC ---

const SECRET_KEY = process.env.NEXTAUTH_SECRET || "fallback-secret-key-change-me"

async function verifyToken(surveyId: string, token: string) {
    const crypto = await import('crypto')
    const expected = crypto.createHmac('sha256', SECRET_KEY).update(surveyId).digest('hex')
    return expected === token
}

export async function getReportShareLink(surveyId: string) {
    try {
        const { userId } = await auth()
        if (!userId) throw new Error('Unauthorized')

        const crypto = await import('crypto')
        const token = crypto.createHmac('sha256', SECRET_KEY).update(surveyId).digest('hex')

        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.happymeters.com'
        return `${baseUrl}/report/${surveyId}?token=${token}`
    } catch (error) {
        console.error("Error generating link:", error)
        throw new Error("Failed to generate link")
    }
}

export async function getPublicSurveyAnalytics(surveyId: string, token: string, dateRange?: { from: Date; to: Date }, industry: string = 'restaurant', skipAI: boolean = false): Promise<AnalyticsData> {
    const isValid = await verifyToken(surveyId, token)
    if (!isValid) throw new Error("Invalid or expired link")


    try {
        let allResponses: any[] = []
        let allQuestions: any[] = []

        // --- REUSE CORE CALCULATION LOGIC ---
        // (Copied from above for public view stability)

        const toDate = dateRange?.to || new Date()
        const endDate = endOfDay(toDate)
        const startDate = dateRange?.from || subDays(startOfDay(toDate), 30)

        const survey = await prisma.survey.findUnique({
            where: { id: surveyId },
            select: {
                questions: true,
                responses: {
                    where: {
                        createdAt: {
                            gte: startDate,
                            lte: endDate
                        }
                    },
                    select: {
                        id: true,
                        createdAt: true,
                        customerEmail: true,
                        customerPhone: true,
                        answers: {
                            select: {
                                questionId: true,
                                value: true
                            }
                        }
                    },
                    orderBy: { createdAt: 'asc' }
                }
            }
        })

        if (!survey) return getEmptyAnalytics()
        allResponses = survey.responses
        allQuestions = survey.questions

        const relevantResponses = allResponses

        const totalFeedback = relevantResponses.length
        let scores: number[] = []

        const topicScores: Record<string, number[]> = { 'speed': [], 'service': [], 'product': [], 'ambience': [], 'price': [] }

        relevantResponses.forEach(r => {
            r.answers.forEach((a: any) => {
                const q = allQuestions.find((qu: any) => qu.id === a.questionId)
                if (q) {
                    if (q.type === 'RATING' || q.type === 'EMOJI' || q.type === 'NPS') {
                        const val = parseFloat(a.value)
                        if (!isNaN(val)) {
                            scores.push(val)
                            const text = q.text.toLowerCase()
                            if (text.includes('tiempo')) topicScores['speed'].push(val)
                            else if (text.includes('servicio')) topicScores['service'].push(val)
                            else if (text.includes('comida')) topicScores['product'].push(val)
                            else if (text.includes('ambiente')) topicScores['ambience'].push(val)
                            else if (text.includes('precio')) topicScores['price'].push(val)
                            else topicScores['service'].push(val)
                        }
                    }
                }
            })
        })

        const avgRating = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0

        let promoters = 0, detractors = 0
        scores.forEach(s => {
            if (s >= 5) promoters++
            else if (s <= 3) detractors++
        })
        const npsScore = scores.length > 0 ? Math.round(((promoters - detractors) / scores.length) * 100) : 0
        const uniqueUsers = new Set(relevantResponses.map(r => r.customerEmail || r.customerPhone || r.id)).size

        // Strategies (STATIC)
        const avgTopicScores = Object.entries(topicScores).map(([topic, values]) => ({
            topic,
            avg: values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 5
        })).sort((a, b) => a.avg - b.avg)

        const weakestTopics = avgTopicScores.filter(t => t.avg < 4.5).map(t => t.topic)
        if (weakestTopics.length < 3) {
            ['speed', 'service', 'product'].forEach(t => { if (!weakestTopics.includes(t)) weakestTopics.push(t) })
        }
        const generatedStrategies: Strategy[] = weakestTopics.slice(0, 3).map(topic => getStrategyForTopic(industry, topic))

        // Charts
        const chartMap = new Map<string, number>()
        let iterDate = new Date(startDate)
        while (iterDate <= endDate) {
            chartMap.set(format(iterDate, 'dd MMM', { locale: es }), 0)
            iterDate.setDate(iterDate.getDate() + 1)
        }
        relevantResponses.forEach(r => {
            const key = format(new Date(r.createdAt), 'dd MMM', { locale: es })
            if (chartMap.has(key)) chartMap.set(key, (chartMap.get(key) || 0) + 1)
        })
        const chartData = Array.from(chartMap.entries()).map(([name, value]) => ({ name: name.charAt(0).toUpperCase() + name.slice(1), value }))

        const positive = scores.filter(s => s >= 4).length
        const neutral = scores.filter(s => s > 2 && s < 4).length
        const negative = scores.filter(s => s <= 2).length
        const sentimentData = [
            { name: 'Positivo', value: Math.round((positive / (scores.length || 1)) * 100), color: 'from-emerald-400 to-teal-500', bg: 'bg-emerald-500/20', glow: 'shadow-[0_0_15px_rgba(52,211,153,0.5)]' },
            { name: 'Neutral', value: Math.round((neutral / (scores.length || 1)) * 100), color: 'from-amber-400 to-orange-500', bg: 'bg-amber-500/20', glow: 'shadow-[0_0_15px_rgba(251,191,36,0.5)]' },
            { name: 'Negativo', value: Math.round((negative / (scores.length || 1)) * 100), color: 'from-rose-500 to-red-600', bg: 'bg-rose-500/20', glow: 'shadow-[0_0_15px_rgba(244,63,94,0.5)]' },
        ]

        // 6. Staff Leaderboard Calculation (Public)
        const staffMap = new Map<string, { count: number; totalRating: number }>()

        relevantResponses.forEach(r => {
            let staffName = ''
            let rating = 0

            r.answers.forEach((a: any) => {
                const q = allQuestions.find((qu: any) => qu.id === a.questionId)
                if (q) {
                    // Check for Rating
                    if (q.type === 'RATING' || q.type === 'EMOJI' || q.type === 'NPS') {
                        const val = parseFloat(a.value)
                        if (!isNaN(val)) rating = val
                    }
                    // Check for Staff Name (Text answer with keywords)
                    const text = q.text.toLowerCase()
                    const isStaffQuestion = (q.type === 'TEXT' || q.type === 'SHORT_TEXT') &&
                        (text.match(/qui[eé]n te atendi[oó]|nombre.*(mesero|personal|staff)|atendido por/i))

                    if (isStaffQuestion && a.value && a.value.length < 30) {
                        staffName = a.value.trim()
                    }
                }
            })

            // If we found both a staff name and a rating in this response
            if (staffName && rating > 0) {
                // Normalize name (Capitalize first letter)
                const normalizedName = staffName.charAt(0).toUpperCase() + staffName.slice(1).toLowerCase()

                const current = staffMap.get(normalizedName) || { count: 0, totalRating: 0 }
                staffMap.set(normalizedName, {
                    count: current.count + 1,
                    totalRating: current.totalRating + rating
                })
            }
        })

        const staffRanking = Array.from(staffMap.entries()).map(([name, stats]) => ({
            name,
            count: stats.count,
            average: (stats.totalRating / stats.count).toFixed(1)
        }))
            .sort((a, b) => parseFloat(b.average) - parseFloat(a.average))
            .sort((a, b) => b.count - a.count)
            .sort((a, b) => {
                const diff = parseFloat(b.average) - parseFloat(a.average)
                if (Math.abs(diff) < 0.1) return b.count - a.count
                return diff
            })
            .slice(0, 5)

        return {
            metrics: { totalFeedback, avgRating: Number(avgRating.toFixed(1)), npsScore, activeUsers: uniqueUsers },
            chartData,
            sentimentData,
            generatedStrategies,
            staffRanking
        }

    } catch (error) {
        console.error("Public Analytics Error:", error)
        return getEmptyAnalytics()
    }
}


// New Action to get Title/Industry for the public page wrapper
export async function getPublicSurveyMetadata(surveyId: string, token: string) {
    const isValid = await verifyToken(surveyId, token)
    if (!isValid) throw new Error("Invalid Link")

    const survey = await prisma.survey.findUnique({
        where: { id: surveyId },
        select: { userId: true, title: true }
    })

    if (!survey) return null

    // Fetch industry from UserSettings
    const settings = await prisma.userSettings.findUnique({
        where: { userId: survey.userId },
        select: { industry: true }
    })

    return {
        title: survey.title,
        industry: settings?.industry || 'restaurant'
    }
}

function getEmptyAnalytics(): AnalyticsData {
    return {
        metrics: { totalFeedback: 0, avgRating: 0, npsScore: 0, activeUsers: 0 },
        chartData: [],
        sentimentData: [
            { name: 'Positivo', value: 0, color: 'from-emerald-400 to-teal-500', bg: 'bg-emerald-500/20', glow: 'shadow-[0_0_15px_rgba(52,211,153,0.5)]' },
            { name: 'Neutral', value: 0, color: 'from-amber-400 to-orange-500', bg: 'bg-amber-500/20', glow: 'shadow-[0_0_15px_rgba(251,191,36,0.5)]' },
            { name: 'Negativo', value: 0, color: 'from-rose-500 to-red-600', bg: 'bg-rose-500/20', glow: 'shadow-[0_0_15px_rgba(244,63,94,0.5)]' },
        ],
        generatedStrategies: [],
        staffRanking: []
    }
}
