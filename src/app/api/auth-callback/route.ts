
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { NextRequest } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
    const { userId } = await auth()
    if (!userId) redirect('/sign-in')

    const cookieStore = await cookies()
    const searchParams = request.nextUrl.searchParams
    const intentCookie = cookieStore.get('signup_intent')?.value
    const intentParam = searchParams.get('signup_intent')

    // Check both cookie and param
    const intent = intentParam || intentCookie

    if (intent === 'creator') {
        // Clean up
        if (intentCookie) cookieStore.delete('signup_intent')
        redirect('/creators/dashboard')
    }

    if (intent === 'seller') {
        if (intentCookie) cookieStore.delete('signup_intent')
        redirect('/sellers/join')
    }

    if (intent === 'checkout') {
        const plan = cookieStore.get('checkout_plan')?.value
        const interval = cookieStore.get('checkout_interval')?.value

        // Clean up intent cookies
        cookieStore.delete('signup_intent')
        cookieStore.delete('checkout_plan')
        cookieStore.delete('checkout_interval')

        if (plan) {
            const params = new URLSearchParams()
            params.set('checkout', 'true')
            params.set('plan', plan)
            if (interval) params.set('interval', interval)
            redirect(`/pricing?${params.toString()}`)
        }
    }


    // Check if user has completed onboarding
    let userSettings = null
    try {
        userSettings = await prisma.userSettings.findUnique({
            where: { userId }
        })
    } catch (error) {
        console.error("Auth Callback DB Error:", error)
        // If DB is down, we allow access to dashboard to avoid hard block
        // The dashboard itself handles missing data gracefully now
        redirect('/dashboard')
    }

    if (userSettings && !userSettings.isOnboarded) {
        // Skip onboarding for Admin/Staff
        const role = userSettings.role
        if (role === 'ADMIN' || role === 'SUPER_ADMIN' || role === 'STAFF') {
            redirect('/dashboard')
        }
        redirect('/onboarding')
    }

    redirect('/dashboard')
}
