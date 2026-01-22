
import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { getGeminiModel } from '@/lib/gemini'

export async function POST(req: Request) {
    try {
        const body = await req.json()
        const { messages, threadId, audio, branchId } = body
        const { userId } = await auth()

        if (!userId) {
            return new NextResponse("Unauthorized", { status: 401 })
        }

        const referer = req.headers.get('referer') || ''
        // Regex to check if we are in a branch route (e.g. /dashboard/portales/chat)
        // We exclude /dashboard/chat (Global)
        const isBranchRoute = /\/dashboard\/[^/]+\/chat/.test(referer) && !referer.endsWith('/dashboard/chat')

        // STRICT ISOLATION GUARD:
        // If user is in a branch view, we MUST have a branchId. 
        // We forbid falling back to 'userId' (Owner) to prevent data leakage.
        if (isBranchRoute && !branchId) {
            console.error(`[AI_ISOLATION_GUARD] Blocked request. Referer: ${referer}, but branchId missing.`)
            return NextResponse.json({
                role: 'assistant',
                content: "⚠️ **Error de Contexto**: No puedo identificar la sucursal actual. Por favor recarga la página para asegurar el aislamiento de datos."
            })
        }

        const targetUserId = branchId || userId

        console.log(`[AI_CHAT_DEBUG] Request for Thread: ${threadId}`)
        console.log(`[AI_CHAT_DEBUG] Incoming BranchID: ${branchId} (Type: ${typeof branchId})`)
        console.log(`[AI_CHAT_DEBUG] Authenticated UserId: ${userId}`)
        console.log(`[AI_CHAT_DEBUG] Resolved TargetUserId: ${targetUserId}`)

        // 1. Parallel Fetch of Context Data (Scoped to Target Branch)
        const now = new Date()
        const startOfWeek = new Date(now.setDate(now.getDate() - 7))
        
        // Reset to today for reservation query
        const todayStart = new Date()
        todayStart.setHours(0, 0, 0, 0)
        const todayEnd = new Date()
        todayEnd.setHours(23, 59, 59, 999)

        const [userSettings, insights, aggregateStats, recentResponses, activePrograms, branchCount, activeReservationsCount] = await Promise.all([
            // Fetch User Settings
            prisma.userSettings.findUnique({
                where: { userId: targetUserId }
            }),
            // Fetch Long-Term Memory (AI Insights)
            prisma.aIInsight.findMany({
                where: { userId: targetUserId, isActive: true },
                select: { content: true }
            }),
            // Fetch Stats
            prisma.survey.findMany({
                where: { userId: targetUserId },
                include: {
                    _count: { select: { responses: true } },
                    responses: {
                        where: { createdAt: { gte: startOfWeek } },
                        select: { id: true }
                    }
                }
            }),
            // Fetch Recent Qualitative Feedback (Last 20 responses)
            prisma.response.findMany({
                where: {
                    survey: { userId: targetUserId }
                },
                take: 20,
                orderBy: { createdAt: 'desc' },
                include: {
                    answers: {
                        include: {
                            question: {
                                select: { text: true, type: true }
                            }
                        }
                    }
                }
            }),
            // Fetch Active Loyalty Programs
            prisma.loyaltyProgram.count({
                where: { userId: targetUserId, isActive: true }
            }),
            // Fetch Branch Count
            prisma.chainBranch.count({
                where: { chain: { ownerId: targetUserId } }
            }),
            // Fetch Active Reservations for TODAY
            prisma.reservation.count({
                where: {
                    table: { floorPlan: { userId: targetUserId } },
                    date: {
                        gte: todayStart,
                        lte: todayEnd
                    },
                    status: { notIn: ['CANCELED', 'REJECTED', 'NO_SHOW'] }
                }
            })
        ])

        console.log(`[AI_CHAT_DEBUG] Context Found:`)
        console.log(`- Surveys: ${aggregateStats.length}`)
        console.log(`- Insights: ${insights.length}`)
        console.log(`- Recent Responses: ${recentResponses.length}`)
        console.log(`- Active Programs: ${activePrograms}`)
        console.log(`- Branch Count: ${branchCount}`)
        console.log(`- Active Reservations (Today): ${activeReservationsCount}`)


        const businessName = (userSettings as any)?.businessName || "Tu Negocio"
        const industry = (userSettings as any)?.industry || "Comercio General"
        const userPlan = (userSettings as any)?.plan || "FREE"
        const insightText = insights.map((i: any) => `- ${i.content}`).join('\n')

        const totalSurveys = aggregateStats.length
        const totalResponsesThisWeek = aggregateStats.reduce((acc: number, s: any) => acc + s.responses.length, 0)
        const totalResponsesAllTime = aggregateStats.reduce((acc: number, s: any) => acc + s._count.responses, 0)
        const hasResponses = totalResponsesAllTime > 0

        // Format Recent Feedback for AI
        const recentFeedbackText = recentResponses.map((r: any) => {
            const date = new Date(r.createdAt).toLocaleDateString()
            const answersText = r.answers.map((a: any) => {
                return `    * ${a.question.text}: "${a.value}"`
            }).join('\n')
            return `- [${date}]:\n${answersText}`
        }).join('\n\n')

        let SYSTEM_PROMPT = '';

        // --- ARBOL DE DECISIÓN (Priority Order) ---

        // Rama 7: Usuario Bloqueado (Not implemented in this layer, usually Middleware, but safety check)
        // if (userSettings.isBlocked) { ... }

        if (totalSurveys === 0 && totalResponsesAllTime === 0 && activePrograms === 0) {
            // --- RAMA 1: USARIO NUEVO (Onboarding Mode) ---
            SYSTEM_PROMPT = `Actúa como 'HappyMeter Consultant', tu socio estratégico para arrancar ${businessName} (${industry}).
            
            ESTADO: NUEVO NEGOCIO (Sin configuración inicial).
            
            TU OBJETIVO:
            No preguntes "¿qué quieres hacer?". TOMA EL MANDO.
            Tu misión es educar sobre el VALOR de cada herramienta y guiar la configuración.
            
            MENSAJE INICIAL OBLIGATORIO:
            "Bienvenido a HappyMeter 🚀
            Vamos a configurar tu negocio paso a paso para que empieces a recibir clientes, opiniones y ventas."
            
            PLAN DE ACCIÓN (Explica el POR QUÉ de cada paso):
            
            **👉 Paso 1: Crea tu primera encuesta de satisfacción**
            - **¿Para qué sirve?**: Medir la experiencia real del cliente y detectar fallos invisibles.
            - **Resultados**: Mejora reputación y decisiones operativas.
            - **Acción**: Ve a "Nueva Encuesta" y selecciona la plantilla básica.

            **👉 Paso 2: Configura tu programa de lealtad**
            - **¿Para qué sirve?**: Provocar que el cliente regrese 2 veces más rápido.
            - **Estrategia**: Elige "Visitas" (simple) o "Puntos" (ticket alto).
            - **Ejemplo**: "5 visitas = 1 Postre gratis".

            **👉 Paso 3: Crea el mapa de tu negocio**
            - **¿Para qué sirve?**: Identificar qué zonas (mesas/áreas) venden más o generan más quejas.
            - **Acción**: Sube una foto de tu plano en "Espacios".

            CIERRE MOTIVADOR:
            "Esta configuración es la base de tu crecimiento. ¿Empezamos por la Encuesta?"
            `

        } else if (totalSurveys > 0 && totalResponsesAllTime === 0) {
            // --- RAMA 2: ACTIVACIÓN (Encuestas listas, sin datos) ---
            SYSTEM_PROMPT = `Actúa como 'HappyMeter Consultant', especialista en lanzamiento.
            
            ESTADO: INFRAESTRUCTURA LISTA, PERO INACTIVA (0 Respuestas).
            
            TU MENSAJE CLAVE:
            "Tu encuesta ya está lista, ahora vamos a activarla para que empieces a recibir respuestas."
            
            GUÍA DE ACTIVACIÓN (Educativa):
            
            **1. El Poder del QR**
            - Imprímelo y colócalo en cada mesa o mostrador.
            - *Tip*: Un acrílico pequeño aumenta 40% la participación.

            **2. Invitación Directa**
            - Instruye a tu equipo: "Al entregar la cuenta, inviten amablemente a evaluar".
            - *Por qué*: El cliente se siente valorado y escuchado.

            **3. WhatsApp (El arma secreta)**
            - Envía el link de la encuesta a tu base de datos hoy mismo.
            
            CTA (Acción):
            "¿Quieres que te muestre dónde descargar tu QR oficial?"
            `

        } else if (!branchId && branchCount > 1) {
            // --- RAMA 6: MULTI-SUCURSAL (Vista Global) ---
            SYSTEM_PROMPT = `Actúa como 'HappyMeter Manager', supervisor de red para ${businessName}.
            
            ESTADO: VISTA GLOBAL (Tiene ${branchCount} sucursales).
            
            TU OBJETIVO:
            Ofrecer una visión comparativa y ayudar a gestionar la complejidad.
            
            DATOS GLOBALES:
            - Total Respuestas: ${totalResponsesAllTime}
            
            ACCIONES:
            - Si pregunta por rendimiento, compara las sucursales (aunque no tengas el detalle aquí, sugiere ir a la vista de cada una).
            - Pregunta: "¿Sobre cuál sucursal te gustaría profundizar hoy?"
            `

        } else {
            // --- RAMA 3: ANÁLISIS (Standard Mode - Tiene respuestas) ---
            SYSTEM_PROMPT = `Actúa como 'HappyMeter Analyst', experto en datos para ${businessName}.
            
            ESTADO: OPERACIÓN ACTIVA (${totalResponsesAllTime} respuestas históricas).
            
            DATOS OPERATIVOS (HOY):
            - Reservaciones Activas: ${activeReservationsCount}
            
            MEMORIA:
            ${insightText || "Sin insights previos."}
            
            FEEDBACK RECIENTE (Últimos 20):
            ${recentFeedbackText}
            
            TU OBJETIVO:
            Analizar patrones, resumir feedback y asistir con datos operativos reales.
            
            REGLAS:
            1. **Identifica Patrones**: "He detectado que los clientes mencionan mucho..."
            2. **Alerta Problemas**: Si ves quejas recientes, avisa prioritariamente.
            3. **Datos Reales**: Si preguntan por reservaciones, USA EL DATO DE "DATOS OPERATIVOS" (${activeReservationsCount}). NO digas que no tienes acceso.
            4. **Sé Proactivo**: "Tu siguiente mejor acción sería..."
            5. **Formato**: Usa viñetas claras.
            6. **Reportes**: Si piden reporte, responde solo: [[ACTION:GENERATE_REPORT]].
            `
        }

        // ... (End of Branch Logic)

        // --- BASE DE CONOCIMIENTO EXPERTA (Global) ---
        // Se anexa a cualquier rama para responder "Cómo implementar X" con nivel experto.

        SYSTEM_PROMPT += `
        
        🧠 REGLAS DE RESPUESTA EXPERTA:
        
        TU INDUSTRIA ACTUAL: ${industry || "General"}
        DATOS DE RESERVACIONES (HOY): ${activeReservationsCount} (Úsalos si preguntan "¿cuántas tengo?").
        
        USAS ESTAS ESTRATEGIAS SEGÚN EL GIRO:

        === 1. PROGRAMA DE LEALTAD ===
        Si preguntan por Lealtad, responde siguiendo esta estructura:
        1. **Beneficio**: ¿Por qué sirve en su giro?
        2. **Estrategia Recomendada**:
           - 🍔 Restaurante/Bar: Lealtad por Visitas (Meta corta: 5-8 visitas). Recompensa: Consumo/Bebida.
           - ☕ Cafetería: Sellos digitales (7 cafés = 1 gratis).
           - 🏋️ Gym: Asistencia mensual. Recompensa: Clase exclusiva o descuento de producto.
           - 🛍️ Retail: Puntos por compra.
        3. **Implementación**: "Crear programa" -> "Definir regla" -> "Activar QR".
        4. **Buenas Prácticas**: Premios alcanzables, personal capacitado.

        === 2. RESERVACIONES ===
        Si preguntan por Reservas:
        SI PREGUNTAN CANTIDAD: Responde "Tienes ${activeReservationsCount} reservaciones activas para hoy."
        SI PREGUNTAN CÓMO IMPLEMENTAR:
        1. **Beneficio**: Reduce mesas vacías y mejora ticket promedio.
        2. **Estrategia**:
           - 🍔 Restaurante: Tiempo límite (turnos) + Confirmación WhatsApp.
           - 🍸 Bar/Antro: VIP, Control de aforo, Venta de mesas con anticipo.
        3. **Implementación**: "Activar módulo" -> "Definir horarios/reglas" -> "Compartir Link".

        === 3. TAREAS Y PROCESOS ===
        Si preguntan por Tareas:
        1. **Beneficio**: Estandariza operación y reduce errores.
        2. **Ejemplos**:
           - 🍔 Restaurante: Checklist de Apertura/Cierre, Limpieza de baños, Inventarios.
           - 🏋️ Gym: Mantenimiento de equipo, Limpieza de pesas.
           - 🛍️ Retail: Recepción de mercancía, Corte de caja.
        3. **Implementación**: "Crear proceso" -> "Asignar responsable" -> "Monitorear".

        ❌ REGLAS DE PERSONALIDAD:
        - NUNCA respondas genérico si tienes datos.
        - Actúa como Consultor de Negocio, Gerente Operativo y Estratega.
        - NO actúes como Soporte Técnico pasivo.
        `

        // RAMA 4: LÍMITES (Context Injection)
        // Check limits based on plan hardcoded logic (mirroring frontend)
        const LIMITS_MAP: any = { FREE: 1, GROWTH: 1, POWER: 3, CHAIN: 50 };
        const baseLimit = LIMITS_MAP[userPlan] || 1;
        const extraSurveys = (userSettings as any)?.extraSurveys || 0;
        const totalLimit = baseLimit + extraSurveys;

        if (totalSurveys >= totalLimit) {
            SYSTEM_PROMPT += `
            
            NOTA DE CONTEXTO (LÍMITES):
            El usuario ha alcanzado su límite de encuestas (${totalSurveys}/${totalLimit}).
            Si intenta crear otra o pregunta por qué no puede, explícale que ha llegado al tope de su plan ${userPlan}.
            OPCIONES:
            1. "Agregar una encuesta extra" ($200 MXN).
            2. "Mejorar a un plan superior".
            `
        }

        // 4. Save User Message to DB (if threadId provided)
        if (threadId) {
            const lastUserMsg = messages[messages.length - 1]
            await prisma.chatMessage.create({
                data: {
                    threadId,
                    role: 'user',
                    content: lastUserMsg.content
                }
            })
        }

        // Dry run
        if (!process.env.GEMINI_API_KEY) {
            console.warn('[AI_CHAT] Missing GEMINI_API_KEY. Returning demo response.')
            return NextResponse.json({
                role: 'assistant',
                content: "Modo demo: No puedo conectar con mi cerebro principal (Falta API Key). Configúrala en Vercel.",
                newTitle: undefined
            })
        }

        const model = getGeminiModel('gemini-flash-latest', {
            systemInstruction: SYSTEM_PROMPT
        })

        // Map messages to Gemini Format
        // Map messages to Gemini Format
        let geminiHistory = messages.map((m: any) => ({
            role: m.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: m.content }]
        }))

        // Inject Audio into the last user message
        if (audio && geminiHistory.length > 0) {
            const lastMsg = geminiHistory[geminiHistory.length - 1]
            if (lastMsg.role === 'user') {
                lastMsg.parts.push({
                    inlineData: {
                        mimeType: 'audio/webm',
                        data: audio
                    }
                })
            }
        }

        // Gemini restriction: First message must be 'user'. 
        const firstUserIndex = geminiHistory.findIndex((m: any) => m.role === 'user')
        if (firstUserIndex !== -1) {
            geminiHistory = geminiHistory.slice(firstUserIndex)
        }

        const result = await model.generateContent({
            contents: geminiHistory
        })

        const responseText = result.response.text()

        let newTitle = undefined

        // 5. Save Assistant Response and Generate Title
        if (threadId) {
            const lastUserMsg = messages[messages.length - 1]
            // Async learning (fire and forget)
            extractInsights(targetUserId, threadId, lastUserMsg.content).catch(console.error)

            await prisma.chatMessage.create({
                data: {
                    threadId,
                    role: 'assistant',
                    content: responseText
                }
            })

            // Generate Title Logic (Self-Healing)
            // fetch current thread to see if it needs a title
            const currentThread = await prisma.chatThread.findUnique({
                where: { id: threadId },
                select: { title: true }
            })

            console.log(`[TITLE_GEN] Check for thread ${threadId}. Title: "${currentThread?.title}". MsgLen: ${messages.length}`)

            // Generate if it's new (short history) OR if it still has the default name
            if (currentThread?.title === "Nuevo Chat" || messages.length <= 2) {
                try {
                    console.log('[TITLE_GEN] Generating new title...')
                    const titleModel = getGeminiModel('gemini-flash-latest', {
                        systemInstruction: `Genera un título muy corto, conciso y descriptivo (máximo 4 palabras) para un chat. Basado en este mensaje: "${lastUserMsg.content}". Ejemplo: "Estrategia de Ventas", "Análisis de Quejas". NO uses comillas ni puntos finales.`
                    })
                    const titleResult = await titleModel.generateContent(lastUserMsg.content)
                    const title = titleResult.response.text().trim()

                    console.log(`[TITLE_GEN] Generated title: "${title}"`)

                    if (title && title.length < 50) { // Safety check length
                        await prisma.chatThread.update({
                            where: { id: threadId },
                            data: { title }
                        })
                        newTitle = title
                    }
                } catch (e) {
                    console.error('[AI_CHAT_TITLE] Failed to generate title', e)
                }
            }
        }

        return NextResponse.json({ role: 'assistant', content: responseText, newTitle })

    } catch (error) {
        console.error('[AI_CHAT_POST]', error)
        const errorMessage = error instanceof Error ? error.message : String(error)
        return new NextResponse(JSON.stringify({ error: errorMessage }), { status: 500 })
    }
}

// Background function to extract insights
async function extractInsights(userId: string, threadId: string, lastUserMessage: string) {
    // Basic heuristic: check for phrases like "mi objetivo es", "quiero", "importante para mi"
    // In production, this would be a separate LLM call.
    const lower = lastUserMessage.toLowerCase()

    let newInsight = null
    if (lower.includes("mi objetivo es")) {
        newInsight = `Objetivo del usuario: "${lastUserMessage}"`
    } else if (lower.includes("preferimos")) {
        newInsight = `Preferencia de negocio: "${lastUserMessage}"`
    }

    if (newInsight) {
        await prisma.aIInsight.create({
            data: { userId, content: newInsight, source: threadId }
        })
        console.log(`[AI MEMORY] Learned new insight: ${newInsight}`)
    }
}
