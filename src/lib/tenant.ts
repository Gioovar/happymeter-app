import { auth } from '@clerk/nextjs/server'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'

/**
 * Returns the active business ID based on the user's session and context switching cookie.
 * Defaults to the authenticated user's ID if no context is set.
 */
export async function getActiveBusinessId(): Promise<string | null> {
    const { userId } = await auth()
    if (!userId) return null

    const cookieStore = await cookies()
    const activeBusinessId = cookieStore.get('happy_active_business')?.value

    if (activeBusinessId && activeBusinessId !== userId) {
        // Verify that the user has access to this business context
        // 1. Check if it's a branch they own
        const isBranch = await prisma.chainBranch.findFirst({
            where: { branchId: activeBusinessId, chain: { ownerId: userId } }
        })
        if (isBranch) return activeBusinessId

        // 2. Check if it's a business they are a team member of
        const isMember = await prisma.teamMember.findFirst({
            where: { ownerId: activeBusinessId, userId: userId }
        })
        if (isMember) return activeBusinessId

        // If they don't have access, fallback to their own ID
        return userId
    }

    return userId
}
