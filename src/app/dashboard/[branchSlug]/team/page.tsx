import { getTeamData } from '@/actions/team'
import TeamView from '@/components/team/TeamView'
import { getDashboardContext } from '@/lib/auth-context'
import { redirect } from 'next/navigation'

export default async function BranchTeamPage({ params }: { params: { branchSlug: string } }) {
    const context = await getDashboardContext(params.branchSlug)
    if (!context) redirect('/dashboard')

    // Context.userId is the Branch ID (for branches) or Owner ID (for personal)
    // getTeamData needs the "Target" branchID.
    // If we are in a branch context, context.userId is the branchId.
    // But getTeamData expects `branchId` as an optional argument to check permissions against CURRENT user.

    // Wait, getDashboardContext returns `userId` as the "Effective User ID".
    // If it's a branch, it returns the Branch's User ID.
    // So if we pass `context.userId` to `getTeamData`, it should work if we treat it as branchId?

    // Let's verify `getTeamData` logic:
    // `getTeamData(branchId)`:
    // Check if `branchId` is provided. If so, verify `auth().userId` owns the chain containing `branchId`.

    // So yes, we pass `context.userId` as `branchId`.
    // However, if we are NOT in a branch (personal dashboard), `branchId` is undefined.
    // In `BranchTeamPage`, we are always in a branch context (or redirected).

    const data = await getTeamData(context.userId)

    return <TeamView initialData={data} branchId={context.userId} />
}
