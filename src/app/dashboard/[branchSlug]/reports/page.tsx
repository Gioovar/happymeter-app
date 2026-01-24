
import { getDashboardContext } from '@/lib/auth-context'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import AIProcessManual from '@/components/AIProcessManual'

export default async function BranchReportsPage({ params }: { params: { branchSlug: string } }) {
    const context = await getDashboardContext(params.branchSlug)
    if (!context || !context.userId) {
        redirect('/dashboard')
    }

    const userId = context.userId
    console.log("Rendering Branch Reports Page for user:", userId)

    // Fetch User Settings to get the Industry from the Branch User (or Owner if fallback logic allows, but userId here IS filtered)
    let userSettings = null
    try {
        userSettings = await prisma.userSettings.findUnique({
            where: { userId }
        })
    } catch (error) {
        console.error("Failed to fetch user settings:", error)
    }

    // Fetch all surveys for the selector (Branch specific)
    const surveys = await prisma.survey.findMany({
        where: { userId },
        select: { id: true, title: true },
        orderBy: { createdAt: 'desc' }
    })

    return (
        <div className="min-h-screen bg-[#0a0a0a]">
            {/* 
              We render the AI Report directly as a "General Report". 
            */}
            <AIProcessManual
                surveyId="all"
                surveyTitle={`Reporte: ${context.name || 'Sucursal'}`}
                initialIndustry={userSettings?.industry || 'restaurant'}
                availableSurveys={surveys}
            />
        </div>
    )
}
