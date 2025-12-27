import { getTeamData } from '@/actions/team'
import TeamManager from '@/components/team/TeamManager'
import { Users } from 'lucide-react'

export default async function TeamPage() {
    const data = await getTeamData()

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                    <Users className="w-8 h-8 text-violet-500" />
                    Gestión de Equipo
                </h1>
                <p className="text-gray-400 mt-1">Invita colaboradores y define sus permisos.</p>
            </div>

            <TeamManager initialData={data} />
        </div>
    )
}
