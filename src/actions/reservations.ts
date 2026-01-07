'use server'

import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

export async function getFloorPlan() {
    const { userId } = auth()
    if (!userId) throw new Error("Unauthorized")

    // Find UserSettings id from userId
    const userSettings = await prisma.userSettings.findUnique({
        where: { userId },
        select: { userId: true } // Just ensuring user exists
    })

    if (!userSettings) throw new Error("User settings not found")

    // Fetch or create Main Floor Plan
    let floorPlan = await prisma.floorPlan.findFirst({
        where: { userId },
        include: { tables: true }
    })

    if (!floorPlan) {
        floorPlan = await prisma.floorPlan.create({
            data: {
                userId,
                name: "Distribución Principal",
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
    }

    return floorPlan
}

export async function saveFloorPlan(floorPlanId: string, tables: any[]) {
    const { userId } = auth()
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
            if (table.id) {
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
                        capacity: table.capacity
                    }
                })
            } else {
                // Create
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
                        capacity: table.capacity
                    }
                })
            }
        }
    })

    revalidatePath('/dashboard/reservations')
    return { success: true }
}
