import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import SurveyClient from './SurveyClient'

export const dynamic = 'force-dynamic'


export default async function SurveyPage({ params }: { params: Promise<{ surveyId: string }> }) {
    const { surveyId } = await params
    const { userId } = await auth()
    let isOwner = false

    if (userId && surveyId !== 'demo') {
        const survey = await prisma.survey.findUnique({
            where: { id: surveyId },
            select: { userId: true }
        })
        if (survey && survey.userId === userId) {
            isOwner = true
        }
    }
    return <SurveyClient surveyId={surveyId} isOwner={isOwner} />
}
