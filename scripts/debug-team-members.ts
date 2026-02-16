import { prisma } from '../src/lib/prisma'

async function debugTeamMembers() {
    console.log('=== DEBUGGING TEAM MEMBERS ===\n')

    // Get all team members
    const members = await prisma.teamMember.findMany({
        include: {
            user: {
                select: {
                    userId: true,
                    businessName: true,
                    fullName: true
                }
            },
            owner: {
                select: {
                    userId: true,
                    businessName: true
                }
            }
        }
    })

    console.log(`Total Team Members: ${members.length}\n`)

    members.forEach((member, index) => {
        console.log(`--- Member ${index + 1} ---`)
        console.log(`ID: ${member.id}`)
        console.log(`Name: ${member.name || 'N/A'}`)
        console.log(`Role: ${member.role}`)
        console.log(`Owner ID: ${member.ownerId}`)
        console.log(`Owner Business: ${member.owner?.businessName || 'N/A'}`)
        console.log(`User ID: ${member.userId || 'N/A'}`)
        console.log(`Is Offline: ${member.isOffline}`)
        console.log(`Is Active: ${member.isActive}`)
        console.log(`Access Code: ${member.accessCode || 'N/A'}`)
        console.log('')
    })

    // Get all chain branches
    const branches = await prisma.chainBranch.findMany({
        include: {
            chain: true,
            branch: {
                select: {
                    userId: true,
                    businessName: true
                }
            }
        }
    })

    console.log(`\n=== CHAIN BRANCHES ===`)
    console.log(`Total Branches: ${branches.length}\n`)

    branches.forEach((branch, index) => {
        console.log(`--- Branch ${index + 1} ---`)
        console.log(`ID: ${branch.id}`)
        console.log(`Name: ${branch.name}`)
        console.log(`Slug: ${branch.slug}`)
        console.log(`Branch ID (userId): ${branch.branchId}`)
        console.log(`Branch Business Name: ${branch.branch?.businessName || 'N/A'}`)
        console.log(`Chain ID: ${branch.chainId}`)
        console.log(`Chain Owner ID: ${branch.chain.ownerId}`)
        console.log('')
    })

    await prisma.$disconnect()
}

debugTeamMembers().catch(console.error)
