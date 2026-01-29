'use client'

import { useAuth } from '@clerk/nextjs'
import { useRouter, useParams, useSearchParams } from 'next/navigation'
import { useDashboard } from '@/context/DashboardContext'
import { toast } from 'sonner'
import { useEffect, useState } from 'react'
import HappyLoader from '@/components/HappyLoader'
import DashboardView from '@/components/dashboard/DashboardView'

export default function DashboardPage() {
    const { userId, isLoaded } = useAuth()
    const router = useRouter()
    const params = useParams()
    const searchParams = useSearchParams()

    // Access Global Dashboard State
    const {
        chains,
        loadingSurveys,
        loadingAnalytics,
    } = useDashboard()

    // --- LOGIC: Master Dashboard vs Branch Dashboard ---
    const branchId = searchParams.get('branchId')
    const branchSlug = typeof params?.slug === 'string' ? params.slug : undefined
    const isBranchMode = !!branchId || !!branchSlug

    // If user has chains AND is not viewing a specific branch -> Show Master Dashboard
    // MODIFIED: Only show Master Dashboard if there are MULTIPLE branches.
    // Single-branch businesses should go directly to the standard dashboard.
    const activeChain = chains[0]
    const hasMultipleBranches = activeChain?.branches?.length > 1
    const showMasterDashboard = chains.length > 0 && !isBranchMode && hasMultipleBranches

    // SABOTAGE SAFEGUARD: Check for pending checkout cookie
    useEffect(() => {
        const getCookie = (name: string) => {
            if (typeof document === 'undefined') return undefined
            const value = `; ${document.cookie}`;
            const parts = value.split(`; ${name}=`);
            if (parts.length === 2) return parts.pop()?.split(';').shift();
        }

        const pendingPlan = getCookie('checkout_plan')

        if (pendingPlan) {
            const pendingInterval = getCookie('checkout_interval')

            // Clear cookies to avoid infinite loops
            document.cookie = "checkout_plan=; max-age=0; path=/"
            document.cookie = "signup_intent=; max-age=0; path=/"
            document.cookie = "checkout_interval=; max-age=0; path=/"

            toast.loading('Finalizando proceso de compra...')

            const params = new URLSearchParams()
            params.set('checkout', 'true')
            params.set('plan', pendingPlan)
            if (pendingInterval) params.set('interval', pendingInterval)
            window.location.href = `/pricing?${params.toString()}`
        }
    }, [])

    if (loadingSurveys && loadingAnalytics) {
        return (
            <div className="flex h-screen w-full items-center justify-center bg-[#0a0a0a]">
                <HappyLoader size="lg" text="Cargando tu dashboard..." />
            </div>
        )
    }

    useEffect(() => {
        if (showMasterDashboard) {
            router.replace('/dashboard/chains')
        }
    }, [showMasterDashboard, router])

    if (showMasterDashboard) {
        return <HappyLoader size="lg" text="Cargando tus sucursales..." />
    }

    // Resolve Branch Name for Standard Dashboard View
    let resolvedBranchName = undefined
    if (branchId) {
        const foundBranch = chains.flatMap(c => c.branches).find(b => b.branchId === branchId)
        if (foundBranch) {
            resolvedBranchName = foundBranch.name || foundBranch.branch.businessName || 'Sucursal'
        } else {
            resolvedBranchName = 'Sucursal'
        }
    }

    return (
        <DashboardView
            branchName={resolvedBranchName}
            isBranchMode={isBranchMode}
        />
    )
}
