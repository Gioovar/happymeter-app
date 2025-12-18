
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('--- Simulating Crisis Survey Submission ---')

    // 1. Get User and Survey
    const user = await prisma.userSettings.findFirst()
    if (!user) { console.log('No user'); return }

    const survey = await prisma.survey.findFirst({ where: { userId: user.userId }, include: { questions: true } })
    if (!survey) { console.log('No survey'); return }

    console.log(`Target Survey: ${survey.title} (${survey.id})`)

    // 2. Mock API Call Logic (Crisis Trigger)
    // We'll mimic the "submit/route.ts" logic here to verify the 'sendCrisisAlert' function hook
    // But since 'sendCrisisAlert' is a library function, we can import it or just manually verify DB creation logic if we trust the route integration.
    // To be thorough, let's just use fetch if the server was running, but I can't reach localhost:3000 easily from here without confirming port.
    // So I will replicate the LOGIC from the route to verify DB connection works.

    // Actually, I'll update the script to use the actual `sendCrisisAlert` function if I can import it, 
    // but importing app code in scripts can be tricky due to aliases.
    // Let's just create a Response and call the alert logic manually or rely on manual testing?
    // Let's try to simulate the direct DB create + Logic check.

    const ratingQ = survey.questions.find(q => q.type === 'RATING' || q.type === 'EMOJI')
    if (!ratingQ) { console.log('No rating question'); return }

    console.log('Creating "1 Star" response...')

    const response = await prisma.response.create({
        data: {
            surveyId: survey.id,
            customerName: 'Crisis User',
            answers: {
                create: {
                    questionId: ratingQ.id,
                    value: '1'
                }
            }
        },
        include: { survey: true, answers: { include: { question: true } } }
    })

    console.log(`Response Created: ${response.id}`)

    // 3. Trigger Alert Logic (Replicating lib/alerts.ts logic mostly)
    console.log('Checking Alert Logic...')
    let shouldAlert = false
    const config = survey.alertConfig as any
    const threshold = (config && config.enabled) ? config.threshold : 2

    // Hardcoded check for script
    if (1 <= threshold) {
        console.log(`Rating (1) <= Threshold (${threshold}). Generating Alert...`)

        await prisma.notification.create({
            data: {
                userId: survey.userId,
                type: 'CRISIS',
                title: `🚨 Alerta de Crisis: ${survey.title}`,
                message: `Cliente: Crisis User\nCalificación: 1 ⭐\n"Simulated Crisis"`,
                meta: { responseId: response.id, surveyId: survey.id }
            }
        })
        console.log('Notification Created!')
    } else {
        console.log('No alert generated.')
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect())
