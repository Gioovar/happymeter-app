import { prisma } from '@/lib/prisma'
import ResponsesClientPage from '@/components/responses/ResponsesClientPage'

interface ResponsesWrapperProps {
    effectiveUserId: string
    isBranch: boolean
}

export default async function ResponsesWrapper({ effectiveUserId, isBranch }: ResponsesWrapperProps) {
    const branchInfo = await prisma.userSettings.findUnique({
        where: { userId: effectiveUserId },
        select: { businessName: true }
    })
    const branchName = branchInfo?.businessName || ''

    const responses = await prisma.response.findMany({
        where: isBranch
            ? {
                OR: [
                    { branchId: effectiveUserId },
                    { survey: { userId: effectiveUserId } }
                ]
            }
            : { survey: { userId: effectiveUserId } },
        include: {
            survey: {
                select: { title: true }
            },
            answers: {
                include: {
                    question: {
                        select: { type: true, text: true, id: true }
                    }
                }
            }
        },
        orderBy: {
            createdAt: 'desc'
        }
    })

    const tickets = await prisma.issueTicket.findMany({
        where: isBranch
            ? { branchId: effectiveUserId }
            : { businessId: effectiveUserId },
        orderBy: {
            createdAt: 'desc'
        }
    })

    return <ResponsesClientPage initialResponses={responses} initialTickets={tickets} branchName={branchName} />
}
