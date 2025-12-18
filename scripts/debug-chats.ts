
import { prisma } from '@/lib/prisma'

async function main() {
    console.log('Checking AdminChats...')
    const chats = await prisma.adminChat.findMany({
        include: {
            messages: true,
            creator: {
                include: {
                    user: true
                }
            }
        }
    })
    console.log(`Found ${chats.length} chats.`)
    if (chats.length > 0) {
        console.log('Sample Chat:', JSON.stringify(chats[0], null, 2))
    } else {
        console.log('No chats found in DB.')
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
