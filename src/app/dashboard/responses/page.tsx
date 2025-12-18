import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import ResponsesClientPage from '@/components/responses/ResponsesClientPage'

export default async function ResponsesPage() {
    const { userId } = await auth()
    if (!userId) redirect('/')

    // Fetch all responses for surveys owned by this user
    // We order by newest first
    const responses = await prisma.response.findMany({
        where: {
            survey: {
                userId: userId
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
