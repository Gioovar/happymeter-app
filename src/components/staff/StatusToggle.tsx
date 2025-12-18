'use client'

import { toggleCreatorStatus } from '@/actions/staff'
import { Switch } from '@/components/ui/switch' // We might not have this, so I'll use a button if switch fails or check for it
import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

export default function StatusToggle({ creatorId, initialStatus }: { creatorId: string, initialStatus: string }) {
    const [status, setStatus] = useState(initialStatus)
    const [isPending, startTransition] = useTransition()

    const handleToggle = () => {
        startTransition(async () => {
            try {
                const res = await toggleCreatorStatus(creatorId, status)
                setStatus(res.newStatus)
                toast.success(`Creador ${res.newStatus === 'ACTIVE' ? 'activado' : 'suspendido'}`)
            } catch (e) {
                toast.error('Error al cambiar estado')
                console.error(e)
            }
        })
    }

    return (
        <button
            onClick={handleToggle}
            disabled={isPending}
            className={`
                relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2
                ${status === 'ACTIVE' ? 'bg-green-600' : 'bg-gray-700'}
            `}
        >
            <span className="sr-only">Toggle status</span>
            <span
                className={`
                    inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                    ${status === 'ACTIVE' ? 'translate-x-6' : 'translate-x-1'}
                    ${isPending ? 'opacity-50' : 'opacity-100'}
                `}
            />
            {isPending && <Loader2 className="absolute -right-6 w-4 h-4 animate-spin text-gray-500" />}
        </button>
    )
}
