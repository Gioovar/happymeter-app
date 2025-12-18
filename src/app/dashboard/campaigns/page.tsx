
'use client'

import { useAuth } from '@clerk/nextjs'
import { redirect } from 'next/navigation'
import { useState, useEffect } from 'react'
import CampaignManager from '@/components/CampaignManager'
import WhatsAppManager from '@/components/WhatsAppManager'

export default function CampaignsPage() {
    const { userId, isLoaded } = useAuth()
    const [surveys, setSurveys] = useState<{ id: string, title: string }[]>([])
    const [selectedSurveyId, setSelectedSurveyId] = useState('all')

    useEffect(() => {
        const fetchSurveys = async () => {
            const res = await fetch('/api/surveys')
            if (res.ok) {
                const data = await res.json()
                setSurveys(data)
            }
        }
        if (userId) fetchSurveys()
    }, [userId])

    if (isLoaded && !userId) {
        redirect('/')
    }

    const selectedSurveyTitle = surveys.find(s => s.id === selectedSurveyId)?.title || 'Todas las Encuestas'

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-white p-8 space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold mb-2">Campañas de Marketing</h1>
                    <p className="text-gray-400">Gestiona tus anuncios en Meta y comunicaciones por WhatsApp.</p>
                </div>
                <div className="flex items-center gap-3">
                    <span className="text-sm text-gray-500">Encuesta:</span>
                    <select
                        value={selectedSurveyId}
                        onChange={(e) => setSelectedSurveyId(e.target.value)}
                        className="bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-violet-500 min-w-[200px]"
                    >
                        <option value="all">Todas las Encuestas</option>
                        {surveys.map(survey => (
                            <option key={survey.id} value={survey.id}>{survey.title}</option>
                        ))}
                    </select>
                </div>
            </div>

            <CampaignManager selectedSurveyTitle={selectedSurveyTitle} selectedSurveyId={selectedSurveyId} />
            <WhatsAppManager selectedSurveyTitle={selectedSurveyTitle} selectedSurveyId={selectedSurveyId} />
        </div>
    )
}
