
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
    const email = 'armelzuniga87@gmail.com'
    const username = 'lasanticdmx'

    // Try to load env
    try { require('dotenv').config() } catch (e) { }

    const key = process.env.CLERK_SECRET_KEY
    if (!key) {
        console.error('CLERK_SECRET_KEY missing')
        process.exit(1)
    }

    console.log(`[JS SCRIPT] Searching for username: ${username}`)

    // Search by Username
    let response = await fetch(`https://api.clerk.com/v1/users?username=${username}`, {
        headers: { 'Authorization': `Bearer ${key}` }
    })

    let users = await response.json()

    if (users.length === 0) {
        console.log('Username not found. Trying email again...')
        response = await fetch(`https://api.clerk.com/v1/users?email_address=${email}`, {
            headers: { 'Authorization': `Bearer ${key}` }
        })
        users = await response.json()
    }

    if (users.length === 0) {
        // Fallback: List latest 10 users to debug?
        console.log('User not found. Fetching latest 5 users to verify connection/env...')
        const all = await fetch(`https://api.clerk.com/v1/users?limit=5`, {
            headers: { 'Authorization': `Bearer ${key}` }
        }).then(r => r.json())
        console.log('Latest users:', all.map(u => `${u.id} - ${u.email_addresses?.[0]?.email_address}`))

        process.exit(1)
    }

    const user = users[0]
    const userId = user.id
    const name = `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'Gabriel Arheaz' // Fallback from screenshot

    console.log(`✅ Found User: ${name} (${userId})`)

    // 2. UserSettings
    let settings = await prisma.userSettings.findUnique({ where: { userId } })
    if (!settings) {
        console.log('Creating UserSettings...')
        await prisma.userSettings.create({
            data: {
                userId,
                businessName: name,
                plan: 'FREE'
            }
        })
    }

    // 3. Chain
    const chainName = `Cadena de ${name}`
    const existing = await prisma.chain.findFirst({ where: { ownerId: userId } })

    if (existing) {
        console.log(`User already has a chain: ${existing.name}`)
        process.exit(0)
    }

    console.log('Creating Chain...')
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

    console.log('SUCCESS! Chain created:', chain.id)
}

main()
    .catch(e => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
