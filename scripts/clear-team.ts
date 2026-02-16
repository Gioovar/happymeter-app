import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('Starting cleanup of Team Members and Invitations...')

    try {
        // Delete all pending invitations
        const deletedInvites = await prisma.teamInvitation.deleteMany({})
        console.log(`Deleted ${deletedInvites.count} invitations.`)

        // Delete all team members
        // Note: Assuming owners are not stored in TeamMember or if they are, they should be preserved?
        // Based on schema: TeamMember links userId to ownerId. 
        // Usually the "Owner" is the UserSettings record, and TeamMember are the staff.
        // However, if the owner adds themselves to the team (e.g. to appear in lists), they might be here.
        // I will delete ALL to be safe as per "desde cero" for testing, assuming the user knows what they want.
        // But I will try to preserve if the userId matches the ownerId just in case, though usually that's not how it's modeled.
        // Actually, asking to "elimina solo a los empleados" implies keeping the owner. 
        // I will filter out where userId == ownerId just in case.

        const deletedMembers = await prisma.teamMember.deleteMany({
            where: {
                userId: {
                    not: {
                        equals: prisma.teamMember.fields.ownerId
                    }
                }
            }
        })
        // Also delete where userId is null (offline operators)
        const deletedOffline = await prisma.teamMember.deleteMany({
            where: {
                userId: null
            }
        })

        console.log(`Deleted ${deletedMembers.count + deletedOffline.count} team members.`)
        console.log('Cleanup complete.')

    } catch (error) {
        console.error('Error cleaning up:', error)
    } finally {
        await prisma.$disconnect()
    }
}

main()
