'use server'

import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

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
        const { userId } = auth()
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
                            points: table.points
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
                    points: table.points
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
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })

        // Fetch image and convert to base64
        const imageResp = await fetch(imageUrl)
        const imageBuffer = await imageResp.arrayBuffer()
        const base64Image = Buffer.from(imageBuffer).toString('base64')

        const prompt = `
        Analyze this floor plan image and extract the furniture layout.
        Return a JSON array of objects representing tables and zones.
        
        The coordinate system is 0 to 800 for both X and Y.
        
        Output format:
        [
          {
            "label": "Mesa 1",
            "type": "RECT" | "ROUND" | "BAR" | "L_SHAPE" | "T_SHAPE",
            "x": number, // center x (0-800)
            "y": number, // center y (0-800)
            "width": number,
            "height": number,
            "capacity": number // estimate based on size/chairs
          }
        ]

        Rules:
        1. "RECT" for rectangular tables.
        2. "ROUND" for circular tables.
        3. "BAR" for long counters or bars.
        4. "L_SHAPE" for L-shaped sofas or booths.
        5. "T_SHAPE" for T-shaped arrangements.
        
        Only return the JSON array, no markdown, no other text.
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

        // Post-process to add IDs
        const processedTables = tables.map((t: any, i: number) => ({
            ...t,
            id: `ai-${Date.now()}-${i}`,
            rotation: 0
        }))

        return { success: true, tables: processedTables }

    } catch (error: any) {
        console.error("AI Generation Error:", error)
        return { success: false, error: error.message || "Failed to generate layout" }
    }
}
