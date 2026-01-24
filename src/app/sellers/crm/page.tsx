import { getLeads } from '@/actions/crm'
import { getSellerDashboardData } from '@/actions/sellers'
import CRMDashboard from '@/components/sellers/CRMDashboard'

export default async function CRMPage() {
    const [leads, data] = await Promise.all([
        getLeads(),
        getSellerDashboardData()
    ])

    const userState = data?.profile.state || ''

    return <CRMDashboard leads={leads} userState={userState} />
}
