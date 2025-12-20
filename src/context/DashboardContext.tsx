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
}

interface DashboardContextType {
    surveys: Survey[]
    statsData: StatsData
    loadingSurveys: boolean
    loadingAnalytics: boolean
    lastUpdated: Date | null
    refreshData: () => Promise<void>
    setSurveys: (surveys: Survey[]) => void // Allow local updates (e.g. optimistic delete)
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

export function DashboardProvider({ children }: { children: React.ReactNode }) {
    const { userId } = useAuth()

    // State
    const [surveys, setSurveysState] = useState<Survey[]>([])
    const [statsData, setStatsData] = useState<StatsData>(defaultStats)
    const [loadingSurveys, setLoadingSurveys] = useState(true)
    const [loadingAnalytics, setLoadingAnalytics] = useState(true)
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

    // Setter wrapper to allow consumers to update state (e.g. after deletion)
    const setSurveys = (newSurveys: Survey[]) => {
        setSurveysState(newSurveys)
    }

    const fetchData = useCallback(async () => {
        if (!userId) return

        console.log('Fetching Dashboard Data...')
        const now = new Date()

        // Parallel fetching
        setLoadingSurveys(true)
        setLoadingAnalytics(true)

        try {
            const [surveysRes, analyticsRes] = await Promise.all([
                fetch('/api/surveys', { cache: 'no-store' }),
                fetch('/api/analytics', { cache: 'no-store' })
            ])

            if (surveysRes.ok) {
                const data = await surveysRes.json()
                // Transform data (moved from Page.tsx)
                const initialSurveys = data.map((s: any) => {
                    const recentFeedbacks = (s.responses || []).slice(0, 3).map((r: any) => {
                        const commentAnswer = r.answers.find((a: any) => a.question?.type === 'TEXT');
                        const ratingAnswer = r.answers.find((a: any) => a.question?.type === 'RATING' || a.question?.type === 'EMOJI');
                        const ratingVal = ratingAnswer ? parseInt(ratingAnswer.value) : (r.rating || 5);
                        return {
                            rating: ratingVal,
                            comment: commentAnswer ? commentAnswer.value : "Sin comentario",
                            date: new Date(r.createdAt).toLocaleDateString(),
                            fullResponse: r
                        }
                    })
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
            loadingSurveys,
            loadingAnalytics,
            lastUpdated,
            refreshData: fetchData,
            setSurveys
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
