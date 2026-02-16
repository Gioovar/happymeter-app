import { auth } from "@clerk/nextjs/server"
import { cookies } from "next/headers"
import { prisma } from "@/lib/prisma"

export async function getOpsSession() {
    // 1. Try Clerk Auth
    const { userId } = await auth()

    if (userId) {
        // Logged in via Clerk
        // 1. Check for specific context cookie
        const cookieStore = await cookies()
        const contextId = cookieStore.get('ops_context_id')?.value

        if (contextId) {
            const member = await prisma.teamMember.findUnique({
                where: { id: contextId, userId }, // Ensure the context belongs to the user
                include: {
                    owner: { select: { businessName: true } }
                }
            })
            if (member && member.isActive) {
                return {
                    userId,
                    member,
                    isOffline: false,
                    isAuthenticated: true,
                    requiresContextSelection: false
                }
            }
        }

        // 2. Fallback: Fetch all memberships
        const memberships = await prisma.teamMember.findMany({
            where: { userId, isActive: true },
            include: {
                owner: { select: { businessName: true } }
            }
        })

        if (memberships.length === 0) {
            // Not a member of any team
            return {
                userId,
                member: null,
                isOffline: false,
                isAuthenticated: true, // Authenticated but no ops access
                requiresContextSelection: false
            }
        }

        if (memberships.length === 1) {
            // Only one membership, auto-select
            return {
                userId,
                member: memberships[0],
                isOffline: false,
                isAuthenticated: true,
                requiresContextSelection: false
            }
        }

        // Multiple memberships found, require selection
        return {
            userId,
            member: null,
            isOffline: false,
            isAuthenticated: true,
            requiresContextSelection: true
        }
    }

    // 2. Try Offline Cookie
    const cookieStore = await cookies()
    const operatorCookie = cookieStore.get('operator_session')

    if (operatorCookie?.value) {
        const member = await prisma.teamMember.findUnique({
            where: { accessCode: operatorCookie.value },
            include: {
                owner: { select: { businessName: true } }
            }
        })

        if (member && member.isActive) {
            return {
                userId: null,
                member,
                isOffline: true,
                isAuthenticated: true,
                requiresContextSelection: false
            }
        }
    }

    return {
        userId: null,
        isOffline: false,
        isAuthenticated: false,
        requiresContextSelection: false
    }
}
