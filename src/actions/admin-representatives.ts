'use server'

import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

async function checkAdmin() {
    const { userId } = await auth()
    if (!userId) throw new Error('Unauthorized')

    const user = await prisma.userSettings.findUnique({ where: { userId } })
    if (user?.role !== 'SUPER_ADMIN' && user?.role !== 'ADMIN') {
        throw new Error('Forbidden')
    }
}

export async function getRepresentatives() {
    await checkAdmin()

    return await prisma.representativeProfile.findMany({
        include: {
            user: true, // For name/email
            _count: {
                select: { leads: true, referrals: true }
            }
        },
        orderBy: { createdAt: 'desc' }
    })
}

export async function approveRepresentative(id: string, commissionRate: number) {
    await checkAdmin()

    const profile = await prisma.representativeProfile.findUnique({ where: { id } })
    if (!profile) throw new Error('Not found')

    // Generate code if missing
    let code = profile.referralCode
    if (!code) {
        const initials = profile.state.substring(0, 3).toUpperCase()
        const random = Math.floor(Math.random() * 10000)
        code = `EMB-${initials}-${random}`
    }

    await prisma.representativeProfile.update({
        where: { id },
        data: {
            status: 'APPROVED',
            isActive: true,
            commissionRate: commissionRate,
            referralCode: code,
            // Also ensure the user role is locked in
        }
    })

    // Update notification
    await prisma.notification.create({
        data: {
            userId: profile.userId,
            type: 'SYSTEM',
            title: '¡Solicitud de Embajador Aprobada!',
            message: `Felicidades. Has sido aprobado para el territorio ${profile.state}. Tu tasa de comisión es ${commissionRate}%. Accede a tu dashboard ahora.`,
        }
    })

    revalidatePath('/admin/representatives')
}

export async function rejectRepresentative(id: string) {
    await checkAdmin()

    await prisma.representativeProfile.update({
        where: { id },
        data: {
            status: 'REJECTED',
            isActive: false
        }
    })

    revalidatePath('/admin/representatives')
}
