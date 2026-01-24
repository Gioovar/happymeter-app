import { getTeamData } from '@/actions/team'
import TeamView from '@/components/team/TeamView'

export default async function TeamPage() {
    const data = await getTeamData()

    return <TeamView initialData={data} />
}
