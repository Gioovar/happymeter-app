"use server"

import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import QRCode from 'qrcode'
import { resend } from "@/lib/resend"
import { sendSMS } from "@/lib/sms"
import { sendWhatsAppNotification } from "@/lib/whatsapp"
import { ReservationConfirmationEmail } from "@/emails/ReservationConfirmation"
import { DEFAULT_SENDER } from "@/lib/email"

// Helper to resolve and verify access
async function resolveEffectiveUserId(currentUserId: string, targetBranchId?: string) {
    if (!targetBranchId) return currentUserId
    if (targetBranchId === currentUserId) return currentUserId

    // Verify ownership: Does the current user own the chain that contains this branch?
    const branch = await prisma.chainBranch.findFirst({
        where: {
            branchId: targetBranchId,
            chain: { ownerId: currentUserId }
        }
    })

    if (!branch) {
        console.error(`Unauthorized access attempt: User ${currentUserId} -> Branch ${targetBranchId}`)
        throw new Error("Unauthorized Branch Access")
    }
    return targetBranchId
}

export async function getFloorPlan(branchId?: string) {
    try {
        const plans = await getFloorPlans(branchId)
        return plans[0] || null
    } catch (error) {
        console.error("Error in getFloorPlan:", error)
        return null
    }
}

export async function getFloorPlans(branchId?: string) {
    try {
        const { userId } = await auth()
        if (!userId) {
            console.error("getFloorPlans: No user session found")
            return []
        }

        const effectiveUserId = await resolveEffectiveUserId(userId, branchId)

        // Find UserSettings id from userId
        let userSettings = await prisma.userSettings.findUnique({
            where: { userId: effectiveUserId },
            select: { userId: true }
        })
        // ...

        // [AUTO-HEAL] If user settings missing, create default to avoid blocking
        if (!userSettings) {
            console.log("⚠️ UserSettings missing for reservations, auto-creating...")
            userSettings = await prisma.userSettings.create({
                data: {
                    userId: effectiveUserId,
                    plan: 'FREE',
                }
            })
        }

        // Fetch all floor plans
        let floorPlans = await prisma.floorPlan.findMany({
            where: { userId: effectiveUserId },
            include: { tables: true },
            orderBy: { createdAt: 'asc' }
        })

        if (floorPlans.length === 0) {
            console.log("Creating new default floor plan...")
            const defaultPlan = await prisma.floorPlan.create({
                data: {
                    userId: effectiveUserId,
                    name: "Piso 1",
                    isConfigured: false, // Explicitly false until they save
                    tables: {
                        create: [] // Start empty
                    }
                },
                include: { tables: true }
            })
            return JSON.parse(JSON.stringify([defaultPlan]))
        }

        return JSON.parse(JSON.stringify(floorPlans))
    } catch (error) {
        console.error("🔥 Error in getFloorPlans:", error)
        return []
    }
}

export async function createFloorPlan(name: string, branchId?: string) {
    try {
        const { userId } = await auth()
        if (!userId) throw new Error("Unauthorized")

        const effectiveUserId = await resolveEffectiveUserId(userId, branchId)

        const newPlan = await prisma.floorPlan.create({
            data: {
                userId: effectiveUserId,
                name,
                isConfigured: true
            },
            include: { tables: true }
        })

        revalidatePath('/dashboard/reservations')
        return { success: true, floorPlan: JSON.parse(JSON.stringify(newPlan)) }
    } catch (error) {
        console.error("Error creating floor plan:", error)
        return { success: false, error: "Failed to create floor plan" }
    }
}

export async function deleteFloorPlan(floorPlanId: string, branchId?: string) {
    try {
        const { userId } = await auth()
        if (!userId) throw new Error("Unauthorized")

        const effectiveUserId = await resolveEffectiveUserId(userId, branchId)

        // Check if there are other floors
        const count = await prisma.floorPlan.count({ where: { userId: effectiveUserId } })
        if (count <= 1) {
            return { success: false, error: "Cannot delete the last floor plan." }
        }

        await prisma.floorPlan.delete({
            where: { id: floorPlanId, userId: effectiveUserId }
        })

        revalidatePath('/dashboard/reservations')
        return { success: true }
    } catch (error) {
        console.error("Error deleting floor plan:", error)
        return { success: false, error: "Failed to delete floor plan" }
    }
}

export async function updateFloorMetadata(floorPlanId: string, data: { name: string, width: number, height: number }, branchId?: string) {
    try {
        const { userId } = await auth()
        if (!userId) throw new Error("Unauthorized")

        const effectiveUserId = await resolveEffectiveUserId(userId, branchId)

        const updated = await prisma.floorPlan.update({
            where: { id: floorPlanId, userId: effectiveUserId },
            data: {
                name: data.name,
                physicalWidth: data.width,
                physicalHeight: data.height
            }
        })
        revalidatePath('/dashboard/reservations')
        return { success: true, floorPlan: JSON.parse(JSON.stringify(updated)) }
    } catch (error) {
        console.error("Error updating floor metadata:", error)
        return { success: false, error: "Failed to update floor metadata" }
    }
}

export async function saveFloorPlan(floorPlanId: string, tables: any[], branchId?: string) {
    const { userId } = await auth()
    if (!userId) throw new Error("Unauthorized")

    const effectiveUserId = await resolveEffectiveUserId(userId, branchId)

    // Verify ownership
    const floorPlan = await prisma.floorPlan.findFirst({
        where: { id: floorPlanId, userId: effectiveUserId }
    })

    if (!floorPlan) throw new Error("Floor plan not found")

    // Transaction to update all tables
    await prisma.$transaction(async (tx) => {
        // 1. Delete tables that are no longer in the list (if any logic requires it, but simple update/upsert is safer)
        // For simplicity in this editor, we'll upsert or delete.
        // Strategy: Get current IDs, identify deleted ones.

        const currentTables = await tx.table.findMany({
            where: { floorPlanId }
        })
        const currentIds = currentTables.map(t => t.id)
        const incomingIds = tables.filter(t => t.id).map(t => t.id)

        const toDelete = currentIds.filter(id => !incomingIds.includes(id))

        if (toDelete.length > 0) {
            await tx.table.deleteMany({
                where: { id: { in: toDelete } }
            })
        }

        // 2. Upsert (Create or Update)
        for (const table of tables) {
            if (table.id && !table.id.startsWith('temp-') && !table.id.startsWith('shape-')) {
                // Check if it exists to be safe
                const exists = currentIds.includes(table.id)
                if (exists) {
                    // Update
                    await tx.table.update({
                        where: { id: table.id },
                        data: {
                            x: table.x,
                            y: table.y,
                            width: table.width,
                            height: table.height,
                            rotation: table.rotation,
                            label: table.label,
                            type: table.type,
                            capacity: table.capacity,
                            points: table.points,
                            reservationPrice: table.reservationPrice || 0
                        }
                    })
                    continue
                }
            }

            // Create (new or temp id)
            await tx.table.create({
                data: {
                    floorPlanId,
                    x: table.x,
                    y: table.y,
                    width: table.width,
                    height: table.height,
                    rotation: table.rotation,
                    label: table.label,
                    type: table.type,
                    capacity: table.capacity,
                    points: table.points,
                    reservationPrice: table.reservationPrice || 0
                }
            })

        }
    })

    // 3. Mark as configured
    await prisma.floorPlan.update({
        where: { id: floorPlanId },
        data: { isConfigured: true }
    })

    revalidatePath('/dashboard/reservations')
    return { success: true }
}

// Public: Open reservation page data
export async function getProgramFloorPlan(programId: string) {
    try {
        const program = await prisma.loyaltyProgram.findUnique({
            where: { id: programId },
            select: {
                userId: true,
                businessName: true,
                user: {
                    select: {
                        businessName: true,
                        phone: true,
                        whatsappContact: true,
                        reservationSettings: true,
                        userId: true
                    }
                }
            }
        })

        if (!program) return { success: false, error: "Negocio no encontrado" }

        const floorPlans = await prisma.floorPlan.findMany({
            where: { userId: program.userId },
            include: {
                tables: {
                    include: {
                        reservations: {
                            where: { date: { gte: new Date() } } // Future reservations only
                        }
                    }
                }
            },
            orderBy: { createdAt: 'asc' }
        })

        // if (!floorPlans || floorPlans.length === 0) return { success: false, error: "No hay mapa configurado" }
        // CHANGED: Return success even if empty so frontend can show "Coming Soon"
        const finalFloorPlans = floorPlans || []

        // Prioritize UserSettings business name if available, otherwise fallback to LoyaltyProgram name
        const displayName = program.user?.businessName || program.businessName || "Reservación"
        const businessPhone = program.user?.whatsappContact || program.user?.phone || null

        return {
            success: true,
            floorPlans: JSON.parse(JSON.stringify(finalFloorPlans)),
            businessName: displayName,
            businessPhone,
            settings: program.user?.reservationSettings || { standardTimeEnabled: false, standardDurationMinutes: 120, simpleMode: false, dailyPaxLimit: 50 },
            userId: program.user?.userId || program.userId
        }
    } catch (error) {
        console.error("Error fetching program floor plan:", error)
        return { success: false, error: "Error al cargar el mapa" }
    }
}

import { GoogleGenerativeAI } from "@google/generative-ai"

export async function generateLayoutFromImage(imageUrl: string) {
    try {
        const { userId } = await auth()
        if (!userId) throw new Error("Unauthorized")

        const apiKey = process.env.GEMINI_API_KEY
        if (!apiKey) {
            console.error("Missing GEMINI_API_KEY")
            return { success: false, error: "Server missing GEMINI_API_KEY" }
        }

        const genAI = new GoogleGenerativeAI(apiKey)
        // Switch to gemini-2.0-flash which is explicitly available in the user's account
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" })

        // Fetch image and convert to base64
        const imageResp = await fetch(imageUrl)
        const imageBuffer = await imageResp.arrayBuffer()
        const base64Image = Buffer.from(imageBuffer).toString('base64')

        const prompt = `
        You are an expert architect AI. Analyze this floor plan image and generate a JSON layout.
        
        Coordinate System: 
        - Use a percentage-based system (0-100) for both X and Y.
        - X=0 is left, X=100 is right.
        - Y=0 is top, Y=100 is bottom.
        
        Detailed Objects to Identify:
        1. "U_SHAPE": The curved booths at the top LEFT and RIGHT.
           - IMPORTANT: Each booth is ONE object. Do not split a single booth into multiple parts.
           - Check rotation: If opening faces down, rotation is 180 (or 0 depending on base).
        2. "ROUND": Circular tables in the center.
        3. "RECT": Rectangular tables.
        
        Output format (JSON Array only):
        [
          {
            "label": "Mesa 1", 
            "type": "RECT" | "ROUND" | "BAR" | "L_SHAPE" | "U_SHAPE",
            "x": number, // center x (0-100)
            "y": number, // center y (0-100)
            "width": number, // width in % (0-100)
            "height": number, // height in % (0-100)
            "rotation": number, // degrees (0-360) clockwise
            "capacity": number
          }
        ]

        Rules:
        - Avoid overlapping objects. If you detect two items sharing the same space, merge them or pick the larger one.
        - Align tables in grids if they appear aligned.
        - Detect exact capacity (chairs around table).
        
        Return ONLY the JSON.
        `

        const result = await model.generateContent([
            prompt,
            {
                inlineData: {
                    data: base64Image,
                    mimeType: "image/jpeg"
                }
            }
        ])

        const response = result.response
        const text = response.text()
        console.log("AI Raw Response:", text)

        // Robust JSON extraction
        const start = text.indexOf('[')
        const end = text.lastIndexOf(']')

        if (start === -1 || end === -1) {
            throw new Error("AI did not return a valid JSON array")
        }

        const jsonStr = text.substring(start, end + 1)
        const tables = JSON.parse(jsonStr)

        // Post-process: Add IDs, Scale, and Generate Points for Shapes
        const processedTables = tables.map((t: any, i: number) => {
            const extraProps: any = {
                id: `ai-${Date.now()}-${i}`,
                x: (t.x / 100) * 800,
                y: (t.y / 100) * 800,
                width: (t.width / 100) * 800,
                height: (t.height / 100) * 800,
                rotation: t.rotation || 0,
            }

            // Generate points for complex shapes (0-100 relative coordinate space)
            if (t.type === 'L_SHAPE') {
                extraProps.points = JSON.stringify([
                    { x: 0, y: 0 }, { x: 40, y: 0 }, { x: 40, y: 60 },
                    { x: 100, y: 60 }, { x: 100, y: 100 }, { x: 0, y: 100 }
                ])
            } else if (t.type === 'U_SHAPE') {
                // More rounded U shape approximation
                extraProps.points = JSON.stringify([
                    { x: 0, y: 0 }, { x: 30, y: 0 }, { x: 50, y: 10 }, { x: 70, y: 0 }, { x: 100, y: 0 }, // Top edge with slight curve hint (flat for now)
                    { x: 100, y: 100 },
                    { x: 80, y: 100 }, { x: 80, y: 40 }, // Right arm inner
                    { x: 60, y: 30 }, { x: 40, y: 30 }, // Inner curve base
                    { x: 20, y: 40 }, { x: 20, y: 100 }, // Left arm inner
                    { x: 0, y: 100 }
                ])
            } else if (t.type === 'T_SHAPE') {
                extraProps.points = JSON.stringify([
                    { x: 0, y: 0 }, { x: 100, y: 0 }, { x: 100, y: 35 },
                    { x: 65, y: 35 }, { x: 65, y: 100 }, { x: 35, y: 100 },
                    { x: 35, y: 35 }, { x: 0, y: 35 }
                ])
            }

            return { ...t, ...extraProps }
        })

        return { success: true, tables: processedTables }

    } catch (error: any) {
        console.error("AI Generation Error:", error)
        return { success: false, error: error.message || "Failed to generate layout" }
    }
}

// ... (previous code)

export async function getDashboardReservations(monthDate: Date = new Date()) {
    try {
        const { userId } = await auth()
        if (!userId) return { success: false, reservations: [] }

        // Find floor plans owned by user
        const floorPlans = await prisma.floorPlan.findMany({
            where: { userId },
            select: { id: true }
        })

        const floorPlanIds = floorPlans.map(fp => fp.id)

        // Date Range: Start of month to End of month (plus buffer)
        // For simplicity, let's just fetch ALL future reservations or a 3-month window
        const start = new Date(monthDate.getFullYear(), monthDate.getMonth() - 1, 1)
        const end = new Date(monthDate.getFullYear(), monthDate.getMonth() + 2, 0)

        console.log("Fetching reservations for user:", userId)
        console.log("FloorPlans:", floorPlanIds)
        console.log("Date Range:", start, end)

        // Fetch reservations via tables
        // Since Reservation is linked to Table, we need to query through Tables or if there's a direct Reservation model?
        // Let's check schema. Usually: Reservation -> Table -> FloorPlan -> User
        // Or Reservation -> User directly?
        // Based on `getProgramFloorPlan` query context: `tables: { include: { reservations: ... } }`


        // ... (inside getDashboardReservations)

        const reservations = await prisma.reservation.findMany({
            where: {
                date: {
                    gte: start,
                    lte: end
                },
                OR: [
                    { table: { floorPlanId: { in: floorPlanIds } } },
                    { userId: userId }
                ]
            },
            include: {
                table: true
            },
            orderBy: { date: 'desc' }
        })

        // MOCK DATA REMOVED
        // If this works, we know the issue is the DB query above.

        // Map to simpler structure
        const formatted = reservations.map((r: any) => {
            // ... existing mapping logic safe for empty array
            let timeStr = "00:00"
            try {
                // Manual safe formatting or use date-fns if imported
                const d = new Date(r.date)
                const hours = d.getHours().toString().padStart(2, '0')
                const minutes = d.getMinutes().toString().padStart(2, '0')
                timeStr = `${hours}:${minutes}`
            } catch (e) {
                console.error("Date parsing error", e)
            }

            return {
                id: r.id,
                date: r.date,
                time: timeStr,
                customerName: r.customerName || "Cliente",
                tableName: r.table?.label || "Mesa",
                pax: r.partySize || 4,
                status: r.status
            }
        })

        return { success: true, reservations: JSON.parse(JSON.stringify(formatted)) }

    } catch (error) {
        console.error("Error fetching dashboard reservations:", error)
        // Return empty array instead of crashing
        return { success: false, reservations: [] }
    }
}

// --- SETTINGS MANAGEMENT ---
const DEFAULT_AVAILABILITY = [
    { id: 'mon', label: 'Lunes', isOpen: true, openTime: "09:00", closeTime: "22:00" },
    { id: 'tue', label: 'Martes', isOpen: true, openTime: "09:00", closeTime: "22:00" },
    { id: 'wed', label: 'Miércoles', isOpen: true, openTime: "09:00", closeTime: "22:00" },
    { id: 'thu', label: 'Jueves', isOpen: true, openTime: "09:00", closeTime: "22:00" },
    { id: 'fri', label: 'Viernes', isOpen: true, openTime: "09:00", closeTime: "22:00" },
    { id: 'sat', label: 'Sábado', isOpen: true, openTime: "09:00", closeTime: "22:00" },
    { id: 'sun', label: 'Domingo', isOpen: true, openTime: "09:00", closeTime: "22:00" },
]

export async function getReservationSettings() {
    const { userId } = await auth()
    const defaults = { standardTimeEnabled: false, standardDurationMinutes: 120, simpleMode: false, dailyPaxLimit: 50, availability: DEFAULT_AVAILABILITY }
    if (!userId) return defaults

    const user = await prisma.userSettings.findUnique({
        where: { userId },
        select: { reservationSettings: true }
    })

    if (!user?.reservationSettings) return defaults

    return { ...defaults, ...(user.reservationSettings as any) }
}

export async function updateReservationSettings(settings: { standardTimeEnabled: boolean, standardDurationMinutes: number, simpleMode?: boolean, dailyPaxLimit?: number, availability?: any[] }) {
    console.log("SERVER: updateReservationSettings started", settings)
    try {
        const { userId } = await auth()
        if (!userId) throw new Error("Unauthorized")

        console.log("SERVER: upserting settings for user", userId)
        // Ensure settings exist or update them
        await prisma.userSettings.upsert({
            where: { userId },
            update: {
                reservationSettings: settings
            },
            create: {
                userId,
                plan: 'FREE', // Default plan if creating
                reservationSettings: settings
            }
        })

        console.log("SERVER: upsert success, revalidating...")
        revalidatePath('/dashboard/reservations')
        console.log("SERVER: revalidation done")
        return { success: true }
    } catch (error) {
        console.error("Error updating reservation settings:", error)
        return { success: false, error: "Failed to update settings" }
    }
}

async function getEffectiveReservationSettings(userId: string) {
    const user = await prisma.userSettings.findUnique({
        where: { userId },
        select: { reservationSettings: true }
    })

    // Default: Disabled (All Day Blocking), Default Duration 120m, Simple Mode Off
    const defaults = { standardTimeEnabled: false, standardDurationMinutes: 120, simpleMode: false, dailyPaxLimit: 50, availability: DEFAULT_AVAILABILITY }

    if (!user?.reservationSettings) return defaults

    return { ...defaults, ...(user.reservationSettings as any) }
}

// --- SHARED AVAILABILITY HELPER (PRIVATE) ---
async function checkTableAvailability(
    ownerId: string,
    tableId: string,
    requestedDate: Date,
    durationMinutes: number
): Promise<{ available: boolean, error?: string }> {
    const settings = await getEffectiveReservationSettings(ownerId)

    if (!settings.standardTimeEnabled) {
        // MODE: BLOCK ALL DAY
        const dayStart = new Date(requestedDate)
        dayStart.setHours(0, 0, 0, 0)
        const dayEnd = new Date(requestedDate)
        dayEnd.setHours(23, 59, 59, 999)

        const count = await prisma.reservation.count({
            where: {
                tableId: tableId,
                date: { gte: dayStart, lte: dayEnd },
                status: { notIn: ['CANCELED', 'REJECTED'] }
            }
        })

        if (count > 0) return { available: false, error: "Mesa reservada todo el día" }

    } else {
        // MODE: STANDARD DURATION (Time Slots)
        try {
            const requestDurationMs = durationMinutes * 60 * 1000
            const requestStart = requestedDate.getTime()
            const requestEnd = requestStart + requestDurationMs

            // Query Optimization: Fetch only relevant reservations for that day
            const dayStart = new Date(requestedDate)
            dayStart.setHours(0, 0, 0, 0)
            const dayEnd = new Date(requestedDate)
            dayEnd.setHours(23, 59, 59, 999)

            const dayReservations = await prisma.reservation.findMany({
                where: {
                    tableId: tableId,
                    date: { gte: dayStart, lte: dayEnd },
                    status: { notIn: ['CANCELED', 'REJECTED'] }
                },
                select: { date: true, duration: true }
            })

            for (const res of dayReservations) {
                const existingStart = new Date(res.date).getTime()
                if (isNaN(existingStart)) continue

                // Use stored duration or fallback
                const existingDuration = res.duration || settings.standardDurationMinutes || 120
                const existingEnd = existingStart + (existingDuration * 60 * 1000)

                // Overlap Logic: (StartA < EndB) and (EndA > StartB)
                if (existingStart < requestEnd && existingEnd > requestStart) {
                    return { available: false, error: "Horario traslapado con otra reserva" }
                }
            }
        } catch (err) {
            console.error("Error in availability check helper:", err)
            // Fail safe: If calculation fails, assume available to prevent blocking, but log it.
            return { available: true }
        }
    }

    return { available: true }
}

// Note: We use string date to avoid serialization issues across server boundary
export async function getAvailableTables(targetDateIso: string, floorPlanId?: string, programId?: string, timezoneOffsetMinutes?: number) {
    const debug: any = { targetDateIso, floorPlanId, programId, timezoneOffsetMinutes }
    console.log("SERVER: getAvailableTables called", debug)

    try {
        let userId: string | null = null
        try {
            const authData = await auth()
            userId = authData.userId
        } catch (e) {
            console.log("SERVER: auth() failed (expected in public view)", e)
        }

        let effectiveOwnerId = userId

        // 1. Try FloorPlan lookup
        if (!effectiveOwnerId && floorPlanId) {
            const fp = await prisma.floorPlan.findUnique({ where: { id: floorPlanId }, select: { userId: true } })
            effectiveOwnerId = fp?.userId || null
        }

        // 2. Fallback: Try Program lookup (Context)
        if (!effectiveOwnerId && programId) {
            const prog = await prisma.loyaltyProgram.findUnique({ where: { id: programId }, select: { userId: true } })
            effectiveOwnerId = prog?.userId || null
        }

        if (!effectiveOwnerId) {
            console.error("getAvailableTables: Could not resolve owner ID")
            return { success: false, occupiedTableIds: [] }
        }

        const settings = await getEffectiveReservationSettings(effectiveOwnerId)

        // Calculate "Local Day" boundaries robustly
        const requestDate = new Date(targetDateIso)
        const offset = typeof timezoneOffsetMinutes === 'number' ? timezoneOffsetMinutes : 0
        const offsetMs = offset * 60000

        // 1. Convert to local "moment"
        const localMoment = new Date(requestDate.getTime() - offsetMs)
        const y = localMoment.getUTCFullYear()
        const m = localMoment.getUTCMonth()
        const d = localMoment.getUTCDate()

        // 2. Define Day Start/End in UTC based on those local components
        const dayStart = new Date(Date.UTC(y, m, d, 0, 0, 0, 0) + offsetMs)
        const dayEnd = new Date(Date.UTC(y, m, d, 23, 59, 59, 999) + offsetMs)

        debug.dayRange = { start: dayStart.toISOString(), end: dayEnd.toISOString(), offsetUsed: offset }
        console.log("SERVER: Day Range (UTC):", debug.dayRange)

        // Fetch relevant reservations only
        const dayReservations = await prisma.reservation.findMany({
            where: {
                table: { floorPlan: { userId: effectiveOwnerId } }, // Scope by owner
                date: { gte: dayStart, lte: dayEnd },
                status: { notIn: ['CANCELED', 'REJECTED'] }
            },
            select: { tableId: true, date: true, duration: true }
        })

        // Check availability logic
        const occupiedTableIds: string[] = []
        const durationMinutes = settings.standardDurationMinutes || 120
        const requestDurationMs = durationMinutes * 60 * 1000
        const requestStart = requestDate.getTime()
        const requestEnd = requestStart + requestDurationMs

        if (!settings.standardTimeEnabled) {
            // Block All Day Mode
            dayReservations.forEach(r => {
                if (r.tableId) occupiedTableIds.push(r.tableId)
            })
        } else {
            // Time Slot Mode
            for (const res of dayReservations) {
                if (!res.tableId) continue
                const existingStart = new Date(res.date).getTime()
                const existingDuration = res.duration || durationMinutes
                const existingEnd = existingStart + (existingDuration * 60 * 1000)

                if (existingStart < requestEnd && existingEnd > requestStart) {
                    occupiedTableIds.push(res.tableId)
                }
            }
        }

        // De-duplicate
        const uniqueOccupied = Array.from(new Set(occupiedTableIds))
        debug.foundReservationsCount = dayReservations.length
        debug.occupiedTableIds = uniqueOccupied
        debug.effectiveOwnerId = effectiveOwnerId

        console.log("SERVER: getAvailableTables result", debug)
        return { success: true, occupiedTableIds: uniqueOccupied, debug }

    } catch (error) {
        console.error("Error checking availability:", error)
        return { success: false, occupiedTableIds: [], error: String(error) }
    }
}

export async function createReservation(data: {
    reservations: {
        tableId?: string | null
        date: string
        partySize: number
    }[]
    customer: {
        name: string
        phone?: string
        email?: string
    }
    programId?: string // Optional context for Simple Mode
    userId?: string // Optional context for Simple Mode
    promoterSlug?: string // New: RP tracking
}) {
    try {
        let promoterId: string | undefined

        if (data.promoterSlug) {
            const promoter = await prisma.promoterProfile.findUnique({
                where: { slug: data.promoterSlug },
                select: { id: true }
            })
            if (promoter) {
                promoterId = promoter.id
            }
        }

        // Resolve Owner ID
        let ownerId = data.userId

        // Prioritize table owner if tableId exists
        if (data.reservations[0].tableId) {
            const firstTable = await prisma.table.findUnique({
                where: { id: data.reservations[0].tableId },
                include: { floorPlan: { include: { user: true } } }
            })
            if (firstTable && firstTable.floorPlan) {
                ownerId = firstTable.floorPlan.userId
            }
        } else if (data.programId && !ownerId) {
            const prog = await prisma.loyaltyProgram.findUnique({ where: { id: data.programId }, select: { userId: true } })
            if (prog) ownerId = prog.userId
        }

        if (!ownerId) throw new Error("No se pudo identificar el negocio para la reserva")

        // Helper to fetch settings by OWNER ID
        const ownerData = await prisma.userSettings.findUnique({
            where: { userId: ownerId },
            select: {
                reservationSettings: true,
                businessName: true,
                phone: true,
                whatsappContact: true,
                loyaltyProgram: { select: { id: true } }
            }
        })
        const defaults = { standardTimeEnabled: false, standardDurationMinutes: 120, simpleMode: false, dailyPaxLimit: 50 }
        const finalSettings = { ...defaults, ...(ownerData?.reservationSettings as any) }
        const businessName = ownerData?.businessName || "Nuestro Negocio"
        const businessPhone = ownerData?.whatsappContact || ownerData?.phone || ""
        const loyaltyProgramId = ownerData?.loyaltyProgram?.id

        // Determine Duration
        const durationToStore = finalSettings.standardDurationMinutes || 120

        // Capture results
        let newReservationId: string | null = null;
        let reservationDate: Date | null = null;
        let reservationTableId: string | null = null;

        await prisma.$transaction(async (tx) => {
            for (const res of data.reservations) {
                const targetDate = new Date(res.date)
                if (isNaN(targetDate.getTime())) throw new Error("Fecha inválida")

                // --- AVAILABILITY CHECK ---
                if (finalSettings.simpleMode && !res.tableId) {
                    // Check Daily Limit
                    const dayStart = new Date(targetDate)
                    dayStart.setHours(0, 0, 0, 0)
                    const dayEnd = new Date(targetDate)
                    dayEnd.setHours(23, 59, 59, 999)

                    const dayReservations = await tx.reservation.findMany({
                        where: {
                            userId: ownerId,
                            date: { gte: dayStart, lte: dayEnd },
                            status: { notIn: ['CANCELED', 'REJECTED'] }
                        },
                        select: { partySize: true }
                    })

                    const currentPax = dayReservations.reduce((sum, r) => sum + r.partySize, 0)
                    const limit = finalSettings.dailyPaxLimit || 50

                    if (currentPax + res.partySize > limit) {
                        throw new Error(`Cupo lleno. (Disponible: ${Math.max(0, limit - currentPax)})`)
                    }

                } else if (res.tableId) {
                    // Table Mode Checks
                    if (!finalSettings.standardTimeEnabled) {
                        // Block All Day
                        const dayStart = new Date(res.date)
                        dayStart.setHours(0, 0, 0, 0)
                        const dayEnd = new Date(res.date)
                        dayEnd.setHours(23, 59, 59, 999)

                        const existing = await tx.reservation.findFirst({
                            where: {
                                tableId: res.tableId,
                                date: { gte: dayStart, lte: dayEnd },
                                status: { notIn: ['CANCELED', 'REJECTED'] }
                            }
                        })

                        if (existing) throw new Error("Mesa reservada para este día")
                    } else {
                        const check = await checkTableAvailability(ownerId, res.tableId, targetDate, durationToStore)
                        if (!check.available) throw new Error(check.error || "Mesa no disponible")
                    }
                } else {
                    throw new Error("Se requiere mesa")
                }

                // Create
                const newRes = await tx.reservation.create({
                    data: {
                        tableId: res.tableId || null,
                        userId: ownerId,
                        promoterId: promoterId, // Link to RP
                        date: targetDate,
                        partySize: res.partySize,
                        customerName: data.customer.name,
                        customerPhone: data.customer.phone,
                        customerEmail: data.customer.email,
                        status: 'CONFIRMED',
                        duration: durationToStore
                    }
                })

                if (!newReservationId) {
                    newReservationId = newRes.id
                    reservationDate = newRes.date
                    reservationTableId = newRes.tableId
                }
            }
        })

        // --- NOTIFICATIONS BLOCK ---
        if (newReservationId && reservationDate) {
            console.log(`[Notification Debug] Starting notifications for ${newReservationId}`);
            try {
                const qrCodeDataUrl = await QRCode.toDataURL(newReservationId)
                const finalDate = reservationDate as Date

                // Use Intl.DateTimeFormat for robustness
                const dateFormatter = new Intl.DateTimeFormat('es-MX', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long'
                })
                const timeFormatter = new Intl.DateTimeFormat('es-MX', {
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: true
                })

                const formattedDate = dateFormatter.format(finalDate)
                const formattedTime = timeFormatter.format(finalDate)

                const tableLabel = reservationTableId ?
                    (await prisma.table.findUnique({ where: { id: reservationTableId }, select: { label: true } }))?.label || "Mesa"
                    : "Área General"

                // 1. Send Email
                if (data.customer.email) {
                    console.log(`[Notification Debug] Attempting to send Email to: ${data.customer.email}`);
                    const loyaltyUrl = loyaltyProgramId
                        ? `${process.env.NEXT_PUBLIC_APP_URL || 'https://www.happymeters.com'}/loyalty/${loyaltyProgramId}`
                        : undefined

                    const pax = data.reservations?.[0]?.partySize || 0;

                    const emailResult = await resend.emails.send({
                        from: DEFAULT_SENDER,
                        to: [data.customer.email.trim().toLowerCase()],
                        subject: `✅ Confirmación de Reserva: ${businessName}`,
                        react: ReservationConfirmationEmail({
                            customerName: data.customer.name,
                            businessName: businessName,
                            date: formattedDate,
                            time: formattedTime,
                            pax: pax,
                            table: tableLabel,
                            qrCodeUrl: qrCodeDataUrl,
                            reservationId: newReservationId,
                            loyaltyUrl
                        })
                    })
                    console.log(`[Notification Debug] Email result:`, emailResult);
                }

                // 2. Send SMS
                if (data.customer.phone) {
                    console.log(`[Notification Debug] Attempting to send SMS to: ${data.customer.phone}`);
                    const smsMessage = `¡Hola ${data.customer.name}! Tu reserva en ${businessName} para el ${formattedDate} a las ${formattedTime} ha sido CONFIRMADA. Presenta tu confirmación al llegar. ¡Te esperamos!`
                    const smsResult = await sendSMS(data.customer.phone, smsMessage)
                    console.log(`[Notification Debug] SMS result:`, smsResult);
                }

            } catch (notifyError) {
                console.error("Error sending reservation notifications:", notifyError)
            }
        }

        return { success: true, reservationId: newReservationId }

    } catch (error: any) {
        console.error("Error creating reservation:", error)
        return { success: false, error: error.message || "Failed to create reservation" }
    }
}



export async function updateReservationStatus(id: string, status: string) {
    try {
        const reservation = await prisma.reservation.update({
            where: { id },
            data: { status }
        })

        revalidatePath('/dashboard/reservations')
        return { success: true, reservation }
    } catch (error) {
        console.error("Error updating reservation status:", error)
        return { success: false, error: "Failed to update status" }
    }
}

export async function validateReservationScan(reservationId: string) {
    try {
        const reservation = await prisma.reservation.findUnique({
            where: { id: reservationId },
            include: {
                table: {
                    include: {
                        floorPlan: {
                            include: {
                                user: true
                            }
                        }
                    }
                }
            }
        })

        if (!reservation) {
            return { success: false, error: "Reservación no encontrada" }
        }

        return {
            success: true,
            reservationId: reservation.id,
            customerName: reservation.customerName,
            customerPhone: reservation.customerPhone,
            date: reservation.date,
            partySize: reservation.partySize,
            tableLabel: reservation.table?.label || "Mesa",
            businessName: reservation.table?.floorPlan?.user?.businessName || "Negocio",
            status: reservation.status
        }
    } catch (error) {
        console.error("Error validating reservation scan:", error)
        return { success: false, error: "Error al validar el código" }
    }
}

export async function confirmReservationCheckin(reservationId: string) {
    try {
        // Here we can set status to 'CONFIRMED' or a new 'CHECKED_IN' status if we add it to schema.
        // For now, let's use 'CONFIRMED' as it marks the successful arrival.
        await prisma.reservation.update({
            where: { id: reservationId },
            data: { status: 'CONFIRMED' }
        })

        revalidatePath('/dashboard/reservations')
        return { success: true }
    } catch (error) {
        console.error("Error confirming reservation checkin:", error)
        return { success: false, error: "Error al confirmar llegada" }
    }
}

// --- PRO RESERVATION MANAGEMENT ACTIONS ---
export async function getAllReservationsList(userIdOverride?: string) {
    try {
        const { userId: authUserId } = await auth()
        if (!authUserId) return { success: false, reservations: [] }

        const targetUserId = userIdOverride || authUserId

        // Find floor plans owned by user
        const floorPlans = await prisma.floorPlan.findMany({
            where: { userId: targetUserId },
            select: { id: true }
        })
        const floorPlanIds = floorPlans.map(fp => fp.id)

        const reservations = await prisma.reservation.findMany({
            where: {
                OR: [
                    { table: { floorPlanId: { in: floorPlanIds } } },
                    { userId: targetUserId }
                ]
            },
            include: {
                table: true
            },
            orderBy: { date: 'desc' }
        })

        return { success: true, reservations }
    } catch (error) {
        console.error("Error fetching all reservations:", error)
        return { success: false, error: "Error al cargar la cartera de reservas" }
    }
}

export async function updateReservationState(reservationId: string, status: string) {
    try {
        await prisma.reservation.update({
            where: { id: reservationId },
            data: { status }
        })
        revalidatePath('/dashboard/reservations/list')
        revalidatePath('/dashboard/reservations')
        return { success: true }
    } catch (error) {
        console.error("Error updating reservation state:", error)
        return { success: false, error: "Error al actualizar estado" }
    }
}

export async function updateReservationNotes(reservationId: string, notes: string) {
    try {
        await prisma.reservation.update({
            where: { id: reservationId },
            data: { notes }
        })
        revalidatePath('/dashboard/reservations/list')
        return { success: true }
    } catch (error) {
        console.error("Error updating reservation notes:", error)
        return { success: false, error: "Error al actualizar notas" }
    }
}

export async function getReservationsAnalytics(userIdOverride?: string) {
    try {
        const { userId: authUserId } = await auth()
        if (!authUserId) return { success: false }

        const targetUserId = userIdOverride || authUserId
        const floorPlans = await prisma.floorPlan.findMany({
            where: { userId: targetUserId },
            select: { id: true }
        })
        const floorPlanIds = floorPlans.map(fp => fp.id)

        const reservations = await prisma.reservation.findMany({
            where: {
                OR: [
                    { table: { floorPlanId: { in: floorPlanIds } } },
                    { userId: targetUserId }
                ]
            }
        })

        // Metrics Calculation
        const totalReservations = reservations.length
        const totalPax = reservations.reduce((sum, r) => sum + r.partySize, 0)

        const noShows = reservations.filter(r => r.status === 'NO_SHOW').length
        const cancellations = reservations.filter(r => r.status === 'CANCELED').length
        const confirmed = reservations.filter(r => r.status === 'CONFIRMED').length

        const noShowRate = totalReservations ? ((noShows / totalReservations) * 100).toFixed(1) : "0"
        const cancelRate = totalReservations ? ((cancellations / totalReservations) * 100).toFixed(1) : "0"
        const confirmedRate = totalReservations ? ((confirmed / totalReservations) * 100).toFixed(1) : "0"

        // Peak Hours Calculation
        const hourCounts: Record<string, number> = {}
        reservations.forEach(r => {
            const hour = r.date.getHours()
            const timeString = `${hour.toString().padStart(2, '0')}:00`
            if (!hourCounts[timeString]) hourCounts[timeString] = 0
            hourCounts[timeString]++
        })

        const peakHours = Object.entries(hourCounts)
            .map(([time, count]) => ({ time, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 5) // Top 5 peak hours

        // Reservations by Day of Week
        const dayCounts: Record<number, number> = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 }
        reservations.forEach(r => {
            const day = r.date.getDay() // 0 = Sunday
            dayCounts[day]++
        })
        const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
        const weekDistribution = Object.entries(dayCounts).map(([dayIdx, count]) => ({
            day: dayNames[Number(dayIdx)],
            count
        }))

        return {
            success: true,
            data: {
                totalReservations,
                totalPax,
                noShowRate,
                cancelRate,
                confirmedRate,
                peakHours,
                weekDistribution,
                statusDistribution: [
                    { name: 'Confirmadas', value: confirmed },
                    { name: 'No Shows', value: noShows },
                    { name: 'Canceladas', value: cancellations },
                    { name: 'Pendientes', value: totalReservations - (confirmed + noShows + cancellations) }
                ]
            }
        }
    } catch (error) {
        console.error("Error generating reservation analytics:", error)
        return { success: false, error: "Error al generar reportes" }
    }
}

export async function getReservationsClients(userIdOverride?: string) {
    try {
        const { userId: authUserId } = await auth()
        if (!authUserId) return { success: false, clients: [] }

        const targetUserId = userIdOverride || authUserId
        const floorPlans = await prisma.floorPlan.findMany({
            where: { userId: targetUserId },
            select: { id: true }
        })
        const floorPlanIds = floorPlans.map(fp => fp.id)

        const reservations = await prisma.reservation.findMany({
            where: {
                OR: [
                    { table: { floorPlanId: { in: floorPlanIds } } },
                    { userId: targetUserId }
                ]
            },
            orderBy: { date: 'desc' }
        })

        // Group by customer telephone or name
        const clientMap = new Map<string, any>()

        reservations.forEach(res => {
            const key = res.customerPhone || res.customerName.toLowerCase().trim()
            if (!clientMap.has(key)) {
                clientMap.set(key, {
                    name: res.customerName,
                    phone: res.customerPhone,
                    email: res.customerEmail,
                    totalReservations: 0,
                    noShows: 0,
                    cancellations: 0,
                    lastVisit: res.date
                })
            }

            const client = clientMap.get(key)
            client.totalReservations++
            if (res.status === 'NO_SHOW') client.noShows++
            if (res.status === 'CANCELED') client.cancellations++
            // keep the most recent date
            if (res.date > client.lastVisit) client.lastVisit = res.date
        })

        const clients = Array.from(clientMap.values()).map(c => {
            const noShowRate = (c.noShows / c.totalReservations) * 100
            return {
                ...c,
                noShowRate: Number(noShowRate.toFixed(1)),
                isHighRisk: noShowRate >= 30 && c.totalReservations >= 2
            }
        }).sort((a, b) => b.noShowRate - a.noShowRate) // sort highest risk first

        return { success: true, clients }

    } catch (error) {
        console.error("Error generating reservation clients:", error)
        return { success: false, error: "Error al cargar base de clientes" }
    }
}
