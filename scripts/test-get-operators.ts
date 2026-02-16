import { prisma } from '../src/lib/prisma'

async function testGetOperators() {
    console.log('=== TESTING getOperators LOGIC ===\n')

    // Simulate the scenario: viewing from "La Santi Condesa" branch
    const branchId = 'user_38vVHiCW2r7uZjjWD7bvL06g6VG' // La Santi Condesa

    console.log(`Testing with branchId: ${branchId}`)
    console.log(`This is the branch "La Santi Condesa"\n`)

    // Check if this is a branch (not the chain owner)
    const branchInfo = await prisma.chainBranch.findFirst({
        where: { branchId: branchId },
        select: {
            chain: {
                select: { ownerId: true }
            }
        }
    })

    console.log('Branch Info:', branchInfo)

    // Build the query to include both branch employees AND chain owner employees
    const ownerIds = [branchId]
    if (branchInfo && branchInfo.chain.ownerId !== branchId) {
        // This is a branch, also include chain owner's employees
        ownerIds.push(branchInfo.chain.ownerId)
        console.log(`\nBranch detected. Including chain owner: ${branchInfo.chain.ownerId}`)
    }

    console.log(`\nQuerying employees with ownerIds: ${ownerIds.join(', ')}\n`)

    // Fetch all active team members for this owner/branch AND chain owner
    const operators = await prisma.teamMember.findMany({
        where: {
            ownerId: { in: ownerIds },
            isActive: true
        },
        include: {
            user: {
                select: {
                    userId: true,
                    photoUrl: true,
                    phone: true,
                    businessName: true,
                    fullName: true,
                }
            }
        },
        orderBy: {
            joinedAt: 'desc'
        }
    })

    console.log(`Found ${operators.length} operators:\n`)

    operators.forEach((op, index) => {
        console.log(`${index + 1}. ${op.name || op.user?.businessName || 'N/A'}`)
        console.log(`   - ID: ${op.id}`)
        console.log(`   - Owner ID: ${op.ownerId}`)
        console.log(`   - Role: ${op.role}`)
        console.log(`   - Is Offline: ${op.isOffline}`)
        console.log('')
    })

    await prisma.$disconnect()
}

testGetOperators().catch(console.error)
