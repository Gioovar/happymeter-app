import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import AIProcessManual from '@/components/AIProcessManual'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { getDashboardContext } from '@/lib/auth-context'

export default async function BranchReportPage({
    params,
    searchParams
}: {
    params: Promise<{ branchSlug: string, surveyId: string }>,
    searchParams: { [key: string]: string | string[] | undefined }
}) {
    const { branchSlug, surveyId } = await params
    const { userId } = await auth()

    if (!userId) redirect('/')

    // 1. Resolve Branch Context
    const context = await getDashboardContext(branchSlug)
    if (!context || !context.userId) {
        redirect('/dashboard')
    }

    // 2. Find the survey
    const survey = await prisma.survey.findUnique({
        where: { id: surveyId },
        select: { id: true, title: true, userId: true }
    })

    if (!survey) {
        return <div className="p-8 text-white">Encuesta no encontrada</div>
    }

    // 3. Security: Ensure the survey belongs to the context (Branch)
    // The survey.userId MUST match the resolved context.userId (Branch ID)
    if (survey.userId !== context.userId) {
        return <div className="p-8 text-white">Esta encuesta no pertenece a esta sucursal.</div>
    }

    // 4. Permission Check: Verify the authenticated user owns this context
    // getDashboardContext already ensures this implicitly (by finding chain owned by userId),
    // but explicit check is good if logic changes.
    // However, getDashboardContext logic: "find branch where chain.ownerId = userId". 
    // So if context exists, user is owner.

    const userSettings = await prisma.userSettings.findUnique({
        where: { userId: survey.userId },
        select: { industry: true }
    })

    // Fetch other surveys from the SAME BRANCH
    const surveys = await prisma.survey.findMany({
        where: { userId: survey.userId },
        select: { id: true, title: true },
        orderBy: { createdAt: 'desc' }
    })

    const initialAutoStart = searchParams?.auto === 'true'
    const initialFrom = typeof searchParams?.from === 'string' ? new Date(searchParams.from) : undefined
    const initialTo = typeof searchParams?.to === 'string' ? new Date(searchParams.to) : undefined

    return (
        <div className="min-h-screen bg-[#f3f4f6] text-black pb-20">
            <div className="bg-black text-white p-4 print:hidden sticky top-0 z-50 shadow-md">
                <div className="max-w-4xl mx-auto flex items-center gap-4">
                    <Link href={`/dashboard/${branchSlug}`} className="p-2 hover:bg-white/10 rounded-lg transition">
                        <ChevronLeft className="w-6 h-6" />
                    </Link>
                    <h1 className="font-bold text-lg">Volver al Dashboard de {context.name}</h1>
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
                    targetUserId={survey.userId}
                    branchName={context.name}
                />
            </div>
        </div>
    )
}
