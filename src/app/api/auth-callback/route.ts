
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

    // Check if user has completed onboarding or has subscription
    let userSettings = null
    try {
        if (userId) { // Ensure userId is present
            userSettings = await prisma.userSettings.findUnique({
                where: { userId }
            })
        }
    } catch (error) {
        console.error("Auth Callback DB Error:", error)
    }

    if (intent === 'view_pricing') {
        // If user already has a paid plan, don't force them to pricing
        if (userSettings && userSettings.plan !== 'FREE' && userSettings.subscriptionStatus === 'active') {
            if (intentCookie) cookieStore.delete('signup_intent')
            redirect('/dashboard')
        }

        // Otherwise, send them to pricing to convert
        if (intentCookie) cookieStore.delete('signup_intent')
        redirect('/pricing')
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
