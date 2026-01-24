'use server'

import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function getLeads() {
    const { userId } = await auth()
    if (!userId) throw new Error('Unauthorized')

    const profile = await prisma.representativeProfile.findUnique({
        where: { userId },
        include: {
            leads: {
                orderBy: { updatedAt: 'desc' }
            }
        }
    })

    if (!profile) throw new Error('Not a representative')

    return profile.leads
}

export async function createLead(formData: FormData) {
    const { userId } = await auth()
    if (!userId) throw new Error('Unauthorized')

    const profile = await prisma.representativeProfile.findUnique({ where: { userId } })
    if (!profile) throw new Error('Not a representative')

    const businessName = formData.get('businessName') as string
    const contactName = formData.get('contactName') as string
    const phone = formData.get('phone') as string
    const address = formData.get('address') as string
    const notes = formData.get('notes') as string

    await prisma.sellerLead.create({
        data: {
            representativeId: profile.id,
            businessName,
            contactName,
            phone,
            address,
            notes,
            status: 'NEW'
        }
    })

    revalidatePath('/sellers/crm')
}

export async function updateLeadStatus(leadId: string, status: string) {
    const { userId } = await auth()
    if (!userId) throw new Error('Unauthorized')

    // Verify ownership
    const lead = await prisma.sellerLead.findUnique({
        where: { id: leadId },
        include: { representative: true }
    })

    if (!lead || lead.representative.userId !== userId) throw new Error('Unauthorized')

    await prisma.sellerLead.update({
        where: { id: leadId },
        data: { status }
    })

    revalidatePath('/sellers/crm')
}

export async function scheduleVisit(leadId: string, date: Date) {
    const { userId } = await auth()
    if (!userId) throw new Error('Unauthorized')

    // Verify ownership
    const lead = await prisma.sellerLead.findUnique({
        where: { id: leadId },
        include: { representative: true }
    })

    if (!lead || lead.representative.userId !== userId) throw new Error('Unauthorized')

    await prisma.sellerLead.update({
        where: { id: leadId },
        data: {
            scheduledVisit: date,
            status: 'CONTACTED'
        }
    })

    revalidatePath('/sellers/crm')
}
