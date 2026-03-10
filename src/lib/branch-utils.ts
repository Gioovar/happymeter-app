import { auth } from "@clerk/nextjs/server"
import { cookies } from "next/headers"

/**
 * Get the current branch ID from the session.
 * Returns the active branch ID for the authenticated user.
 * 
 * For multi-branch users, this returns the branch they're currently viewing.
 * For single-branch users, this returns their only branch.
 */
export async function getBranchId(): Promise<string | null> {
    const { getActiveBusinessId } = await import('@/lib/tenant')
    return await getActiveBusinessId()
}
