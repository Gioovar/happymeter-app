import { getOpsSession } from '@/lib/ops-auth'
import { redirect } from 'next/navigation'
import ChatView from './ChatView'
import ChatList from './ChatList'
import { getInternalChatList } from '@/actions/internal-communications'
import { prisma } from '@/lib/prisma'

export default async function ChatPage({
    searchParams
}: {
    searchParams: Promise<{ with?: string }>
}) {
    const session = await getOpsSession()
    const { with: withId } = await searchParams

    if (!session.isAuthenticated || !session.member) {
        redirect('/ops/login')
    }

    const branchId = session.member.ownerId

    // If "with" is specified, show the conversation
    if (withId) {
        // Resolve the display name for the chat header
        const otherUser = await prisma.userSettings.findFirst({
            where: { userId: withId },
            select: { businessName: true, fullName: true }
        })

        const otherTeamMember = !otherUser ? await prisma.teamMember.findUnique({
            where: { id: withId },
            select: { name: true }
        }) : null

        const ownerName = otherUser?.businessName || otherUser?.fullName || otherTeamMember?.name || 'Administrador'

        return (
            <ChatView
                memberId={session.member.id}
                branchId={branchId}
                ownerId={withId}
                ownerName={ownerName}
            />
        )
    }

    // Otherwise, show the list of conversations
    const conversations = await getInternalChatList(session.member.id, branchId)

    return (
        <ChatList
            conversations={conversations}
            currentMemberId={session.member.id}
        />
    )
}
