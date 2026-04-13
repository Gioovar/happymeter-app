export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { getGeminiModel } from '@/lib/gemini'
import { getActiveBusinessId } from '@/lib/tenant'

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

        const activeBusinessId = await getActiveBusinessId()
        const targetUserId = branchId || activeBusinessId || userId

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
            _unusedStats,
            activePromotersCount,
            rpReservationsMonth
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
            // 14. Processes (Total vs Completed Today + Employee Metrics)
            Promise.all([
                prisma.processTask.count({ where: { zone: { userId: targetUserId } } }),
                prisma.processEvidence.count({
                    where: { task: { zone: { userId: targetUserId } }, submittedAt: { gte: todayStart, lte: todayEnd } }
                }),
                // Fetch tasks assigned to staff to calculate individual compliance
                prisma.processTask.findMany({
                    where: { zone: { userId: targetUserId } },
                    include: {
                        assignedStaff: { select: { name: true } },
                        evidences: {
                            where: { submittedAt: { gte: todayStart, lte: todayEnd } },
                            select: { id: true, status: true }
                        }
                    }
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
            Promise.resolve([]),
            // 17. Active Promoters Count
            prisma.promoterProfile.count({ where: { businessId: targetUserId, isActive: true } }),
            // 18. RP Reservations (This Month)
            (prisma as any).reservation.findMany({
                where: {
                    userId: targetUserId,
                    promoterId: { not: null },
                    date: { gte: startOfMonth },
                    status: { in: ['CONFIRMED', 'CHECKED_IN'] }
                },
                select: { promoterId: true, commissionEarned: true, guestType: true, status: true, partySize: true, promoter: { select: { name: true } } }
            })
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
        const totalTasks = processData[0] as number
        const tasksCompletedToday = processData[1] as number
        const tasksPending = Math.max(0, totalTasks - tasksCompletedToday)

        // Employee Task Compliance
        const detailedTasks = processData[2] as any[]
        const staffTaskMap = new Map<string, { total: number, completed: number }>()

        let unassignedTotal = 0
        let unassignedCompleted = 0

        detailedTasks.forEach((task: any) => {
            const isCompleted = task.evidences && task.evidences.length > 0;

            if (task.assignedStaff && task.assignedStaff.name) {
                const staffName = task.assignedStaff.name
                const stats = staffTaskMap.get(staffName) || { total: 0, completed: 0 }
                stats.total += 1
                if (isCompleted) stats.completed += 1
                staffTaskMap.set(staffName, stats)
            } else {
                unassignedTotal += 1
                if (isCompleted) unassignedCompleted += 1
            }
        })

        let employeePerformanceText = "\n=== 👤 RENDIMIENTO DEL EQUIPO (TAREAS HOY) ===\n"
        if (staffTaskMap.size === 0 && unassignedTotal === 0) {
            employeePerformanceText += "- Sin tareas asignadas o configuradas.\n"
        } else {
            staffTaskMap.forEach((stats, staffName) => {
                const statusIcon = stats.completed === stats.total ? "✅" : (stats.completed === 0 ? "🚨 (Atención)" : "⚠️")
                employeePerformanceText += `- ${staffName}: ${stats.completed}/${stats.total} tareas completadas ${statusIcon}\n`
            })
            if (unassignedTotal > 0) {
                employeePerformanceText += `- Sin Asignar (General): ${unassignedCompleted}/${unassignedTotal} tareas completadas\n`
            }
        }

        // --- RPS CALCULATIONS ---
        const totalCommissionsEarned = (rpReservationsMonth as any[]).reduce((sum, r) => sum + (r.commissionEarned || 0), 0)

        let topPromoterName = "N/A"
        let topPromoterGuests = 0
        const rpPerformanceMap = new Map<string, { name: string, guests: number }>()

        let newGuestCount = 0
        let returningGuestCount = 0
        let vipGuestCount = 0

            ; (rpReservationsMonth as any[]).forEach(r => {
                if (r.status === 'CHECKED_IN' || r.status === 'CONFIRMED') {
                    const guests = r.partySize || 0
                    const current = rpPerformanceMap.get(r.promoterId) || { name: r.promoter?.name || 'Desconocido', guests: 0 }
                    current.guests += guests
                    rpPerformanceMap.set(r.promoterId, current)

                    if (current.guests > topPromoterGuests) {
                        topPromoterGuests = current.guests
                        topPromoterName = current.name
                    }
                }
                if (r.guestType === 'VIP') vipGuestCount++
                else if (r.guestType === 'RETURNING') returningGuestCount++
                else if (r.guestType === 'NEW') newGuestCount++
            })

        const rpsRoiText = `Nuevos: ${newGuestCount} | Recurrentes: ${returningGuestCount} | VIPs: ${vipGuestCount}`

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
                    responseCountsMap,
                    staffTasksData,
                    loyaltyProgramsMap,
                    loyaltyCustomersMap
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
                    prisma.reservation.findMany({
                        where: {
                            table: { floorPlan: { userId: { in: branchUserIds } } },
                            date: { gte: todayStart },
                            status: { notIn: ['CANCELED', 'REJECTED', 'NO_SHOW'] }
                        },
                        select: {
                            table: { select: { floorPlan: { select: { userId: true } } } }
                        }
                    }),
                    // E. Total Response Volume
                    prisma.survey.findMany({
                        where: { userId: { in: branchUserIds } },
                        include: { _count: { select: { responses: true } } }
                    }),
                    // F. TODAY'S Task Compliance by Staff
                    prisma.processTask.findMany({
                        where: { zone: { userId: { in: branchUserIds } } },
                        include: {
                            zone: { select: { userId: true } },
                            assignedStaff: { select: { name: true } },
                            evidences: {
                                where: { submittedAt: { gte: todayStart, lte: todayEnd } },
                                select: { id: true, status: true }
                            }
                        }
                    }),
                    // G. Loyalty Programs Status
                    prisma.loyaltyProgram.findMany({
                        where: { userId: { in: branchUserIds } },
                        select: { userId: true, isActive: true }
                    }),
                    // H. Loyalty Customers Count
                    prisma.loyaltyCustomer.findMany({
                        where: { program: { userId: { in: branchUserIds } } },
                        select: { program: { select: { userId: true } } }
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

                const resMap = new Map<string, number>();
                (reservationsMap as any[]).forEach((res: any) => {
                    const bid = res.table?.floorPlan?.userId;
                    if (bid) resMap.set(bid, (resMap.get(bid) || 0) + 1);
                });

                const volumeMap = new Map<string, number>();
                (responseCountsMap as any[]).forEach((s: any) => {
                    volumeMap.set(s.userId, (volumeMap.get(s.userId) || 0) + (s._count?.responses || 0));
                });

                // Detailed Employee Compliance Map (Branch ID -> Array of Staff Names who failed tasks)
                const complianceMap = new Map<string, { total: number, completed: number, failingStaff: Set<string> }>();

                (staffTasksData as any[]).forEach((task: any) => {
                    const bid = task.zone.userId;
                    const isCompleted = task.evidences && task.evidences.length > 0;

                    const branchStats = complianceMap.get(bid) || { total: 0, completed: 0, failingStaff: new Set<string>() };
                    branchStats.total += 1;

                    if (isCompleted) {
                        branchStats.completed += 1;
                    } else if (task.assignedStaff && task.assignedStaff.name) {
                        branchStats.failingStaff.add(task.assignedStaff.name);
                    }

                    complianceMap.set(bid, branchStats);
                });

                const loyaltyProgMap = new Map<string, boolean>();
                (loyaltyProgramsMap as any[]).forEach((prog: any) => {
                    loyaltyProgMap.set(prog.userId, prog.isActive);
                });

                const loyaltyCustMap = new Map<string, number>();
                (loyaltyCustomersMap as any[]).forEach((cust: any) => {
                    const bid = cust.program?.userId;
                    if (bid) loyaltyCustMap.set(bid, (loyaltyCustMap.get(bid) || 0) + 1);
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
                        const resCount = resMap.get(bid) || 0;
                        const compliance = complianceMap.get(bid);
                        const hasLoyalty = loyaltyProgMap.get(bid);
                        const loyaltyMembers = loyaltyCustMap.get(bid) || 0;

                        const activeComments = commentsMap.get(bid) || [];

                        // Risk Assessment & Positive Highlights
                        const risks = [];
                        if (neg > 2) risks.push(`📉 ${neg} Quejas Graves`);
                        if (staff > 0) risks.push(`🚨 ${staff} Conflictos Staff`);
                        if (vol === 0) risks.push(`⚠️ Sin encuestas recientes`);
                        if (compliance && compliance.total > 0 && compliance.completed === 0) risks.push(`⚙️ 0% Tareas Procesos (Riesgo Crítico)`);

                        const status = risks.length > 0 ? `RIESGOS: ${risks.join(', ')}` : "✅ Operación Estable";
                        const commentsSection = activeComments.length > 0 ? `\n   - "Quejas Reales": ${activeComments.map(c => `"${c}"`).join(', ')}` : "";

                        // Formatting text to strictly isolate branch data
                        let complianceSection = "";
                        if (compliance && compliance.total > 0) {
                            const failingNames = Array.from(compliance.failingStaff).slice(0, 3).join(', ');
                            const fallingText = failingNames ? ` (Atrasados: ${failingNames})` : "";
                            complianceSection = `\n- Tareas Procesos Hoy: ${compliance.completed}/${compliance.total}${fallingText}`;
                        } else {
                            complianceSection = `\n- Tareas Procesos Hoy: 0 creadas`;
                        }

                        let resSection = `\n- Reservaciones Activas: ${resCount}`;

                        let loyaltySection = "";
                        if (hasLoyalty) {
                            loyaltySection = `\n- Tarjeta de Lealtad: Activa (${loyaltyMembers} clientes registrados)`;
                        } else {
                            loyaltySection = `\n- Tarjeta de Lealtad: INACTIVA (Recomienda implementarla para retener clientes)`;
                        }

                        return `### [SUCURSAL] ${name}\n- Feedback Mensual: ${vol}\n- Estado: ${status}${commentsSection}${complianceSection}${resSection}${loyaltySection}`;
                    })
                    .join('\n\n');
            }

            SYSTEM_PROMPT = `Actúa como 'HappyMeter Corporate Strategist' (Súper Estratega Corporativo).

            ESTADO: VISTA DE CORPORATIVO (Análisis Multi-Sucursal).
            
            📊 REPORTE DE INTELIGENCIA OPERATIVA (Últimos 30 Días):
            
            ${branchBreakdown}
            
            TU OBJETIVO CENTRAL:
            Ya no eres solo un asistente operativo, eres un ESTRATEGA CORPORATIVO. Tu función principal es leer todas las sucursales simultáneamente, comparar sus métricas y detectar qué está haciendo diferente la mejor sucursal para replicarlo en las demás.
            
            REGLAS DE ANÁLISIS ESCALADO:
            1. **DETECTA PATRONES DE ÉXITO**: Si una sucursal tiene un alto volumen de encuestas sin quejas y un 100% de cumplimiento de Tareas, ASUME que tienen una excelente cultura de procesos.
            2. **IDENTIFICA OPORTUNIDADES INVISIBLES**: Si una sucursal tiene muchas quejas de "lentitud" pero otra no, recomienda cruzar las mejores prácticas (ej. "Replicar el checklist de cocina de Portales en Cuauhtémoc").
            3. **ANALIZA LA CAUSA RAÍZ**: Lee directamente los textos de "Quejas Reales" y no des resúmenes genéricos. Ve directo al grano operativo (ej. en vez de decir "Mejora el servicio", di "Auditar la actitud del mesero del turno tarde").
            4. **ESTRATEGIA REPLICABLE (CLONACIÓN)**: Siempre que sea apropiado, formula recomendaciones que puedan convertirse en reglas para toda la cadena.
            5. **ADVERTENCIAS DE IMPLEMENTACIÓN**: Si notas que una sucursal NO tiene Actividad, NO tiene Tarjeta de Lealtad (inactiva) o NO tiene procesos creados, indícalo de inmediato como un "Punto ciego de gestión".
            
            FORMATO DE RESPUESTA REQUERIDO:
            
            Inicia con un breve resumen Ejecutivo de la Cadena.
            Luego, destaca:
            🟢 **La Estrella del Mes**: (La sucursal con mejor desempeño general y qué están haciendo bien, como Lealtad o Procesos).
            🔴 **Focos Rojos**: (Sucursales con riesgos crónicos, 0% de procesos, o quejas reales críticas).
            💡 **Estrategia a Replicar**: (Extrae la estrategia de la sucursal Estrella y explica cómo implementarla en los Focos Rojos).
            
            ⚠️ Siempre termina preguntando: "¿Quieres que diseñemos un plan de acción estandarizado basado en estas observaciones para aplicarlo en toda la cadena?"`;
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
            ${employeePerformanceText}
            
            === 🌟 PROMOTORES (RPS) & ROI ===
                - Promotores Activos: ${activePromotersCount}
            - Comisiones Generadas (Mes): $${totalCommissionsEarned.toFixed(2)} mxn
            - Mejor RP (Mes): ${topPromoterName} (${topPromoterGuests} invitados)
            - ROI de Tráfico (Mes): ${rpsRoiText}
            
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
