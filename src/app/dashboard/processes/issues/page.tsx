import { getProcessAnalytics } from '@/actions/processes'
import IssuesView from '@/components/processes/IssuesView'

export default async function IssuesPage() {
    const data = await getProcessAnalytics()
    const issues = data?.issues || []

    return <IssuesView issues={issues} />
}
