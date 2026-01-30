import { getTeamData } from '@/actions/team'
import TeamView from '@/components/team/TeamView'

export default async function ProcessesTeamPage() {
    const data = await getTeamData()

    return <TeamView initialData={data} />
}
