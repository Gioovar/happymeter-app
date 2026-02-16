import { NextResponse } from 'next/server'
import { getOpsSession } from '@/lib/ops-auth'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'

// Helper to format slug into readable name
function formatSlugToName(slug: string | null): string | null {
    if (!slug) return null
    // Convert "santi-condes" to "Santi Condes"
    return slug
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ')
}

export async function GET() {
    try {
        const session = await getOpsSession()

        if (!session.isAuthenticated || !session.member) {
            return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
        }

        console.log('[OPS SESSION] Member ownerId:', session.member.ownerId)

        // Fetch all memberships for the user
        const allMemberships = []
        if (session.userId) {
            const memberships = await prisma.teamMember.findMany({
                where: { userId: session.userId, isActive: true },
                select: {
                    id: true,
                    jobTitle: true,
                    ownerId: true,
                    owner: {
                        select: {
                            businessName: true
                        }
                    }
                }
            })

            // For each membership, check if owner is a branch and get branch name
            for (const membership of memberships) {
                const branch = await prisma.chainBranch.findFirst({
                    where: { branchId: membership.ownerId },
                    select: { name: true, slug: true }
                })

                console.log(`[OPS SESSION] Membership ${membership.id} - ownerId: ${membership.ownerId}, branch name: ${branch?.name}, slug: ${branch?.slug}`)

                // Use branch name, or formatted slug, or businessName as fallback
                const displayName = branch?.name || formatSlugToName(branch?.slug) || membership.owner.businessName

                allMemberships.push({
                    id: membership.id,
                    jobTitle: membership.jobTitle,
                    owner: {
                        businessName: displayName
                    }
                })
            }
        }

        // Check if current member's owner is a branch
        const currentBranch = await prisma.chainBranch.findFirst({
            where: { branchId: session.member.ownerId },
            select: { name: true, slug: true }
        })

        console.log('[OPS SESSION] Current branch:', currentBranch)
        console.log('[OPS SESSION] Fallback businessName:', session.member.owner.businessName)

        // Use branch name, or formatted slug, or businessName as fallback
        const displayName = currentBranch?.name || formatSlugToName(currentBranch?.slug) || session.member.owner.businessName

        console.log('[OPS SESSION] Final displayName:', displayName)

        return NextResponse.json({
            member: {
                id: session.member.id,
                jobTitle: session.member.jobTitle || 'Personal',
                owner: {
                    businessName: displayName
                }
            },
            allMemberships,
            isOffline: session.isOffline
        })
    } catch (error) {
        console.error('Error fetching ops session:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
