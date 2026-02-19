import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'

/**
 * Resolves the "Effective User ID" based on the current context.
 * 
 * Logic:
 * 1. If no `branchSlug` is provided, returns the current authenticated user's ID.
 * 2. If `branchSlug` IS provided:
 *    a. Finds the branch by slug (and ensuring the current user owns the chain).
 *    b. Returns the `branchId` (Virtual User ID) of that branch.
 *    c. If not found or unauthorized, throws error or redirects.
 * 
 * @param branchSlug - The slug from the URL (e.g. 'portales' from /dashboard/portales)
 */
export async function getEffectiveUserId(branchSlug?: string): Promise<string> {
    const { userId } = await auth();

    // If not logged in, let the PAGE handle the redirect to sign-in, or throw.
    // Usually pages check auth() first.
    if (!userId) {
        // Technically this shouldn't happen if middleware protects it, but safe fallback
        throw new Error('Unauthorized');
    }

    // Default context: The user themselves
    if (!branchSlug) {
        return userId;
    }

    // Allow accessing own scope via User ID
    if (branchSlug === userId) {
        return userId;
    }

    // Context Switch Requested
    try {
        // Find the branch where the slug matches AND the chain is owned by the current user
        // We assume slugs are unique per chain or globally? 
        // Ideally globally unique for simplicity, OR scoped to chain.
        // But since URL is /dashboard/[slug], it implies global uniqueness OR we search first match owned by user.
        // Let's search for "Branch with this slug belonging to a chain owned by Me".

        // Find the branch where the slug OR ID matches AND the chain is owned by the current user
        const branch = await prisma.chainBranch.findFirst({
            where: {
                OR: [
                    { slug: branchSlug },
                    { branchId: branchSlug }
                ],
                chain: {
                    ownerId: userId
                }
            },
            select: {
                branchId: true
            }
        });

        if (branch) {
            return branch.branchId; // Return the ID of the "Virtual User" (Branch)
        }

        // If not found, maybe it's the Main User's "own" dashboard accessed via explicit slug? 
        // (Unlikely, but handles edge case if we slugify the main user later)

        // If we really can't find it, it means:
        // 1. Slug doesn't exist.
        // 2. User isn't the owner.
        // In either case: Unauthorized / Not Found.
        console.warn(`[AuthContext] User ${userId} attempted to access invalid branch slug: ${branchSlug}`);
        redirect('/dashboard'); // Kick back to main dashboard
    } catch (error) {
        if (error instanceof Error && error.message.includes('NEXT_REDIRECT')) {
            throw error;
        }
        console.error('[AuthContext] Error resolving context:', error);
        return userId; // Fallback to self? Or throw? Fallback safest for now.
    }

    return userId;
}

/**
 * Improved helper that returns full context info, not just ID.
 * Useful for UI to know "Where am I?"
 */
export async function getDashboardContext(branchSlug?: string) {
    const { userId } = await auth();
    if (!userId) return null;

    if (!branchSlug) {
        return {
            userId,
            isBranch: false,
            name: 'Mi Negocio' // Or fetch real name
        };
    }

    // Allow accessing own scope via User ID (Single Business Mode / Owner Context)
    if (branchSlug === userId) {
        // We fetch settings to get the real business name if possible, or fallback
        const settings = await prisma.userSettings.findUnique({
            where: { userId },
            select: { businessName: true }
        });

        return {
            userId,
            isBranch: true, // Treat as "Branch Mode" for layout compatibility
            name: settings?.businessName || 'Mi Negocio',
            params: { branchSlug }
        }
    }

    const branch = await prisma.chainBranch.findFirst({
        where: {
            OR: [
                { slug: branchSlug },
                { branchId: branchSlug }
            ],
            chain: { ownerId: userId }
        },
        include: {
            branch: {
                select: { businessName: true }
            }
        }
    });

    if (branch) {
        return {
            userId: branch.branchId,
            isBranch: true,
            name: branch.branch.businessName || branch.name || branchSlug,
            params: { branchSlug }
        };
    }

    return null;
}
