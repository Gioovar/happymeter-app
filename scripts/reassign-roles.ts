
import { clerkClient } from '@clerk/nextjs/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    const superAdminEmail = 'gtrendy2017@gmail.com'
    const staffEmail = 'isakmunoz.contacto@gmail.com'

    console.log('--- Reassigning Roles ---')

    const client = await clerkClient()

    // 1. Promote SUPER_ADMIN
    const superAdmins = await client.users.getUserList({ emailAddress: [superAdminEmail] })
    if (superAdmins.data.length > 0) {
        const user = superAdmins.data[0]
        await prisma.userSettings.update({
            where: { userId: user.id },
            data: { role: 'SUPER_ADMIN' }
        })
        await client.users.updateUserMetadata(user.id, { publicMetadata: { role: 'SUPER_ADMIN' } })
        console.log(`✅ ${superAdminEmail} is now SUPER_ADMIN`)
    } else {
        console.log(`❌ User ${superAdminEmail} not found in Clerk`)
    }

    // 2. Demote Isak to STAFF
    const staffUsers = await client.users.getUserList({ emailAddress: [staffEmail] })
    if (staffUsers.data.length > 0) {
        const user = staffUsers.data[0]
        await prisma.userSettings.update({
            where: { userId: user.id },
            data: { role: 'STAFF' }
        })
        await client.users.updateUserMetadata(user.id, { publicMetadata: { role: 'STAFF' } })
        console.log(`✅ ${staffEmail} is now STAFF`)
    } else {
        console.log(`❌ User ${staffEmail} not found in Clerk`)
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect())
