'use client'

import CreateSurveyView from '@/components/dashboard/CreateSurveyView'
import { useDashboard } from '@/context/DashboardContext'
import { redirect } from 'next/navigation'
import { useEffect } from 'react'
import HappyLoader from '@/components/HappyLoader'

export default function BranchCreatePage({ params }: { params: { branchSlug: string } }) {
    const { branchId, branchSlug } = useDashboard()

    // Optionally safeguard: if context is loading or mismatched. 
    // Usually the Layout handles valid context, but we need the branchId locally to pass to the view.
    // Since DashboardProvider exposes branchId, we can just use it.

    // We should double check if the loaded branch matches the params (it should since Layout sets it)

    if (!branchId) {
        return <div className="h-screen flex items-center justify-center"><HappyLoader /></div>
    }

    return (
        <CreateSurveyView
            branchId={branchId}
            backLink={`/dashboard/${params.branchSlug}`}
        />
    )
}
