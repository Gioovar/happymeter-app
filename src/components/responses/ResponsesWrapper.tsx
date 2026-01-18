import { prisma } from '@/lib/prisma'
import ResponsesClientPage from '@/components/responses/ResponsesClientPage'

interface ResponsesWrapperProps {
    effectiveUserId: string
}

export default async function ResponsesWrapper({ effectiveUserId }: ResponsesWrapperProps) {
    const responses = await prisma.response.findMany({
        where: {
            survey: {
                userId: effectiveUserId
            }
        },
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

    return <ResponsesClientPage initialResponses={responses} />
}
