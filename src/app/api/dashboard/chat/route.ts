
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
            // Auto-heal? Maybe we can find the branch? No, safer to ask refresh.
            return NextResponse.json({
                role: 'assistant',
                content: "⚠️ **Contexto Perdido**: No detecto la sucursal actual. ¿Podrías recargar la página? Estoy ajustando mis conexiones neuronales. 🔄"
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
        const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1)

        // Time ranges
        const todayStart = new Date()
        todayStart.setHours(0, 0, 0, 0)
        const todayEnd = new Date()
        todayEnd.setHours(23, 59, 59, 999)

        const yesterdayStart = new Date(todayStart)
        yesterdayStart.setDate(yesterdayStart.getDate() - 1)
        const yesterdayEnd = new Date(todayEnd)
        yesterdayEnd.setDate(yesterdayEnd.getDate() - 1)

        const [
            userSettings,
            insights,
            aggregateStats,
            recentResponses,
            activePrograms,
            branchCount,
            activeReservationsCount,
            // New Metrics
            loyaltyMembers,
            loyaltyRedemptionsMonth,
            loyaltyPointsRedeemedToday,
            satisfactionRatings,
            complaintsYesterday,
            reservationsSeated,
            processData,
            globalBranches,
            _unusedStats
        ] = await Promise.all([
            // 1. Settings
            prisma.userSettings.findUnique({ where: { userId: targetUserId } }),
            // 2. Insights
            prisma.aIInsight.findMany({ where: { userId: targetUserId, isActive: true }, select: { content: true } }),
            // 3. Stats (General)
            prisma.survey.findMany({
                where: { userId: targetUserId },
                include: { _count: { select: { responses: true } } }
            }),
            // 4. Recent Responses
            prisma.response.findMany({
                where: { survey: { userId: targetUserId } },
                take: 20,
                orderBy: { createdAt: 'desc' },
                include: { answers: { include: { question: { select: { text: true, type: true } } } } }
            }),
            // 5. Active Programs
            prisma.loyaltyProgram.count({ where: { userId: targetUserId, isActive: true } }),
            // 6. Branch Count
            prisma.chainBranch.count({ where: { chain: { ownerId: targetUserId } } }),
            // 7. Active Reservations (Today)
            prisma.reservation.count({
                where: {
                    table: { floorPlan: { userId: targetUserId } },
                    date: { gte: todayStart, lte: todayEnd },
                    status: { notIn: ['CANCELED', 'REJECTED', 'NO_SHOW'] }
                }
            }),
            // 8. Loyalty Members
            prisma.loyaltyCustomer.count({ where: { program: { userId: targetUserId } } }),
            // 9. Rewards Delivered (Month)
            prisma.loyaltyRedemption.count({
                where: {
                    program: { userId: targetUserId },
                    redeemedAt: { gte: startOfMonth },
                    status: 'REDEEMED'
                }
            }),
            // 10. Points Redeemed Today (Need to sum manually)
            prisma.loyaltyRedemption.findMany({
                where: {
                    program: { userId: targetUserId },
                    redeemedAt: { gte: todayStart, lte: todayEnd },
                    status: 'REDEEMED'
                },
                include: { reward: { select: { costInPoints: true } } }
            }),
            // 11. Satisfaction Ratings (Last 7 days)
            prisma.answer.findMany({
                where: {
                    question: { type: { in: ['RATING', 'NPS', 'SMILEY'] } },
                    response: { survey: { userId: targetUserId }, createdAt: { gte: startOfWeek } }
                },
                select: { value: true }
            }),
            // 12. Complaints Yesterday
            prisma.notification.count({
                where: {
                    userId: targetUserId,
                    type: 'CRISIS',
                    createdAt: { gte: yesterdayStart, lte: yesterdayEnd }
                }
            }),
            // 13. Seated Tables (Live)
            prisma.reservation.count({
                where: {
                    table: { floorPlan: { userId: targetUserId } },
                    status: 'SEATED'
                }
            }),
            // 14. Processes (Total vs Completed Today)
            Promise.all([
                prisma.processTask.count({ where: { zone: { userId: targetUserId } } }),
                prisma.processEvidence.count({
                    where: { task: { zone: { userId: targetUserId } }, submittedAt: { gte: todayStart, lte: todayEnd } }
                })
            ]),
            // 15. Global Branch Data (Only formatted and used if !branchId)
            !branchId ? prisma.chainBranch.findMany({
                where: { chain: { ownerId: targetUserId } },
                include: {
                    branch: {
                        select: {
                            userId: true,
                            businessName: true
                        }
                    }
                }
            }) : Promise.resolve([]),
            // 16. Aggregate Stats per Branch (Only if !branchId)
            // 16. Aggregate Stats (Moved to on-demand logic)
            Promise.resolve([])
        ])

        // --- CALCULATIONS ---

        // Points Redeemed
        const pointsRedeemedCount = loyaltyPointsRedeemedToday.reduce((acc, r) => acc + (r.reward?.costInPoints || 0), 0)

        // Avg Satisfaction
        const validRatings = satisfactionRatings
            .map(r => parseInt(r.value))
            .filter(v => !isNaN(v) && v > 0)
        const avgSatisfaction = validRatings.length > 0
            ? (validRatings.reduce((a, b) => a + b, 0) / validRatings.length).toFixed(1)
            : "N/A"

        // Process Stats
        const totalTasks = processData[0]
        const tasksCompletedToday = processData[1]
        const tasksPending = Math.max(0, totalTasks - tasksCompletedToday)

        console.log(`[AI_CHAT_DEBUG] Full Context Loaded`)
        console.log(`- Loyalty: ${loyaltyMembers} members, ${pointsRedeemedCount} points redeemed today`)
        console.log(`- Ops: ${activeReservationsCount} reservations, ${reservationsSeated} seated`)
        console.log(`- Quality: Avg ${avgSatisfaction}, ${complaintsYesterday} complaints yesterday`)

        const businessName = (userSettings as any)?.businessName || "Tu Negocio"
        const industry = (userSettings as any)?.industry || "Comercio General"
        const userPlan = (userSettings as any)?.plan || "FREE"
        const insightText = insights.map((i: any) => `- ${i.content}`).join('\n')

        const totalSurveys = aggregateStats.length
        const totalResponsesAllTime = aggregateStats.reduce((acc: number, s: any) => acc + s._count.responses, 0)

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

        if (totalSurveys === 0 && totalResponsesAllTime === 0 && activePrograms === 0) {
            // --- RAMA 1: USARIO NUEVO (Onboarding Mode) ---
            SYSTEM_PROMPT = `Actúa como 'HappyMeter Consultant', tu socio estratégico para arrancar ${businessName} (${industry}).
            
            ESTADO: NUEVO NEGOCIO (Sin configuración inicial).
            
            TU OBJETIVO: TOMA EL MANDO. Educa sobre el VALOR de cada herramienta.
            
            MENSAJE INICIAL: "Bienvenido a HappyMeter 🚀. Vamos a configurar tu negocio."
            
            PLAN DE ACCIÓN:
            1. Encuesta de Satisfacción (Medir experiencia).
            2. Programa de Lealtad (Retener clientes).
            3. Mapa de Mesas (Optimizar operación).
            `

        } else if (totalSurveys > 0 && totalResponsesAllTime === 0) {
            // --- RAMA 2: ACTIVACIÓN ---
            SYSTEM_PROMPT = `Actúa como 'HappyMeter Consultant'.
            
            ESTADO: INFRAESTRUCTURA LISTA, PERO INACTIVA.
            
            MENSAJE CLAVE: "Activa tus encuestas para recibir datos."
            
            ESTRATEGIAS:
            1. QR en mesas.
            2. Invitación del personal.
            3. WhatsApp.
            `



        } else if ((!branchId && branchCount > 0) || (body.corporate === true)) {
            // --- RAMA 6: MULTI-SUCURSAL (CORPORATE INTELLIGENCE) ---

            // 1. Fetch Deep Operational Data per Branch
            let branchBreakdown = "Información detallada por sucursal no disponible.";

            if (globalBranches && globalBranches.length > 0) {
                const branchUserIds = (globalBranches as any[]).map((b: any) => b.branchId);

                // Parallel Fetch for Critical Indicators (Last 30 Days)
                const thirtyDaysAgo = new Date();
                thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

                const [
                    negativeFeedbackMap,
                    staffReportsMap,
                    processComplianceMap,
                    reservationsMap,
                    responseCountsMap
                ] = await Promise.all([
                    // A. Negative Feedback (Last 30 Days) - Fetch full response context
                    prisma.response.findMany({
                        where: {
                            survey: { userId: { in: branchUserIds } },
                            answers: { some: { value: { in: ['1', '2'] } } },
                            createdAt: { gte: thirtyDaysAgo }
                        },
                        select: {
                            survey: { select: { userId: true } },
                            answers: {
                                select: {
                                    value: true,
                                    question: { select: { type: true, text: true } }
                                }
                            }
                        },
                        take: 100 // Cap to prevent huge context
                    }),
                    // B. Staff Reports (System Notifications)
                    prisma.notification.findMany({
                        where: {
                            userId: { in: branchUserIds },
                            type: 'SYSTEM', // Staff Box Alerts
                            createdAt: { gte: thirtyDaysAgo }
                        },
                        select: { userId: true, title: true }
                    }),
                    // C. Process Compliance (Completed Tasks / Total Tasks - Approx)
                    // Hard to get exact % without huge query, getting raw completion count for now
                    prisma.processEvidence.findMany({
                        where: {
                            task: { zone: { userId: { in: branchUserIds } } },
                            submittedAt: { gte: thirtyDaysAgo }
                        },
                        select: { task: { select: { zone: { select: { userId: true } } } } }
                    }),
                    // D. Active Reservations (Future)
                    prisma.reservation.groupBy({
                        by: ['tableId'], // Group by table isn't helpful for branch summing, need richer query or simple count
                        where: {
                            date: { gte: new Date() },
                            status: { not: 'CANCELED' }
                            // Linking to branch is harder via floorplan, need separate query per branch or intricate join. 
                            // Simplified: Just fetch counts if possible or skip for efficiency if complexity is too high.
                            // Let's do a findMany with include for accuracy.
                        },
                        _count: true
                        // Complexity: Reservation -> Table -> FloorPlan -> UserId. Prisma groupBy doesn't support deep relation filtering easily in one go.
                        // Fallback: We will infer activity from Response Count for now or fetch simple count if vital.
                        // Let's skip complex reservation query for speed and rely on Feedback Volume as proxy for traffic.
                    }),
                    // E. Total Response Volume
                    prisma.survey.findMany({
                        where: { userId: { in: branchUserIds } },
                        include: { _count: { select: { responses: true } } }
                    })
                ]);

                // Process Data Maps
                const negMap = new Map<string, number>();
                const commentsMap = new Map<string, string[]>();

                (negativeFeedbackMap as any[]).forEach((resp: any) => {
                    const bid = resp.survey.userId;
                    negMap.set(bid, (negMap.get(bid) || 0) + 1);

                    // Extract comments from this negative response
                    const comments = resp.answers
                        .filter((a: any) => a.question.type === 'TEXT' || a.question.type === 'LONG_TEXT')
                        .map((a: any) => a.value)
                        .filter((v: any) => v && v.length > 3);

                    if (comments.length > 0) {
                        const existing = commentsMap.get(bid) || [];
                        // Limit to 5 comments per branch to save context
                        if (existing.length < 5) {
                            commentsMap.set(bid, [...existing, ...comments]);
                        }
                    }
                });

                const staffMap = new Map<string, number>();
                staffReportsMap.forEach((item: any) => {
                    staffMap.set(item.userId, (staffMap.get(item.userId) || 0) + 1);
                });

                const processMap = new Map<string, number>();
                processComplianceMap.forEach((item: any) => {
                    const bid = item.task.zone.userId;
                    processMap.set(bid, (processMap.get(bid) || 0) + 1);
                });

                const volumeMap = new Map<string, number>();
                (responseCountsMap as any[]).forEach((s: any) => {
                    volumeMap.set(s.userId, (volumeMap.get(s.userId) || 0) + (s._count?.responses || 0));
                });


                branchBreakdown = (globalBranches as any[])
                    .map((b: any) => {
                        const bid = b.branchId;
                        let name = b.name;

                        // FIX: If name is "Sede Principal", try to use the Business Name instead to treat it as a real branch
                        if (!name || name === 'Sede Principal' || name === 'Sede principal') {
                            name = b.branch.businessName || name || "Sucursal";
                        }

                        const vol = volumeMap.get(bid) || 0;
                        const neg = negMap.get(bid) || 0;
                        const staff = staffMap.get(bid) || 0;
                        const proc = processMap.get(bid) || 0;

                        const activeComments = commentsMap.get(bid) || [];

                        // Risk Assessment
                        const risks = [];
                        if (neg > 2) risks.push(`📉 ${neg} Quejas Graves`);
                        if (staff > 0) risks.push(`🚨 ${staff} Conflictos Staff`);
                        if (vol === 0) risks.push(`⚠️ Sin Actividad (QRs?)`);
                        if (proc === 0) risks.push(`⚙️ Sin Procesos`);

                        const status = risks.length > 0 ? `RIESGOS: ${risks.join(', ')}` : "✅ Operación Saludable";
                        const commentsSection = activeComments.length > 0 ? `\n   - "Quejas Reales": ${activeComments.map(c => `"${c}"`).join(', ')}` : "";

                        return `### ${name}\n- Volumen Feedback: ${vol}\n- Estado: ${status}${commentsSection}`;
                    })
                    .join('\n\n');
            }

            SYSTEM_PROMPT = `Actúa como 'HappyMeter Corporate Director'.

            ESTADO: VISTA DE CORPORATIVO (Análisis Multi-Sucursal).
            
            📊 REPORTE DE INTELIGENCIA OPERATIVA (Últimos 30 Días):
            
            ${branchBreakdown}
            
            OBJETIVO: 
            Actuar como un consultor operativo experto. No solo señales el riesgo, ANALIZA LA CAUSA RAÍZ basándote en los textos de las "Quejas Reales" (si los hay).
            
            REGLAS DE ANÁLISIS:
            1. **DETECTA EL PROBLEMA REAL**: No digas solo "Tiene quejas". Si los comentarios dicen "fría", el problema es TEMPERATURA. Si dicen "lentos", es VELOCIDAD. Si dicen "groseros", es ACTITUD.
            2. **SOLUCIÓN CORTA**: Para cada sucursal con problemas, da 1 acción táctica inmediata (ej. "Auditar tiempos de cocina" o "Checklist de limpieza baños").
            3. **INTERACCIÓN OBLIGATORIA**:
               - AL FINAL DE TU RESPUESTA, pregunta SIEMPRE:
               "¿Quieres que diseñemos un plan de acción detallado para alguna sucursal en específico?"
            
            FORMATO DE RESPUESTA REQUERIDO:
            
            ### [Nombre Sucursal]
            🔴 **Problema Principal**: [Causa raíz basada en las quejas]
            💡 **Acción Inmediata**: [Solución táctica de 1 línea]
            
            (Repetir solo para sucursales con Riesgos)
            
            ⚠️ *[Pregunta de Cierre Interactiva]*
            `;
        } else {
            // --- RAMA 3: ANÁLISIS & OPERACIÓN (Full Power Mode) ---
            SYSTEM_PROMPT = `Actúa como 'HappyMeter Analyst', el cerebro central de ${businessName}.
            
            📊[CENTRO DE COMANDO OPERATIVO] 📊
            
            === 💎 LEALTAD & CLIENTES ===
                - Miembros Activos: ${loyaltyMembers}
            - Premios Entregados(Este Mes): ${loyaltyRedemptionsMonth}
            - Puntos Canjeados(Hoy): ${pointsRedeemedCount} pts

                === 🍽️ RESERVACIONES & MESAS ===
                    - Reservaciones Activas(Hoy): ${activeReservationsCount}
            - Mesas Ocupadas(Ahora): ${reservationsSeated}
            
            === ⭐ SATISFACCIÓN & CALIDAD ===
                - Calificación Semanal: ${avgSatisfaction}/5
                    - Quejas(Ayer): ${complaintsYesterday}
            - Total Historico: ${totalResponsesAllTime} respuestas

                === ✅ TAREAS & PROCESOS ===
                    - Tareas Pendientes(Hoy): ${tasksPending}
            - Tareas Completadas(Hoy): ${tasksCompletedToday}
            
            🧠 MEMORIA ESTRATÉGICA:
            ${insightText || "Sin insights previos."}
            
            FEEDBACK RECIENTE:
            ${recentFeedbackText}
            
            TU OBJETIVO:
            Ser el ASISTENTE OPERATIVO DEFINITIVO.No des respuestas genéricas.
            
            REGLAS DE ORO:
            1. ** USA LOS DATOS **: Si preguntan "¿cuántos puntos se canjearon?", responde: "Hoy se han canjeado ${pointsRedeemedCount} puntos."
            2. ** IDENTIFICA EL MÓDULO **:
            - Preguntas de dinero / premios -> Módulo Lealtad.
               - Preguntas de mesas / gente -> Módulo Reservaciones.
               - Preguntas de opiniones / quejas -> Módulo Satisfacción.
            3. ** SÉ DIRECTO **: Dato exacto primero, luego el análisis.
            4. ** MANEJO DE DATOS VACÍOS(OBLIGATORIO) **:
               Si un dato es 0 o N / A, debes cumplir 2 pasos:
               a) Informar: "El módulo está activo, pero aún no registra datos (0)."
               b) OFRECER AYUDA PROACTIVA: "¿Te gustaría que te explique cómo implementarlo correctamente o que te muestre los beneficios que puede traer a tu negocio?"
               NUNCA des una respuesta vacía sin ofrecer esta ayuda.
            `
        }

        // ... (End of Branch Logic)

        SYSTEM_PROMPT += `
        
        🧠 REGLAS DE RESPUESTA EXPERTA(Base de Conocimiento):
        
        TU INDUSTRIA: ${industry || "General"}
        
        SI PREGUNTAN "CÓMO IMPLEMENTAR...":
        
        === 1. LEALTAD ===
                1. Beneficio: Retención x2.
        2. Estrategia: Visitas(Simple) o Puntos(Ticket alto).
        3. Acción: "Crear Programa" -> "QR".

        === 2. RESERVACIONES ===
                1. Beneficio: Menos mesas vacías.
        2. Estrategia: Activar "Tiempo Estándar" para rotación eficiente.
        3. Acción: Ir a Reservas -> Configuración(⚙️).
        
        === 🖼️ ESPACIOS "DECO" ===
                - QUÉ SON: Elementos decorativos(macetas, paredes) no reservables.
        - REGLA: Si ves uno "disponible", es un error.NO SON RESERVABLES.
        - EXPLICACIÓN: "Son solo visuales para dar contexto al mapa."

                === 3. PROCESOS ===
                    1. Beneficio: Estandarización.
        2. Ejemplo: Checklist de Apertura.
        3. Acción: Crear en "Procesos".
        
        ❌ PROHIBIDO:
            - Inventar datos.
        - Decir "consulta tu dashboard" si ya tienes el dato aquí arriba.
        - 🚫 NO USES TABLAS MARKDOWN(como | : --- |).Se ven mal en el chat.
        - 🚫 NO USES SEPARADORES HORIZONTALES(---).Ensucian el diseño.
        - 🚫 NUNCA menciones fechas en formato técnico(ej. 1 / 30 / 2026).Di "Hoy, 30 de Enero".

        ✅ FORMATO PERMITIDO:
        - Usa ** Negritas ** para títulos.
        - Usa > Citas para resaltar datos clave.
        - Usa Listas(1., 2., 3. o •) para enumerar.
        - Usa Emojis para dar vida.
        - Deja espacios en blanco entre párrafos.
        `

        // RAMA 4: LÍMITES (Context Injection)
        // Check limits based on plan hardcoded logic (mirroring frontend)
        const LIMITS_MAP: any = { FREE: 1, GROWTH: 1, POWER: 3, CHAIN: 50 };
        const baseLimit = LIMITS_MAP[userPlan] || 1;
        const extraSurveys = (userSettings as any)?.extraSurveys || 0;
        const totalLimit = baseLimit + extraSurveys;

        if (totalSurveys >= totalLimit) {
            SYSTEM_PROMPT += `
            
            NOTA DE CONTEXTO(LÍMITES):
            El usuario ha alcanzado su límite de encuestas(${totalSurveys} / ${totalLimit}).
            Si intenta crear otra o pregunta por qué no puede, explícale que ha llegado al tope de su plan ${userPlan}.
            OPCIONES:
            1. "Agregar una encuesta extra"($200 MXN).
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

            console.log(`[TITLE_GEN] Check for thread ${threadId}.Title: "${currentThread?.title}".MsgLen: ${messages.length} `)

            // Generate if it's new (short history) OR if it still has the default name
            if (currentThread?.title === "Nuevo Chat" || messages.length <= 2) {
                try {
                    console.log('[TITLE_GEN] Generating new title...')
                    const titleModel = getGeminiModel('gemini-flash-latest', {
                        systemInstruction: `Genera un título muy corto, conciso y descriptivo(máximo 4 palabras) para un chat.Basado en este mensaje: "${lastUserMsg.content}".Ejemplo: "Estrategia de Ventas", "Análisis de Quejas".NO uses comillas ni puntos finales.`
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
        console.log(`[AI MEMORY] Learned new insight: ${newInsight} `)
    }
}
