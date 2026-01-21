'use client'

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { useAuth } from '@clerk/nextjs'

// Types
export interface Survey {
    id: string
    title: string
    bannerUrl?: string | null
    responsesCount: number
    responses: any[]
    rating: number
    status: string
    date: string
    recentFeedbacks: {
        rating: number;
        comment: string;
        date: string;
        fullResponse: any;
    }[]
}

export interface StatsData {
    totalResponses: number
    averageSatisfaction: string
    npsScore: number
    activeUsers: number
    chartData: any[]
    sentimentCounts: any[]
    topIssues: any[]
    recentFeedback: any[]
    worstFeedback: any[]
    surveysWithStats: { id: string, rating: string }[]
    plan?: string
    kpiChanges?: {
        totalResponses: number
        averageSatisfaction: number
        npsScore: number
    }
}

// Chain Types
export interface ChainBranch {
    id: string
    chainId: string
    branchId: string
    name: string | null
    slug: string | null
    order: number
    branch: {
        userId: string
        businessName: string | null
        plan: string
    }
}

export interface Chain {
    id: string
    name: string
    ownerId: string
    branches: ChainBranch[]
}

interface DashboardContextType {
    surveys: Survey[]
    statsData: StatsData
    chains: Chain[]
    loadingSurveys: boolean
    loadingAnalytics: boolean
    refreshData: () => Promise<void>
    setSurveys: (surveys: Survey[]) => void // Allow local updates (e.g. optimistic delete)
    lastUpdated: Date | null
    isMobileMenuOpen: boolean
    toggleMobileMenu: (val: boolean) => void
    branchSlug?: string
    branchId?: string
}

const defaultStats: StatsData = {
    totalResponses: 0,
    averageSatisfaction: "0.0",
    npsScore: 0,
    activeUsers: 0,
    chartData: [],
    sentimentCounts: [],
    topIssues: [],
    recentFeedback: [],
    worstFeedback: [],
    surveysWithStats: []
}

const DashboardContext = createContext<DashboardContextType | undefined>(undefined)

// Add branchId to Props
export function DashboardProvider({ children, branchId, branchSlug }: { children: React.ReactNode, branchId?: string, branchSlug?: string }) {
    const { userId } = useAuth()

    // State
    const [surveys, setSurveysState] = useState<Survey[]>([])
    const [statsData, setStatsData] = useState<StatsData>(defaultStats)
    const [chains, setChains] = useState<Chain[]>([])
    const [loadingSurveys, setLoadingSurveys] = useState(true)
    const [loadingAnalytics, setLoadingAnalytics] = useState(true)
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

    // Setter wrapper to allow consumers to update state (e.g. after deletion)
    const setSurveys = (newSurveys: Survey[]) => {
        setSurveysState(newSurveys)
    }

    const fetchData = useCallback(async () => {
        if (!userId) return

        console.log('Fetching Dashboard Data...', { branchId })
        const now = new Date()

        // Parallel fetching
        setLoadingSurveys(true)
        setLoadingAnalytics(true)

        // Build query string if branchId exists
        const queryParams = branchId ? `?branchId=${branchId}` : ''

        try {
            const [surveysRes, analyticsRes, chainsRes] = await Promise.all([
                fetch(`/api/surveys${queryParams}`, { cache: 'no-store' }),
                fetch(`/api/analytics${queryParams}`, { cache: 'no-store' }),
                fetch(`/api/chains`, { cache: 'no-store' })
            ])

            if (surveysRes.ok) {
                const data = await surveysRes.json()
                // Transform data (moved from Page.tsx)
                const initialSurveys = data.map((s: any) => {
                    const recentFeedbacks = (s.responses || []).slice(0, 3).map((r: any) => {
                        try {
                            const answers = r.answers || []
                            const commentAnswer = answers.find((a: any) => a.question?.type === 'TEXT');
                            const ratingAnswer = answers.find((a: any) => a.question?.type === 'RATING' || a.question?.type === 'EMOJI');
                            const ratingVal = ratingAnswer ? parseInt(ratingAnswer.value) : (r.rating || 5);
                            return {
                                rating: isNaN(ratingVal) ? 5 : ratingVal,
                                comment: commentAnswer ? commentAnswer.value : "Sin comentario",
                                date: (() => { try { return new Date(r.createdAt).toLocaleDateString() } catch { return "" } })(),
                                fullResponse: r
                            }
                        } catch (e) {
                            return null
                        }
                    }).filter(Boolean)
                    return {
                        id: s.id,
                        title: s.title,
                        bannerUrl: s.bannerUrl,
                        responsesCount: s._count?.responses || 0,
                        responses: s.responses || [],
                        rating: 0,
                        status: 'Activa',
                        date: new Date(s.createdAt).toLocaleDateString(),
                        recentFeedbacks: recentFeedbacks
                    }
                })
                setSurveysState(initialSurveys)
            }

            if (analyticsRes.ok) {
                const data = await analyticsRes.json()
                setStatsData(data)
            }

            if (chainsRes.ok) {
                const data = await chainsRes.json()
                setChains(data)
            }

            setLastUpdated(now)

        } catch (error) {
            console.error('Error fetching dashboard data:', error)
        } finally {
            setLoadingSurveys(false)
            setLoadingAnalytics(false)
        }
    }, [userId])

    // Initial load
    useEffect(() => {
        if (userId && !lastUpdated) {
            fetchData()
        }
    }, [userId, lastUpdated, fetchData])

    return (
        <DashboardContext.Provider value={{
            surveys,
            statsData,
            chains,
            loadingSurveys,
            loadingAnalytics,
            lastUpdated,
            refreshData: fetchData,
            setSurveys,
            isMobileMenuOpen,
            toggleMobileMenu: setIsMobileMenuOpen,
            branchSlug,
            branchId
        }}>
            {children}
        </DashboardContext.Provider>
    )
}

export function useDashboard() {
    const context = useContext(DashboardContext)
    if (context === undefined) {
        throw new Error('useDashboard must be used within a DashboardProvider')
    }
    return context
}
