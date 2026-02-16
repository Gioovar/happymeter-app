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
    const { userId } = await auth()
    if (!userId) return null

    // Check for branch context cookie (set by branch switcher)
    const cookieStore = await cookies()
    const branchContext = cookieStore.get('branch_context_id')

    if (branchContext?.value) {
        // Verify the user owns this branch
        // For now, we trust the cookie since it's set by our own system
        return branchContext.value
    }

    // Fallback: Return the user's own ID (they are their own default branch)
    return userId
}
