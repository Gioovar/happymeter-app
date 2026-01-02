
import { auth, currentUser } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { getMemberLoyaltyPrograms } from "@/actions/loyalty"

export default async function AppEntryPoint() {
    const { userId } = await auth()

    // If not logged in, go to landing page
    if (!userId) redirect("/")

    // Check if admin (has role)
    const user = await currentUser()
    if (user?.publicMetadata?.role === 'admin') {
        redirect("/dashboard")
    }

    // Check loyalty memberships
    const res = await getMemberLoyaltyPrograms(userId)

    if (res.success && res.memberships && res.memberships.length > 0) {
        // Setup logic:
        // 1. If multiple, maybe go to a wallet page? (Currently no wallet page, so just go to first)
        // 2. Ideally go to the most recently visited or the first one.
        const firstProgramId = res.memberships[0].program.id
        redirect(`/loyalty/${firstProgramId}`)
    }

    // Fallback if logged in but no role and no memberships
    redirect("/")
}
