
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('--- User Settings Analysis ---')
    const users = await prisma.userSettings.findMany({
        include: {
            _count: {
                select: {
                    teamMembers: true,
                }
            }
        }
    })

    // List users with potentially relevant data
    for (const user of users) {
        const surveyCount = await prisma.survey.count({ where: { userId: user.userId } })
        if (surveyCount > 0 || user.businessName) {
            console.log(`User ID: ${user.userId}`)
            console.log(`  Name: ${user.businessName || 'N/A'}`)
            console.log(`  Created: ${user.createdAt.toISOString()}`)
            console.log(`  Surveys: ${surveyCount}`)
            console.log('--------------------------------')
        }
    }

    console.log('\n--- Deep Search for "gtrendy2017@gmail.com" ---')

    // Check Responses
    const responses = await prisma.response.findMany({
        where: { customerEmail: { contains: 'gtrendy', mode: 'insensitive' } },
        take: 5
    })
    console.log(`Found ${responses.length} responses with this email.`)
    responses.forEach(r => console.log(`  - SurveyID: ${r.surveyId}, Created: ${r.createdAt}`))

    // Check Team Invitations
    const invites = await prisma.teamInvitation.findMany({
        where: { email: { contains: 'gtrendy', mode: 'insensitive' } }
    })
    console.log(`Found ${invites.length} invites with this email.`)
    invites.forEach(i => console.log(`  - Inviter: ${i.inviterId}, Token: ${i.token}`))

    console.log('\n--- Survey Details for Candidate Users ---')
    // Mango Mango
    const mangoSurveys = await prisma.survey.findMany({
        where: { userId: 'user_36zT5iakWJbn4MQNg76Dvdz4FKa' },
        select: { title: true, responses: { select: { id: true } } }
    })
    if (mangoSurveys.length > 0) {
        console.log(`User 'mango mango' (user_36zT5iakWJbn4MQNg76Dvdz4FKa):`)
        mangoSurveys.forEach(s => console.log(`  - Survey: "${s.title}" (${s.responses.length} responses)`))
    }
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
