import { redirect } from 'next/navigation'

export default function OnboardingPage() {
    // This is the entry point for /onboarding.
    // Dashboard Layout redirects here if not onboarded.
    // We redirect to the first step: Welcome.
    redirect('/onboarding/welcome')
}
