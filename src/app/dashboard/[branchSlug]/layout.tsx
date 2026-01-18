import { redirect } from 'next/navigation'
import { getDashboardContext } from '@/lib/auth-context'
import { DashboardProvider } from '@/context/DashboardContext'

export default async function BranchDashboardLayout({
    children,
    params
}: {
    children: React.ReactNode
    params: { branchSlug: string }
}) {
    const context = await getDashboardContext(params.branchSlug)

    if (!context || !context.isBranch) {
        redirect('/dashboard')
    }

    // We pass the EFFECTIVE user ID (the branch's ID) as the branchId prop
    // The DashboardProvider will use this to append ?branchId=... to requests
    return (
        <DashboardProvider branchId={context.userId} branchSlug={params.branchSlug}>
            {children}
        </DashboardProvider>
    )
}
