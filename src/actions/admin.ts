'use server'

import { prisma } from '@/lib/prisma'
import { currentUser } from '@clerk/nextjs/server'
import { revalidatePath } from 'next/cache'

// --- Admin Authorization Helper ---
async function verifyAdmin() {
    const user = await currentUser()
    if (!user) throw new Error('Unauthorized')

    // For now, we hardcode specific ADMIN emails or check a role if you have one
    // Ideally, check user.publicMetadata.role === 'SUPER_ADMIN'
    // Or check against a list of admin emails

    // TEMPORARY: Allow current user for development if role check is not robust yet
    // In production, strictly check:
    const dbUser = await prisma.userSettings.findUnique({
        where: { userId: user.id }
    })

    // We treat 'SUPER_ADMIN' or specific email as God Mode
    // TODO: Add your email here or ensure your user has 'SUPER_ADMIN' role in DB
    const isGod = dbUser?.role === 'SUPER_ADMIN' || user.emailAddresses[0].emailAddress === 'armelzuniga87@gmail.com' || user.emailAddresses[0].emailAddress === 'gioovar@gmail.com';

    if (!isGod) {
        throw new Error('Restricted to God Mode Admins only')
    }

    return user
}

// --- Actions ---

export async function getClients(query?: string) {
    try {
        await verifyAdmin()

        const users = await prisma.userSettings.findMany({
            where: {
                OR: query ? [
                    { businessName: { contains: query, mode: 'insensitive' } },
                    { userId: { contains: query } }
                    // Can't search by email easily since it's not in UserSettings directly/reliably sometimes without including relation or if it's strictly in Clerk
                    // But usually we sync email or search by businessName
                ] : undefined
            },
            take: 50,
            orderBy: { createdAt: 'desc' },
            select: {
                userId: true,
                businessName: true,
                plan: true,
                maxBranches: true,
                createdAt: true,
                role: true,
                // Include branch count for display
                _count: {
                    select: {
                        ownedChains: true,
                        // Count chains as proxy for main businesses or check chain branches
                    }
                }
            }
        })

        // Enhance with actual branch count
        // We need to count how many branches (chainBranch) belong to chains owned by this user
        const enhancedUsers = await Promise.all(users.map(async (u) => {
            const branchCount = await prisma.chainBranch.count({
                where: { chain: { ownerId: u.userId } }
            })
            return { ...u, branchCount }
        }))

        return enhancedUsers
    } catch (error: any) {
        console.error('Error fetching clients:', error)
        throw new Error(error.message)
    }
}

export async function updateClientLimit(targetUserId: string, updates: { maxBranches?: number, plan?: string }) {
    try {
        await verifyAdmin()

        await prisma.userSettings.update({
            where: { userId: targetUserId },
            data: {
                ...updates
            }
        })

        revalidatePath('/admin/clients')
        return { success: true }
    } catch (error: any) {
        console.error('Error updating client:', error)
        return { success: false, error: error.message }
    }
}
