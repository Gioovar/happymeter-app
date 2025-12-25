
import { prisma } from '@/lib/prisma'

const USER_ID = 'user_36zT5iakWJbn4MQNg76Dvdz4FKa' // Found Super Admin

async function main() {
    console.log('Transforming user to Representative...')

    // 1. Update Role
    await prisma.userSettings.update({
        where: { userId: USER_ID },
        data: { role: 'REPRESENTATIVE' }
    })

    // 2. Create Profile
    // Check if exists
    const existing = await prisma.representativeProfile.findUnique({
        where: { userId: USER_ID }
    })

    if (!existing) {
        await prisma.representativeProfile.create({
            data: {
                userId: USER_ID,
                state: 'Jalisco', // Default for test
                commissionRate: 15.0
            }
        })
        console.log('Profile created.')
    } else {
        console.log('Profile already exists.')
    }

    console.log('Done! User is now a Representative (Jalisco).')
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect())
