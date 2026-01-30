import { getOpsTasks } from '@/actions/processes'
import ActiveFlowsView from '@/components/processes/ActiveFlowsView'

export default async function FlowsPage() {
    const data = await getOpsTasks()

    // getOpsTasks returns { zones } or null
    // If null or empty, pass empty array
    const zones = data?.zones || []

    return <ActiveFlowsView zones={zones} />
}
