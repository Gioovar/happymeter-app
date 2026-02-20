"use server"

import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { PromoterCommissionType } from "@prisma/client"

export async function createPromoter(data: {
    name: string
    phone?: string
    email?: string
    commissionType: PromoterCommissionType
    commissionValue: number
    branchId?: string
    slug: string
}) {
    try {
        const { userId: ownerId } = await auth()
        if (!ownerId) return { success: false, error: "No autorizado" }

        // Check if slug is unique
        const existing = await prisma.promoterProfile.findUnique({
            where: { slug: data.slug }
        })

        if (existing) return { success: false, error: "El código/link ya existe" }

        const promoter = await prisma.promoterProfile.create({
            data: {
                ...data,
                businessId: ownerId,
            }
        })

        revalidatePath('/dashboard/reservations/rps')
        return { success: true, promoter }
    } catch (error) {
        console.error("Error creating promoter:", error)
        return { success: false, error: "Error al crear promotor" }
    }
}

export async function getPromoters(userIdOverride?: string) {
    try {
        const { userId: authUserId } = await auth()
        if (!authUserId) return { success: false, promoters: [] }

        const targetUserId = userIdOverride || authUserId

        const promoters = await prisma.promoterProfile.findMany({
            where: {
                businessId: targetUserId
            },
            include: {
                _count: {
                    select: { reservations: true }
                },
                reservations: {
                    select: {
                        status: true,
                        partySize: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        })

        return { success: true, promoters }
    } catch (error) {
        console.error("Error fetching promoters:", error)
        return { success: false, promoters: [] }
    }
}

export async function deletePromoter(id: string) {
    try {
        const { userId: ownerId } = await auth()
        if (!ownerId) return { success: false, error: "No autorizado" }

        await prisma.promoterProfile.delete({
            where: { id, businessId: ownerId }
        })

        revalidatePath('/dashboard/reservations/rps')
        return { success: true }
    } catch (error) {
        console.error("Error deleting promoter:", error)
        return { success: false, error: "Error al eliminar promotor" }
    }
}

export async function updatePromoter(id: string, data: any) {
    try {
        const { userId: ownerId } = await auth()
        if (!ownerId) return { success: false, error: "No autorizado" }

        await prisma.promoterProfile.update({
            where: { id, businessId: ownerId },
            data
        })

        revalidatePath('/dashboard/reservations/rps')
        return { success: true }
    } catch (error) {
        console.error("Error updating promoter:", error)
        return { success: false, error: "Error al actualizar promotor" }
    }
}

export async function getPromoterAnalytics(promoterId?: string, dateRange?: { from: Date, to: Date }) {
    try {
        const { userId: ownerId } = await auth()
        if (!ownerId) return { success: false, stats: null }

        const where: any = {
            promoter: { businessId: ownerId }
        }

        if (promoterId) {
            where.promoterId = promoterId
        }

        if (dateRange) {
            where.date = {
                gte: dateRange.from,
                lte: dateRange.to
            }
        }

        const reservations = await prisma.reservation.findMany({
            where,
            include: { promoter: true }
        })

        const stats = {
            totalReservations: reservations.length,
            confirmedAttendees: reservations
                .filter(r => r.status === 'CONFIRMED' || r.status === 'CHECKED_IN')
                .reduce((sum, r) => sum + r.partySize, 0),
            noShows: reservations.filter(r => r.status === 'NO_SHOW').length,
            revenue: 0, // Assume 0 if no price linked yet, or calculate if available
            conversionRate: reservations.length > 0
                ? (reservations.filter(r => r.status === 'CHECKED_IN').length / reservations.length) * 100
                : 0
        }

        return { success: true, stats }
    } catch (error) {
        console.error("Error fetching promoter analytics:", error)
        return { success: false, stats: null }
    }
}

export async function createSettlement(data: {
    promoterId: string
    amount: number
    startDate: Date
    endDate: Date
    notes?: string
}) {
    try {
        const { userId: ownerId } = await auth()
        if (!ownerId) return { success: false, error: "No autorizado" }

        const settlement = await prisma.promoterSettlement.create({
            data: {
                ...data,
                status: 'PENDING'
            }
        })

        revalidatePath(`/dashboard/reservations/rps/${data.promoterId}`)
        return { success: true, settlement }
    } catch (error) {
        console.error("Error creating settlement:", error)
        return { success: false, error: "Error al crear liquidación" }
    }
}

export async function markSettlementAsPaid(id: string) {
    try {
        const { userId: ownerId } = await auth()
        if (!ownerId) return { success: false, error: "No autorizado" }

        await prisma.promoterSettlement.update({
            where: { id },
            data: {
                status: 'PAID',
                paidAt: new Date()
            }
        })

        revalidatePath(`/dashboard/reservations/rps`)
        return { success: true }
    } catch (error) {
        console.error("Error marking settlement as paid:", error)
        return { success: false, error: "Error al actualizar liquidación" }
    }
}

export async function getPromoterSettlements(promoterId: string) {
    try {
        const settlements = await prisma.promoterSettlement.findMany({
            where: { promoterId },
            orderBy: { createdAt: 'desc' }
        })

        return { success: true, settlements }
    } catch (error) {
        console.error("Error fetching settlements:", error)
        return { success: false, settlements: [] }
    }
}


