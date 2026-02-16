'use client'

import { getTeamData } from '@/actions/team'
import TeamManager from '@/components/team/TeamManager'
import { Users } from 'lucide-react'
import { useEffect, useState } from 'react'
import HappyLoader from '@/components/HappyLoader'

interface TeamViewProps {
    branchId?: string
}

// Since getTeamData is a server action, it is async. 
// We can use it directly in a Server Component, but if we want to reuse the same visual structure
// we can either have a Server Compoent Wrapper `TeamView` or make `TeamView` a hybrid.

// Let's stick to the pattern: Server Page fetches data -> Client Component displays it.
// BUT `TeamManager` is already a client component handling invites? 
// Actually `TeamManager` receives `initialData`.

// So I will create a reusable SERVER Component `TeamPageContent` that fetches data and renders `TeamManager`.
// Wait, Server Components cannot be imported into Client Components easily, but can be used in Pages.

import { ReactNode } from 'react'

export default function TeamView({ initialData, branchId }: { initialData: any, branchId?: string }) {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-white flex items-center gap-3 tracking-tight">
                    <Users className="w-8 h-8 text-violet-500" />
                    Administración de Acceso
                </h1>
                <p className="text-gray-400 mt-1">Gestiona los permisos y roles de los integrantes de tu cuenta.</p>
            </div>

            <TeamManager initialData={initialData} branchId={branchId} />
        </div>
    )
}
