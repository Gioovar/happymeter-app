'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function getVisitDetailsForReview(visitId: string) {
    // Public safe details fetch
    const visit = await prisma.placeVisit.findUnique({
        where: { id: visitId },
        include: {
            place: { select: { name: true, coverImage: true } },
            creator: { 
                select: { 
                    id: true,
                    instagram: true, 
                    tiktok: true, 
                } 
            },
            review: true // check if already reviewed
        }
    })

    if (!visit) return null
    // Ensure only approved/completed visits can be reviewed
    if (visit.status !== 'APPROVED') return null

    return visit
}

export async function submitCreatorReview(visitId: string, rating: number, comment: string) {
    const visit = await prisma.placeVisit.findUnique({
        where: { id: visitId },
        include: { creator: true }
    })

    if (!visit) throw new Error('Visita no encontrada')
    if (visit.status !== 'APPROVED') throw new Error('Visita no válida para reseña')

    // Create review
    await prisma.creatorReview.create({
        data: {
            visitId,
            creatorId: visit.creatorId,
            rating,
            comment
        }
    })

    // Update Affiliate Stats
    const allReviews = await prisma.creatorReview.findMany({
        where: { creatorId: visit.creatorId }
    })
    
    const totalStars = allReviews.reduce((acc, r) => acc + r.rating, 0)
    const avgRating = totalStars / allReviews.length

    await prisma.affiliateProfile.update({
        where: { id: visit.creatorId },
        data: {
            avgRating,
            reviewCount: allReviews.length
        }
    })

    return { success: true }
}
