'use server'

import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'

export async function checkUserRole() {
    const { userId } = await auth()

    if (!userId) {
        return { authorized: false, role: null }
    }

    try {
        const userSettings = await prisma.userSettings.findUnique({
            where: { userId },
            select: { role: true }
        })

        if (!userSettings) {
            return { authorized: false, role: null }
        }

        const allowedRoles = ['ADMIN', 'SUPER_ADMIN', 'STAFF']
        const isAuthorized = allowedRoles.includes(userSettings.role || '')

        return {
            authorized: isAuthorized,
            role: userSettings.role
        }

    } catch (error) {
        console.error('Error checking user role:', error)
        return { authorized: false, role: null }
    }
}
