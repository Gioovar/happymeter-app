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
        return (
            <div className="min-h-screen bg-[#0f1115] flex items-center justify-center p-4">
                <div className="bg-[#1a1d26] p-8 rounded-2xl border border-red-500/20 max-w-md w-full text-center">
                    <h1 className="text-xl font-bold text-red-400 mb-2">Enlace Incompleto</h1>
                    <p className="text-gray-400">El enlace que intentas abrir no contiene el token de seguridad necesario.</p>
                </div>
            </div>
        )
    }

    try {
        const meta = await getPublicSurveyMetadata(surveyId, token)

        if (!meta) {
            return (
                <div className="min-h-screen bg-[#0f1115] flex items-center justify-center p-4">
                    <div className="bg-[#1a1d26] p-8 rounded-2xl border border-red-500/20 max-w-md w-full text-center">
                        <h1 className="text-xl font-bold text-red-400 mb-2">Reporte No Encontrado</h1>
                        <p className="text-gray-400">Es posible que la encuesta haya sido eliminada o el enlace haya expirado.</p>
                    </div>
                </div>
            )
        }

        return (
            <div className="bg-[#0f1115] min-h-screen">
                <AIProcessManual
                    surveyId={surveyId}
                    surveyTitle={meta.title}
                    initialIndustry={meta.industry || 'restaurant'}
                    publicToken={token}
                    initialAutoDownload={resolvedSearchParams.action === 'download'}
                />
            </div>
        )
    } catch (error) {
        return (
            <div className="min-h-screen bg-[#0f1115] flex items-center justify-center p-4">
                <div className="bg-[#1a1d26] p-8 rounded-2xl border border-red-500/20 max-w-md w-full text-center">
                    <h1 className="text-xl font-bold text-red-400 mb-2">Acceso Denegado</h1>
                    <p className="text-gray-400">El token de seguridad es inválido.</p>
                    <div className="mt-4 p-2 bg-black/30 rounded text-xs text-red-500/50 font-mono break-all">
                        ID: {surveyId}
                    </div>
                </div>
            </div>
        )
    }
}
