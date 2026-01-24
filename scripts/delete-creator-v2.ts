import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    const targetEmail = 'gtrendy2009@hotmail.com'
    const targetUserId = 'user_36GKvPBupsEHF8i5HpMkX3d6cvI'

    console.log(`Checking for profiles with email ${targetEmail} or userId ${targetUserId}...`)

    try {
        // 1. Check by User ID
        const profileById = await prisma.affiliateProfile.findUnique({
            where: { userId: targetUserId }
        })

        // 2. Check by PayPal Email (which might be the email they used)
        const profileByEmail = await prisma.affiliateProfile.findFirst({
            where: { paypalEmail: targetEmail }
        })

        const profilesToDelete = []
        if (profileById) profilesToDelete.push(profileById)
        if (profileByEmail && profileByEmail.id !== profileById?.id) profilesToDelete.push(profileByEmail)

        if (profilesToDelete.length === 0) {
            console.log("No profiles found to delete.")
            return
        }

        for (const profile of profilesToDelete) {
            console.log(`Deleting profile: ${profile.id} (User: ${profile.userId})`)

            // Delete chats manually since relation might not cascade
            // Confirm model name: AdminChat
            // The previous error "reading 'findMany' of undefined" on adminChat usually means the client didn't have it generated 
            // OR the property name is different. The schema says model AdminChat so it should be prisma.adminChat.
            // Let's try to delete just the profile. If it fails, we know we have to delete children.

            try {
                // Try deleting profile directly
                await prisma.affiliateProfile.delete({
                    where: { id: profile.id }
                })
                console.log(`Deleted profile ${profile.id}`)
            } catch (e: any) {
                // Determine if foreign key constraint error P2003
                if (e.code === 'P2003') {
                    console.log("Foreign key constraint, deleting relations manually...")
                    // Get chats
                    const chats = await prisma.adminChat.findMany({ where: { creatorId: profile.id } })
                    for (const chat of chats) {
                        await prisma.adminChatMessage.deleteMany({ where: { chatId: chat.id } })
                        await prisma.adminChat.delete({ where: { id: chat.id } })
                    }
                    await prisma.affiliateProfile.delete({ where: { id: profile.id } })
                    console.log(`Deleted profile ${profile.id} after cleanup`)
                } else {
                    throw e
                }
            }
        }

    } catch (error) {
        console.error('Error during deletion:', error)
    } finally {
        await prisma.$disconnect()
    }
}

main()
