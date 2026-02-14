'use server'

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

export async function submitProductReview(
    productId: string,
    rating: number,
    comment: string,
    customerId?: string
) {
    try {
        if (!productId) return { success: false, error: "Product ID is required" }
        if (rating < 1 || rating > 5) return { success: false, error: "Rating must be between 1 and 5" }

        const review = await prisma.productReview.create({
            data: {
                productId,
                rating,
                comment,
                customerId
            }
        })

        revalidatePath(`/loyalty`)
        return { success: true, review }
    } catch (error) {
        console.error("Error submitting review:", error)
        return { success: false, error: "Failed to submit review" }
    }
}

export async function getProductReviews(productId: string) {
    try {
        const reviews = await prisma.productReview.findMany({
            where: { productId },
            include: {
                customer: {
                    select: {
                        name: true,
                        username: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        })

        return { success: true, reviews }
    } catch (error) {
        console.error("Error fetching reviews:", error)
        return { success: false, reviews: [] }
    }
}
