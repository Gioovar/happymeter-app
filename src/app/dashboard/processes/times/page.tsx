import { getProcessAnalytics } from '@/actions/processes'
import AttentionTimesView from '@/components/processes/AttentionTimesView'

export default async function TimesPage() {
    const data = await getProcessAnalytics()
    const evidences = data?.allEvidences || []

    return <AttentionTimesView evidences={evidences} />
}
