'use server'

import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'

export async function joinAsSeller(formData: FormData) {
    const { userId } = await auth()
    if (!userId) throw new Error('Unauthorized')

    const state = formData.get('state') as string
    if (!state) throw new Error('Estado requerido')

    // Check availability
    const existing = await prisma.representativeProfile.findUnique({
        where: { state }
    })

    if (existing) {
        throw new Error('Este territorio ya ha sido reclamado.')
    }

    // Create profile
    await prisma.representativeProfile.create({
        data: {
            userId,
            state,
            isActive: true, // Auto-approve for now
            referralCode: `REF-${state.substring(0, 3).toUpperCase()}-${Math.floor(Math.random() * 1000)}`
        }
    })

    // Update user role
    await prisma.userSettings.update({
        where: { userId },
        data: { role: 'REPRESENTATIVE', state: state }
    })

    redirect('/sellers')
}
