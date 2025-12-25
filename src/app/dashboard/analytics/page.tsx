
'use client'

import { useAuth } from '@clerk/nextjs'
import { redirect, useSearchParams } from 'next/navigation'
import { useState, useEffect } from 'react'
import ExportReportModal from '@/components/ExportReportModal'
import HappyLoader from '@/components/HappyLoader'
import { Download } from 'lucide-react'
import dynamic from 'next/dynamic'

// Lazy load heavy chart component
const DetailedAnalytics = dynamic(() => import('@/components/DetailedAnalytics'), {
    loading: () => <div className="h-96 flex items-center justify-center"><HappyLoader /></div>,
    ssr: false // Charts often cause hydration mismatch, safe to disable SSR
})

export default function AnalyticsPage() {
    const { userId, isLoaded } = useAuth()
    const searchParams = useSearchParams()

    // Date Filters from URL
    const startDateParam = searchParams.get('startDate')
    const endDateParam = searchParams.get('endDate')

    const [isLoading, setIsLoading] = useState(true)
    const [isExportModalOpen, setIsExportModalOpen] = useState(false)
    const [statsData, setStatsData] = useState<{
        // ... (types kept same)
        totalResponses: number,
        averageSatisfaction: string,
        npsScore: number,
        activeUsers: number,
        chartData: any[],
        sentimentCounts: any[],
        topIssues: any[],
        recentFeedback: any[],
        bestFeedback: any[],
        worstFeedback: any[],
        surveysWithStats: { id: string, rating: string }[],
        kpiChanges?: { totalResponses: number, averageSatisfaction: number, npsScore: number },
        staffRanking?: any[]
    }>({
        totalResponses: 0,
        averageSatisfaction: "0.0",
        npsScore: 0,
        activeUsers: 0,
        chartData: [],
        sentimentCounts: [],
        topIssues: [],
        recentFeedback: [],
        bestFeedback: [],
        worstFeedback: [],
        surveysWithStats: [],
        kpiChanges: undefined,
        staffRanking: []
    })

    const [selectedSurvey, setSelectedSurvey] = useState('all')
    const [surveysList, setSurveysList] = useState<{ id: string, title: string }[]>([])

    // Function to fetch data with optional filter
    const fetchAnalytics = async (surveyId?: string) => {
        setIsLoading(true)
        try {
            const params = new URLSearchParams()
            if (surveyId && surveyId !== 'all') params.append('surveyId', surveyId)
            if (startDateParam) params.append('startDate', startDateParam)
            if (endDateParam) params.append('endDate', endDateParam)

            const url = `/api/analytics?${params.toString()}`
            const res = await fetch(url, { cache: 'no-store' })
            if (res.ok) {
                const data = await res.json()
                setStatsData(data)
                if (data.surveysList) {
                    setSurveysList(data.surveysList)
                }
            }
        } catch (error) {
            console.error('Failed to fetch analytics', error)
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        if (userId) {
            fetchAnalytics(selectedSurvey) // Pass current selection
        }
    }, [userId, startDateParam, endDateParam]) // Refetch on date change

    useEffect(() => {
        if (userId) {
            fetchAnalytics()
        }
    }, [userId])


    const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const id = e.target.value
        setSelectedSurvey(id)
        fetchAnalytics(id)
    }

    if (isLoaded && !userId) {
        redirect('/')
    }

    return (
        <div className="w-full max-w-[1600px] mx-auto space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-bold mb-2">Analíticas Avanzadas</h1>
                    <p className="text-gray-400">Visualiza el rendimiento detallado.</p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <span className="text-sm text-gray-500">Filtrar por:</span>
                    <select
                        value={selectedSurvey}
                        onChange={handleFilterChange}
                        className="bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-violet-500 min-w-[200px]"
                    >
                        <option value="all">Todas las Encuestas</option>
                        {surveysList.map(survey => (
                            <option key={survey.id} value={survey.id}>{survey.title}</option>
                        ))}
                    </select>
                </div>
            </div>

            {isLoading ? (
                <div className="h-[60vh] flex flex-col items-center justify-center">
                    <HappyLoader size="lg" text="Actualizando Datos..." />
                </div>
            ) : statsData.totalResponses > 0 ? (
                <DetailedAnalytics
                    data={statsData}
                    isStaffSurvey={surveysList.find(s => s.id === selectedSurvey)?.title.toLowerCase().includes('staff') || false}
                />
            ) : (
                <div className="p-12 text-center border border-dashed border-white/10 rounded-2xl bg-white/5">
                    <p className="text-gray-400">Aún no hay suficientes datos para mostrar analíticas detalladas.</p>
                </div>
            )}

            <ExportReportModal
                isOpen={isExportModalOpen}
                onClose={() => setIsExportModalOpen(false)}
                surveys={surveysList}
            />
        </div>
    )
}
