
import { clerkClient } from '@clerk/nextjs/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    const email = 'isakmunoz.contacto@gmail.com'
    console.log(`Looking up user: ${email}`)

    try {
        // 1. Find in Clerk
        const client = await clerkClient()
        const users = await client.users.getUserList({ emailAddress: [email] })

        if (users.data.length === 0) {
            console.log('No user found in Clerk with this email.')
            return
        }

        const user = users.data[0]
        console.log(`Found Clerk User: ${user.id}`)

        // 2. Find/Update in Prisma
        const userSettings = await prisma.userSettings.findUnique({
            where: { userId: user.id }
        })

        console.log('Current DB Role:', userSettings?.role)

        if (userSettings) {
            const updated = await prisma.userSettings.update({
                where: { userId: user.id },
                data: { role: 'SUPER_ADMIN' }
            })
            console.log('✅ UPDATED ROLE TO SUPER_ADMIN:', updated.role)

            // Also update metadata
            await client.users.updateUserMetadata(user.id, {
                publicMetadata: { role: 'SUPER_ADMIN' }
            })
            console.log('✅ UPDATED CLERK METADATA')

        } else {
            console.log('User settings not found in DB.')
        }

    } catch (error) {
        console.error('Error:', error)
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect())
