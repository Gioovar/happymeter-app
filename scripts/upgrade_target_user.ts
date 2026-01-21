
const { PrismaClient } = require('@prisma/client')
// Direct fetch to avoid Clerk SDK issues in script environment if not configured
// We need CLERK_SECRET_KEY from process.env
2
const prisma = new PrismaClient()

async function main() {
    const email = 'armelzuniga87@gmail.com'
    const clerkSecretKey = process.env.CLERK_SECRET_KEY

    if (!clerkSecretKey) {
        console.error('CRITICAL: CLERK_SECRET_KEY is missing in environment variables.')
        process.exit(1)
    }

    console.log(`🔍 Looking up user: ${email}`)

    // 1. Fetch User from Clerk API
    const response = await fetch(`https://api.clerk.com/v1/users?email_address=${email}`, {
        headers: {
            'Authorization': `Bearer ${clerkSecretKey}`
        }
    })

    if (!response.ok) {
        console.error('Error fetching from Clerk:', await response.text())
        process.exit(1)
    }

    const users = await response.json()
    if (users.length === 0) {
        console.error('❌ User not found in Clerk.')
        process.exit(1)
    }

    const user = users[0]
    const userId = user.id
    const name = `${user.first_name} ${user.last_name}`.trim() || 'Gabriel Arheaz'

    console.log(`✅ Found Clerk User: ${name} (${userId})`)

    // 2. Check/Create UserSettings
    let userSettings = await prisma.userSettings.findUnique({
        where: { userId }
    })

    if (!userSettings) {
        console.log('⚠️ UserSettings not found. Creating...')
        userSettings = await prisma.userSettings.create({
            data: {
                userId,
                businessName: name
            }
        })
        console.log('✅ UserSettings created.')
    } else {
        console.log('✅ UserSettings exists.')
    }

    // 3. Create Chain
    const chainName = `Cadena de ${name}`

    // Check if already owns a chain
    const existingChain = await prisma.chain.findFirst({
        where: { ownerId: userId }
    })

    if (existingChain) {
        console.log(`⚠️ User already owns a chain: ${existingChain.name} (${existingChain.id})`)
        process.exit(0)
    }

    console.log(`Creating Chain: "${chainName}"...`)

    const chain = await prisma.chain.create({
        data: {
            name: chainName,
            ownerId: userId,
            branches: {
                create: {
                    branchId: userId,
                    name: 'Sede Principal',
                    order: 0
                }
            }
        }
    })

    console.log(`
🎉 SUCCESS!
Chain ID: ${chain.id}
Owner: ${name} (${userId})
  `)
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
