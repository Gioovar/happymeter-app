
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    const taskId = '68474255-123b-4e67-81d0-181a3e16d62a'
    console.log(`Checking Task: ${taskId}`)

    const task = await prisma.processTask.findUnique({
        where: { id: taskId },
        include: { zone: true }
    })

    console.log('Task found:', task ? 'YES' : 'NO')
    if (task) {
        console.log('Zone:', task.zone)
        console.log('BranchId:', task.zone?.branchId)
    }

    const evidence = await prisma.processEvidence.findMany({
        where: { taskId: taskId },
        orderBy: { submittedAt: 'desc' }
    })

    console.log('Evidence count:', evidence.length)
    if (evidence.length > 0) {
        const staffId = evidence[0].staffId
        console.log('Sample Evidence StaffId:', staffId)

        if (staffId) {
            const member = await prisma.teamMember.findUnique({
                where: { id: staffId },
                include: { user: true }
            })
            console.log('Member found:', member ? 'YES' : 'NO')
            if (member) {
                console.log('Member Name:', member.name)
                console.log('Member UserId:', member.userId)
                console.log('User found:', member.user ? 'YES' : 'NO')
                if (member.user) {
                    console.log('User PhotoUrl:', member.user.photoUrl)
                }
            }
        }
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect()
    })
