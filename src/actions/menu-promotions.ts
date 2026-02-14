'use server'

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

export async function getPromotions(userId: string) {
    try {
        const promotions = await prisma.menuPromotion.findMany({
            where: { userId },
            orderBy: { order: 'asc' }
        })
        return promotions
    } catch (error) {
        console.error("Error fetching promotions:", error)
        return []
    }
}

export async function createPromotion(userId: string, imageUrl: string, title?: string) {
    try {
        await prisma.menuPromotion.create({
            data: {
                userId,
                imageUrl,
                title,
                isActive: true
            }
        })
        revalidatePath('/dashboard/loyalty')
        return { success: true }
    } catch (error: any) {
        console.error("Error creating promotion:", error)
        return { success: false, error: error.message }
    }
}

export async function deletePromotion(id: string) {
    try {
        await prisma.menuPromotion.delete({
            where: { id }
        })
        revalidatePath('/dashboard/loyalty')
        return { success: true }
    } catch (error: any) {
        console.error("Error deleting promotion:", error)
        return { success: false, error: error.message }
    }
}

export async function togglePromotion(id: string, isActive: boolean) {
    try {
        await prisma.menuPromotion.update({
            where: { id },
            data: { isActive }
        })
        revalidatePath('/dashboard/loyalty')
        return { success: true }
    } catch (error: any) {
        console.error("Error toggling promotion:", error)
        return { success: false, error: error.message }
    }
}
