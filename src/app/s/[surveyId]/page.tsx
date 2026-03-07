import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import SurveyClient from './SurveyClient'
import { Metadata } from 'next'

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: { params: Promise<{ surveyId: string }> }): Promise<Metadata> {
    const { surveyId } = await params

    // Default metadata for demo or if not found
    let title = 'Encuesta de Satisfacción'
    let description = 'Tu opinión es muy importante para nosotros.'

    if (surveyId !== 'demo') {
        const survey = await prisma.survey.findUnique({
            where: { id: surveyId },
            select: { title: true, description: true }
        })
        if (survey) {
            title = `Encuesta - ${survey.title}`
            description = survey.description || description
        }
    }

    return {
        title,
        description,
        appleWebApp: {
            capable: true,
            title: title,
            statusBarStyle: 'black-translucent',
        }
    }
}


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
    return (
        <>
            <head>
                <link rel="manifest" href={`/api/surveys/${surveyId}/manifest`} crossOrigin="use-credentials" />
            </head>
            <SurveyClient surveyId={surveyId} isOwner={isOwner} />
        </>
    )
}
