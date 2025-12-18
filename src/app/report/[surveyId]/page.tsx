import { notFound } from "next/navigation"
import AIProcessManual from "@/components/AIProcessManual"
import { getPublicSurveyMetadata } from "@/actions/analytics"

interface PageProps {
    params: Promise<{ surveyId: string }>;
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function PublicReportPage({ params, searchParams }: PageProps) {
    const resolvedParams = await params
    const resolvedSearchParams = await searchParams

    const { surveyId } = resolvedParams
    const token = resolvedSearchParams.token as string

    if (!token) {
        return notFound()
    }

    try {
        const meta = await getPublicSurveyMetadata(surveyId, token)
        if (!meta) return notFound()

        return (
            <div className="bg-[#0f1115] min-h-screen">
                <AIProcessManual
                    surveyId={surveyId}
                    surveyTitle={meta.title}
                    initialIndustry={meta.industry || 'restaurant'}
                    publicToken={token}
                />
            </div>
        )
    } catch (error) {
        return notFound()
    }
}
