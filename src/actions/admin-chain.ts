'use server'

import { prisma } from '@/lib/prisma'
import { currentUser } from '@clerk/nextjs/server'
import { revalidatePath } from 'next/cache'

// TODO: centralized admin check
async function isAdmin() {
    const user = await currentUser()
    // Simple check for now - rely on middleware/layout protection usually
    return !!user
}

export async function adminUpgradeUserToChain(userId: string, userName: string) {
    try {
        if (!await isAdmin()) throw new Error('Unauthorized')

        // Check if user exists
        const userSettings = await prisma.userSettings.findUnique({
            where: { userId }
        })

        if (!userSettings) throw new Error('User not found')

        // Check if already has chain
        const existingChain = await prisma.chain.findFirst({
            where: { ownerId: userId }
        })

        if (existingChain) {
            return { success: false, error: 'User already has a chain' }
        }

        const chainName = `Cadena de ${userName}`

        await prisma.chain.create({
            data: {
                name: chainName,
                ownerId: userId,
                branches: {
                    create: {
                        branchId: userId,
                        name: 'Sede Principal',
                        order: 0
                    }
                }
            }
        })

        revalidatePath('/admin/users')
        return { success: true }

    } catch (error) {
        console.error('Admin Upgrade Error:', error)
        return { success: false, error: String(error) }
    }
}
