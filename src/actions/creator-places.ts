'use server'

import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function getAvailablePlaces() {
    const { userId } = await auth()
    if (!userId) throw new Error('Unauthorized')

    // Find affiliate profile to ensure user is a creator
    const creator = await prisma.affiliateProfile.findUnique({
        where: { userId }
    })

    if (!creator) throw new Error('Creator profile not found')

    // Only return fields safe for creators (hide internal contact info if needed, 
    // though user asked for "descriptions" and "days" which are in agreementDetails)
    // We will exclude internal contactPhone/contactName if requested to be hidden,
    // but the user requirement said "a ellos solo les dice el nombre del lugar los dias que pueden ir a grabar y la direccion"
    // so we return specific fields.
    return await prisma.place.findMany({
        where: { isActive: true },
        select: {
            id: true,
            name: true,
            description: true,
            address: true,
            coverImage: true,
            agreementDetails: true,
            requiredDeliverables: true,
            exampleContentUrl: true,
            exampleLinks: true,
            contentIdeas: true,
            contentGallery: true,
            scheduleConfig: true // Needed for validation
        },
        orderBy: { createdAt: 'desc' }
    })
}

export async function requestVisit(placeId: string, visitDate: Date) {
    const { userId } = await auth()
    if (!userId) throw new Error('Unauthorized')

    const creator = await prisma.affiliateProfile.findUnique({
        where: { userId }
    })

    if (!creator) throw new Error('Creator profile not found')


    // Create pending visit
    const visit = await prisma.placeVisit.create({
        data: {
            placeId,
            creatorId: creator.id,
            visitDate,
            status: 'PENDING'
        },
        include: {
            place: true,
            creator: true
        }
    })

    // Send Alert to Staff
    try {
        const { sendVisitRequestAlert } = await import('@/lib/alerts')
        await sendVisitRequestAlert(visit.place.name, visit.creator.instagram || 'Creador', visitDate)
    } catch (e) {
        console.error('Error sending alert:', e)
    }

    revalidatePath('/creators/places')
    return { success: true }
}

export async function getMyVisits() {
    const { userId } = await auth()
    if (!userId) throw new Error('Unauthorized')

    const creator = await prisma.affiliateProfile.findUnique({
        where: { userId }
    })

    if (!creator) return []

    return await prisma.placeVisit.findMany({
        where: { creatorId: creator.id },
        include: {
            place: {
                select: {
                    name: true,
                    coverImage: true
                }
            }
        },
        orderBy: { visitDate: 'desc' }
    })
}
