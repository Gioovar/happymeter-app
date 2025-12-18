'use server'

import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

// Verify Staff/Admin role helper
async function checkStaffRole() {
    const { userId } = await auth()
    if (!userId) throw new Error('Unauthorized')

    const user = await prisma.userSettings.findUnique({
        where: { userId },
        select: { role: true }
    })

    if (user?.role !== 'STAFF' && user?.role !== 'SUPER_ADMIN' && user?.role !== 'ADMIN') {
        throw new Error('Forbidden')
    }
}

export async function getPlaces() {
    await checkStaffRole()
    return await prisma.place.findMany({
        orderBy: { createdAt: 'desc' }
    })
}

export async function upsertPlace(data: {
    id?: string
    name: string
    description: string
    address: string
    contactName: string
    contactPhone: string
    agreementDetails: string
    requiredDeliverables?: string
    exampleContentUrl?: string
    exampleLinks?: string[] // Array of example URLs
    contentIdeas?: string
    contentGallery?: string[] // Array of image URLs
    coverImage: string
    scheduleConfig: any // { allowedDays: [], timeRange: { start, end } }
}) {
    try {
        await checkStaffRole()

        if (data.id) {
            // Update
            await prisma.place.update({
                where: { id: data.id },
                data: {
                    name: data.name,
                    description: data.description,
                    address: data.address,
                    contactName: data.contactName,
                    contactPhone: data.contactPhone,
                    agreementDetails: data.agreementDetails,
                    requiredDeliverables: data.requiredDeliverables,
                    exampleContentUrl: data.exampleContentUrl,
                    exampleLinks: data.exampleLinks,
                    contentIdeas: data.contentIdeas,
                    contentGallery: data.contentGallery,
                    coverImage: data.coverImage,
                    scheduleConfig: data.scheduleConfig
                }
            })
        } else {
            // Create
            await prisma.place.create({
                data: {
                    name: data.name,
                    description: data.description,
                    address: data.address,
                    contactName: data.contactName,
                    contactPhone: data.contactPhone,
                    agreementDetails: data.agreementDetails,
                    requiredDeliverables: data.requiredDeliverables,
                    exampleContentUrl: data.exampleContentUrl,
                    exampleLinks: data.exampleLinks,
                    contentIdeas: data.contentIdeas,
                    contentGallery: data.contentGallery,
                    coverImage: data.coverImage,
                    scheduleConfig: data.scheduleConfig,
                    isActive: true
                }
            })
        }

        revalidatePath('/staff/places')
        return { success: true }
    } catch (error: any) {
        console.error('Error in upsertPlace:', error)
        return { success: false, error: error.message || 'Unknown error' }
    }
}

export async function togglePlaceStatus(id: string, currentStatus: boolean) {
    await checkStaffRole()

    await prisma.place.update({
        where: { id },
        data: { isActive: !currentStatus }
    })

    revalidatePath('/staff/places')
    return { success: true }
}

export async function deletePlace(id: string) {
    await checkStaffRole()

    // Check if it has visits? Maybe soft delete or restrict?
    // user didn't specify, but safer to try delete and let FK fail if needed, or just delete.
    // For now simple delete.
    await prisma.place.delete({
        where: { id }
    })

    revalidatePath('/staff/places')
    return { success: true }
}
