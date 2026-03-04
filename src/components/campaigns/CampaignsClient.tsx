'use client'

import { useState } from 'react'
import CampaignManager from '@/components/CampaignManager'
import WhatsAppManager from '@/components/WhatsAppManager'
import PushCampaignBuilder from './PushCampaignBuilder'
import { MessageSquare, BellRing } from 'lucide-react'

interface CampaignsClientProps {
    initialSurveys: { id: string, title: string }[]
    branchId?: string // Optional: If present, we are in a branch context
    branchName?: string // Optional: Name of the branch for display
}

export default function CampaignsClient({ initialSurveys, branchId, branchName }: CampaignsClientProps) {
    const [selectedSurveyId, setSelectedSurveyId] = useState('all')

    const selectedSurveyTitle = initialSurveys.find(s => s.id === selectedSurveyId)?.title || 'Todas las Encuestas'
    const displayName = branchName ? `Marketing Hub: ${branchName}` : 'Marketing Hub'

    const [activeTab, setActiveTab] = useState<'EXPORT' | 'PUSH'>('EXPORT')

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-white p-4 md:p-8 space-y-8 font-sans">
            {/* Header Hub */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-white/10 pb-6">
                <div>
                    <h1 className="text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-violet-400 to-fuchsia-400 mb-2">
                        {displayName}
                    </h1>
                    <p className="text-gray-400 max-w-2xl">
                        Centraliza tus esfuerzos de retención. Exporta audiencias para redes sociales y gestiona tus comunidades de WhatsApp desde un solo lugar.
                    </p>
                </div>
                <div className="flex items-center gap-3 bg-white/5 p-1 rounded-xl border border-white/10">
                    <span className="text-xs text-gray-500 font-bold px-2 uppercase tracking-wider">Fuente de Datos:</span>
                    <select
                        value={selectedSurveyId}
                        onChange={(e) => setSelectedSurveyId(e.target.value)}
                        className="bg-transparent text-sm text-white focus:outline-none font-medium min-w-[180px] cursor-pointer hover:text-violet-300 transition"
                    >
                        <option value="all" className="bg-[#1a1d26]">Todas las Encuestas</option>
                        {initialSurveys.map(survey => (
                            <option key={survey.id} value={survey.id} className="bg-[#1a1d26]">{survey.title}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-4 border-b border-white/10 pb-4">
                <button
                    onClick={() => setActiveTab('EXPORT')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${activeTab === 'EXPORT' ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                >
                    <MessageSquare className="w-4 h-4" />
                    Exportar VCF y WhatsApp
                </button>
                <button
                    onClick={() => setActiveTab('PUSH')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${activeTab === 'PUSH' ? 'bg-violet-500/20 text-violet-300 border border-violet-500/30' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                >
                    <BellRing className="w-4 h-4" />
                    Push Nativas (Lealtad)
                </button>
            </div>

            {/* Grid Principal */}
            {activeTab === 'EXPORT' ? (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                    <CampaignManager
                        selectedSurveyTitle={selectedSurveyTitle}
                        selectedSurveyId={selectedSurveyId}
                        branchId={branchId}
                    />
                    <WhatsAppManager
                        selectedSurveyTitle={selectedSurveyTitle}
                        selectedSurveyId={selectedSurveyId}
                        branchId={branchId}
                    />
                </div>
            ) : (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <PushCampaignBuilder branchId={branchId} />
                </div>
            )}
        </div>
    )
}
