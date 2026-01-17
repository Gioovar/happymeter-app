"use server"

import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import QRCode from 'qrcode'
import { resend } from "@/lib/resend"
import { sendSMS } from "@/lib/sms"
import { sendWhatsAppNotification } from "@/lib/whatsapp"
import { ReservationConfirmationEmail } from "@/emails/ReservationConfirmation"

export async function getFloorPlan() {
    try {
        const plans = await getFloorPlans()
        return plans[0] || null
    } catch (error) {
        console.error("Error in getFloorPlan:", error)
        return null
    }
}

export async function getFloorPlans() {
    try {
        const { userId } = await auth()
        if (!userId) {
            console.error("getFloorPlans: No user session found")
            return []
        }
        // Find UserSettings id from userId
        let userSettings = await prisma.userSettings.findUnique({
            where: { userId },
            select: { userId: true }
        })
        // ...

        // [AUTO-HEAL] If user settings missing, create default to avoid blocking
        if (!userSettings) {
            console.log("⚠️ UserSettings missing for reservations, auto-creating...")
            userSettings = await prisma.userSettings.create({
                data: {
                    userId,
                    plan: 'FREE',
                }
            })
        }

        // Fetch all floor plans
        let floorPlans = await prisma.floorPlan.findMany({
            where: { userId },
            include: { tables: true },
            orderBy: { createdAt: 'asc' }
        })

        if (floorPlans.length === 0) {
            console.log("Creating new default floor plan...")
            const defaultPlan = await prisma.floorPlan.create({
                data: {
                    userId,
                    name: "Piso 1",
                    tables: {
                        create: [
                            { label: "Mesa 1", x: 100, y: 100, type: "RECT", capacity: 4 },
                            { label: "Mesa 2", x: 300, y: 100, type: "RECT", capacity: 4 },
                            { label: "Barra", x: 100, y: 300, width: 200, height: 60, type: "BAR", capacity: 5 },
                        ]
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

export async function createFloorPlan(name: string) {
    try {
        const { userId } = await auth()
        if (!userId) throw new Error("Unauthorized")

        const newPlan = await prisma.floorPlan.create({
            data: {
                userId,
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

export async function deleteFloorPlan(floorPlanId: string) {
    try {
        const { userId } = await auth()
        if (!userId) throw new Error("Unauthorized")

        // Check if there are other floors
        const count = await prisma.floorPlan.count({ where: { userId } })
        if (count <= 1) {
            return { success: false, error: "Cannot delete the last floor plan." }
        }

        await prisma.floorPlan.delete({
            where: { id: floorPlanId, userId }
        })

        revalidatePath('/dashboard/reservations')
        return { success: true }
    } catch (error) {
        console.error("Error deleting floor plan:", error)
        return { success: false, error: "Failed to delete floor plan" }
    }
}

export async function updateFloorMetadata(floorPlanId: string, data: { name: string, width: number, height: number }) {
    try {
        const { userId } = await auth()
        if (!userId) throw new Error("Unauthorized")

        const updated = await prisma.floorPlan.update({
            where: { id: floorPlanId, userId },
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

export async function saveFloorPlan(floorPlanId: string, tables: any[]) {
    const { userId } = await auth()
    if (!userId) throw new Error("Unauthorized")

    // Verify ownership
    const floorPlan = await prisma.floorPlan.findFirst({
        where: { id: floorPlanId, userId }
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
                    select: { businessName: true }
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

        if (!floorPlans || floorPlans.length === 0) return { success: false, error: "No hay mapa configurado" }

        // Prioritize UserSettings business name if available, otherwise fallback to LoyaltyProgram name
        const displayName = program.user?.businessName || program.businessName || "Reservación"

        return { success: true, floorPlans: JSON.parse(JSON.stringify(floorPlans)), businessName: displayName }
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
                table: {
                    floorPlanId: { in: floorPlanIds }
                }
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

export async function getAvailableTables(targetDateInput: Date) {
    try {
        const date = new Date(targetDateInput)
        // Date is already fully constructed (Date + Time) from client in correct timezone

        // We look for reservations that start 2 hours before or after the target time

        // Assume standard 2 hour duration for now
        // We look for reservations that start 2 hours before or after the target time
        // Actually, simpler: Exact match on date/time for now since we use slots?
        // Let's do a time range check: occupied if reservation is within [requested - 2h, requested + 2h]

        const startWindow = new Date(date)
        startWindow.setHours(date.getHours() - 2)

        const endWindow = new Date(date)
        endWindow.setHours(date.getHours() + 2)

        const conflicts = await prisma.reservation.findMany({
            where: {
                date: {
                    gte: startWindow,
                    lt: endWindow
                },
                status: {
                    not: 'CANCELED'
                }
            },
            select: {
                tableId: true
            }
        })

        return { success: true, occupiedTableIds: conflicts.map(c => c.tableId) }
    } catch (error) {
        console.error("Error checking availability:", error)
        return { success: false, occupiedTableIds: [] }
    }
}

export async function createReservation(data: {
    reservations: {
        tableId: string
        date: Date
        partySize: number
    }[]
    customer: {
        name: string
        phone?: string
        email?: string
    }
}) {
    try {
        // No auth check needed here as this is public customer facing (or use anonymous session if needed)
        // Ideally we should validate captcha or rate limit

        // Capture the first reservation ID created
        let newReservationId: string | null = null;
        let reservationDate: Date | null = null;
        let reservationTableId: string | null = null;

        await prisma.$transaction(async (tx) => {
            for (const res of data.reservations) {
                // simple check for double booking
                const existing = await tx.reservation.findFirst({
                    where: {
                        tableId: res.tableId,
                        date: res.date,
                        status: { not: 'CANCELED' }
                    }
                })

                if (existing) {
                    throw new Error(`Mesa ya reservada para esta hora`)
                }

                const created = await tx.reservation.create({
                    data: {
                        tableId: res.tableId,
                        date: res.date,
                        partySize: res.partySize,
                        customerName: data.customer.name,
                        customerPhone: data.customer.phone,
                        customerEmail: data.customer.email,
                        status: 'CONFIRMED'
                    }
                })

                if (!newReservationId) {
                    newReservationId = created.id
                    reservationDate = created.date
                    reservationTableId = created.tableId
                }
            }
        })

        revalidatePath('/dashboard/reservations')

        // [NOTIFICATIONS] Async send (Email + SMS + WhatsApp)
        // Fetch details for notifications and return (Business Name, Table Name)
        // Ensure we fetch user to get loyalty programs
        let tableInfo: any = null
        if (reservationTableId) {
            tableInfo = await prisma.table.findUnique({
                where: { id: reservationTableId },
                include: { floorPlan: { include: { user: { include: { loyaltyProgram: true } } } } }
            })
        }

        // [NOTIFICATIONS] Async send (Email + SMS + WhatsApp)
        if (newReservationId && reservationDate && tableInfo) {
            try {
                // Fallback business name lookup
                let businessName = "HappyMeters Place"
                let loyaltyUrl = ""

                // Safely access nested properties
                const fp = tableInfo?.floorPlan
                if (fp?.user) {
                    const settings = fp.user
                    if (settings.businessName) businessName = settings.businessName

                    // Find loyalty program
                    const program = settings.loyaltyProgram
                    if (program) {
                        // Construct URL (assume production domain or localhost)
                        const domain = process.env.NEXT_PUBLIC_APP_URL || "https://www.happymeters.com"
                        loyaltyUrl = `${domain}/loyalty/${program.id}`
                    }
                }

                // 1. Generate QR Code
                const qrData = `RESERVATION:${newReservationId}`
                const qrCodeUrl = await QRCode.toDataURL(qrData)

                const dateStr = new Date(reservationDate!).toLocaleDateString('es-MX', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
                const timeStr = new Date(reservationDate!).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })

                const notificationPromises = []

                // 2. EMAIL (Resend)
                if (data.customer.email) {
                    notificationPromises.push(
                        resend.emails.send({
                            from: 'Reservas <noreply@happymeters.app>',
                            to: [data.customer.email],
                            subject: `Confirmación de Reserva - ${businessName}`,
                            react: ReservationConfirmationEmail({
                                customerName: data.customer.name,
                                businessName: businessName,
                                date: dateStr,
                                time: timeStr,
                                pax: data.reservations[0].partySize,
                                table: tableInfo?.label || "Mesa",
                                qrCodeUrl: qrCodeUrl,
                                reservationId: newReservationId!,
                                loyaltyUrl: loyaltyUrl || undefined
                            })
                        })
                    )
                }

                // 3. SMS (Twilio)
                if (data.customer.phone) {
                    const shortDate = new Date(reservationDate!).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })
                    const shortTime = new Date(reservationDate!).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })
                    let smsBody = `Reserva confirmada en ${businessName}. ${shortDate} ${shortTime}, ${data.reservations[0].partySize} pers. Muestra este código: ${newReservationId}.`
                    if (loyaltyUrl) smsBody += ` Únete al club: ${loyaltyUrl}`

                    notificationPromises.push(sendSMS(data.customer.phone, smsBody))
                }

                // 4. WHATSAPP (Meta) - Only if explicitly integrated
                if (data.customer.phone) {
                    notificationPromises.push(
                        sendWhatsAppNotification(data.customer.phone, 'reservation_confirmed_v1', {
                            1: data.customer.name,
                            2: businessName,
                            3: `${dateStr} a las ${timeStr}`,
                            4: newReservationId!, // Unique Code
                            5: loyaltyUrl || "https://happymeters.app" // Loyalty Link
                        })
                    )
                }

                // Await all notifications to ensure delivery in serverless environment
                await Promise.allSettled(notificationPromises)

            } catch (notifyError) {
                console.error("Notification Error:", notifyError)
            }
        }

        // [POST-RESERVATION LOGIC] Return success with Action
        const program = tableInfo?.floorPlan?.user?.loyaltyProgram

        if (program) {
            const businessName = program.businessName || tableInfo?.floorPlan?.user?.businessName || "HappyMeters"
            return {
                success: true,
                action: 'REDIRECT_LOYALTY',
                programId: program.id,
                businessName: businessName,
                joinMessage: "Únete a nuestro programa de lealtad"
            }
        }

        return { success: true }
    } catch (error: any) {
        console.error("Error creating reservation:", error)
        return { success: false, error: error.message || "Error al crear la reserva" }
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
