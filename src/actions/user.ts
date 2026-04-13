'use server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { getOpsSession } from '@/lib/ops-auth'

export async function completeTour() {
    const { userId } = await auth()
    if (!userId) throw new Error('Unauthorized')

    await prisma.userSettings.upsert({
        where: { userId },
        update: { hasSeenTour: true },
        create: {
            userId,
            hasSeenTour: true
        }
    })

    revalidatePath('/dashboard')
}

export async function updateUserProfile(data: { phone: string, photoUrl: string, name: string, jobTitle: string }) {
    const session = await getOpsSession()
    
    if (!session.isAuthenticated || !session.member) {
        throw new Error('No autorizado')
    }

    // 1. Update TeamMember (Universal for Staff and Admin in OPS context)
    await prisma.teamMember.update({
        where: { id: session.member.id },
        data: {
            name: data.name,
            jobTitle: data.jobTitle,
            phone: data.phone,
            photoUrl: data.photoUrl
        }
    })

    // 2. If Clerk User, update UserSettings as well (Primary profile)
    if (session.userId) {
        await prisma.userSettings.upsert({
            where: { userId: session.userId },
            update: {
                phone: data.phone,
                photoUrl: data.photoUrl,
                fullName: data.name,
                jobTitle: data.jobTitle,
                isOnboarded: true
            },
            create: {
                userId: session.userId,
                phone: data.phone,
                photoUrl: data.photoUrl,
                fullName: data.name,
                jobTitle: data.jobTitle,
                isOnboarded: true
            }
        })
    }

    revalidatePath('/ops')
    return { success: true }
}

