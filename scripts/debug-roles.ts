
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    const email = 'isakmunoz.contacto@gmail.com'
    console.log(`Checking role for: ${email}`)

    // Prisma doesn't always have email in UserSettings if it relies on Clerk ID.
    // But usually we sync it or we can't search easily if we don't store email.
    // Let's check if UserSettings has email or if we have another way.
    // Looking at schema might be needed, but I'll try to find by some user table if it exists, or just list all admins.

    // Let's list all users and filter by email if possible, or assume we can't easily.
    // Wait, I saw `AffiliateProfile` might have email? Or `UserSettings`?
    // Let's check `userSettings` first.

    const allSettings = await prisma.userSettings.findMany()
    // This is bad for perf but fine for a script with few users.
    // Actually, I don't know if I have email in UserSettings. 
    // Let's print all users from UserSettings and try to map them if I can't find by email.
    // Or better, let's just dump the list of ADMINs.

    const admins = await prisma.userSettings.findMany({
        where: {
            role: { in: ['ADMIN', 'SUPER_ADMIN'] }
        }
    })

    console.log('--- Current Admins ---')
    console.log(admins)

    // Listing all users to find the specific one
    console.log('--- All Users (ID / Role) ---')
    const users = await prisma.userSettings.findMany()
    console.log(users)
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect())
