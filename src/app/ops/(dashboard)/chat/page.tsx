import { getOpsSession } from '@/lib/ops-auth'
import { redirect } from 'next/navigation'
import ChatView from './ChatView'
import { prisma } from '@/lib/prisma'

export default async function ChatPage() {
    const session = await getOpsSession()

    if (!session.isAuthenticated || !session.member) {
        redirect('/ops/login')
    }

    // Resolve the display name for the chat header (the "Boss" name)
    // We try to get the branch name first
    const currentBranch = await prisma.chainBranch.findFirst({
        where: { branchId: session.member.ownerId },
        select: { name: true, slug: true }
    })

    const ownerName = currentBranch?.name || session.member.owner.businessName || 'Administrador'

    return (
        <ChatView
            memberId={session.member.id}
            branchId={session.member.ownerId}
            ownerId={session.member.ownerId} // Boss ID
            ownerName={ownerName}
        />
    )
}
