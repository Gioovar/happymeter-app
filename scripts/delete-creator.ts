import { prisma } from '../src/lib/prisma'

async function main() {
    const userId = 'user_36GKvPBupsEHF8i5HpMkX3d6cvI' // ID from screenshot

    console.log(`Deleting creator profile for user: ${userId}`)

    try {
        // Delete related data first if necessary (cascade usually handles it but let's be safe)
        // AdminChat, AdminChatMessage will cascade if relation is set up right, but AdminChat relation was:
        // creator AffiliateProfile @relation...
        // so deleting profile should cascade chat if onDelete: Cascade. 
        // Let's check schema again? 
        // AdminChat: creator   AffiliateProfile @relation(fields: [creatorId], references: [id])
        // It does NOT have onDelete: Cascade in my memory of the edit.
        // Let's try to delete just the profile and see if it fails.
        // If it fails, we delete dependent records.

        // Actually, let's look up the profile ID first to be sure.
        const profile = await prisma.affiliateProfile.findUnique({
            where: { userId }
        })

        if (!profile) {
            console.log('Profile not found.')
            return
        }

        // Delete chats
        const chats = await prisma.adminChat.findMany({ where: { creatorId: profile.id } })
        for (const chat of chats) {
            await prisma.adminChatMessage.deleteMany({ where: { chatId: chat.id } })
            await prisma.adminChat.delete({ where: { id: chat.id } })
        }

        // Delete profile
        await prisma.affiliateProfile.delete({
            where: { userId }
        })

        console.log('Successfully deleted creator profile.')

    } catch (error) {
        console.error('Error deleting profile:', error)
    }
}

main()
