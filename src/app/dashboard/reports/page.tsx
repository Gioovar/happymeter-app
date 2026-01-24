import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import AIProcessManual from '@/components/AIProcessManual'

export default async function ReportsIndexPage() {
    const { userId } = await auth()
    console.log("Rendering Reports Index Page for user:", userId)

    if (!userId) {
        redirect('/')
    }

    // Fetch User Settings to get the Industry
    let userSettings = null
    try {
        userSettings = await prisma.userSettings.findUnique({
            where: { userId }
        })
    } catch (error) {
        console.error("Failed to fetch user settings:", error)
        // Fallback to null (logic below handles this -> defaults to 'restaurant')
    }

    // Fetch all surveys for the selector
    const surveys = await prisma.survey.findMany({
        where: { userId },
        select: { id: true, title: true },
        orderBy: { createdAt: 'desc' }
    })

    return (
        <div className="min-h-screen bg-[#0a0a0a]">
            {/* 
              We render the AI Report directly as a "General Report". 
              In a real app, 'all' would trigger an aggregate query.
            */}
            <AIProcessManual
                surveyId="all"
                surveyTitle="Reporte General Unificado"
                initialIndustry={userSettings?.industry || 'restaurant'}
                availableSurveys={surveys}
            />
        </div>
    )
}
