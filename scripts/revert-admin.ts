
import { prisma } from '@/lib/prisma'

const USER_ID = 'user_36zT5iakWJbn4MQNg76Dvdz4FKa'

async function main() {
    console.log('Reverting user to SUPER_ADMIN...')
    await prisma.userSettings.update({
        where: { userId: USER_ID },
        data: { role: 'SUPER_ADMIN' }
    })
    console.log('Restored.')
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect())
