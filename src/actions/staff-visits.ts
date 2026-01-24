'use server'

import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { sendVisitStatusUpdateAlert } from '@/lib/alerts'

export async function checkStaffRole() {
    const { userId } = await auth()
    if (!userId) throw new Error('Unauthorized')

    const user = await prisma.userSettings.findUnique({
        where: { userId },
        select: { role: true }
    })

    if (user?.role !== 'STAFF' && user?.role !== 'SUPER_ADMIN' && user?.role !== 'ADMIN') {
        throw new Error('Forbidden')
    }
    return userId
}

export async function getPendingVisits() {
    await checkStaffRole()

    return await prisma.placeVisit.findMany({
        where: { status: 'PENDING' },
        include: {
            place: true,
            creator: true
        },
        orderBy: { createdAt: 'asc' }
    })
}

export async function getAllVisits() {
    await checkStaffRole()

    return await prisma.placeVisit.findMany({
        include: {
            place: true,
            creator: true
        },
        orderBy: { visitDate: 'desc' }
    })
}

export async function updateVisitStatus(visitId: string, status: 'APPROVED' | 'REJECTED') {
    await checkStaffRole()

    const visit = await prisma.placeVisit.update({
        where: { id: visitId },
        data: { status },
        include: {
            place: true,
            creator: true
        }
    })

    // Notify the Creator
    await sendVisitStatusUpdateAlert(visit.place.name, status, visit.creator.userId)

    revalidatePath('/staff/visits')
    return { success: true }
}
