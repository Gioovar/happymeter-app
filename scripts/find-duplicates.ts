
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('Searching for duplicates...')

    const responses = await prisma.response.findMany({
        orderBy: { createdAt: 'asc' }
    })

    console.log(`Found ${responses.length} total responses.`)

    const duplicates: string[] = []
    const seen = new Map<string, any>()

    for (const response of responses) {
        // Create a unique key for "sameness". 
        // We use surveyId + customer identifiers + rough timestamp (to nearest minute? or just strict identity if clicked spamming)
        // If clicking same button multiple times, data is identical.
        // Let's use surveyId + name + email + phone.

        const key = `${response.surveyId}-${response.customerName}-${response.customerEmail}-${response.customerPhone}`

        if (seen.has(key)) {
            const prev = seen.get(key)
            // Check time difference. If < 5 minutes, it's a duplicate spam click.
            const timeDiff = response.createdAt.getTime() - prev.createdAt.getTime()
            if (timeDiff < 5 * 60 * 1000) { // 5 minutes
                console.log(`Duplicate found!`)
                console.log(`Original: ${prev.id} at ${prev.createdAt}`)
                console.log(`Duplicate: ${response.id} at ${response.createdAt} (Diff: ${timeDiff}ms)`)
                duplicates.push(response.id)
            }
        }

        // Always update 'seen' to the latest one? 
        // No, we want to keep the FIRST one as original. 
        // So if we see it, it's a duplicate. We don't update the map, so subsequent ones match the first one too.
        if (!seen.has(key)) {
            seen.set(key, response)
        }
    }

    console.log(`\nTotal duplicates found: ${duplicates.length}`)

    if (duplicates.length > 0) {
        console.log('IDs to delete:', duplicates)
    }
}

main()
    .catch(e => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
