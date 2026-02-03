import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import AIProcessManual from '@/components/AIProcessManual'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'

export default async function ReportPage({ params, searchParams }: { params: Promise<{ surveyId: string }>, searchParams: { [key: string]: string | string[] | undefined } }) {
    const { surveyId } = await params
    const { userId } = await auth()

    if (!userId) redirect('/')

    const survey = await prisma.survey.findUnique({
        where: { id: surveyId, userId },
        select: { title: true }
    })

    const userSettings = await prisma.userSettings.findUnique({
        where: { userId },
        select: { industry: true }
    })

    const surveys = await prisma.survey.findMany({
        where: { userId },
        select: { id: true, title: true },
        orderBy: { createdAt: 'desc' }
    })

    if (!survey) {
        return <div className="p-8 text-white">Encuesta no encontrada</div>
    }

    const initialAutoStart = searchParams?.auto === 'true'
    const initialFrom = typeof searchParams?.from === 'string' ? new Date(searchParams.from) : undefined
    const initialTo = typeof searchParams?.to === 'string' ? new Date(searchParams.to) : undefined

    return (
        <div className="min-h-screen bg-[#f3f4f6] text-black pb-20">
            <div className="bg-black text-white p-4 print:hidden sticky top-0 z-50 shadow-md">
                <div className="max-w-4xl mx-auto flex items-center gap-4">
                    <Link href="/dashboard" className="p-2 hover:bg-white/10 rounded-lg transition">
                        <ChevronLeft className="w-6 h-6" />
                    </Link>
                    <h1 className="font-bold text-lg">Volver al Dashboard</h1>
                </div>
            </div>

            <div className="p-8 print:p-0">
                <AIProcessManual
                    surveyId={surveyId}
                    surveyTitle={survey.title}
                    initialIndustry={userSettings?.industry || undefined}
                    availableSurveys={surveys}
                    initialAutoStart={initialAutoStart}
                    initialFrom={initialFrom}
                    initialTo={initialTo}
                />
            </div>
        </div>
    )
}
