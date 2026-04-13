'use client'

import { useAuth } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { useDashboard } from '@/context/DashboardContext'
import { toast } from 'sonner'
import { useEffect } from 'react'
import HappyLoader from '@/components/HappyLoader'

export default function DashboardPage() {
    const { isLoaded } = useAuth()
    const router = useRouter()

    // Access Global Dashboard State
    const { branchId } = useDashboard()

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
            return;
        }

        // If no checkout pending, proceed to unified architecture routing
        if (isLoaded && branchId) {
            router.replace(`/dashboard/${branchId}`)
        }
    }, [isLoaded, branchId, router])

    return (
        <div className="flex h-screen w-full items-center justify-center bg-[#0a0a0a]">
            <HappyLoader size="lg" text="Cargando entorno..." />
        </div>
    )
}
