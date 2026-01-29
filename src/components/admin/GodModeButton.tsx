'use client'

import { useState } from 'react'
import { Zap } from 'lucide-react'
import GodModeModal from './GodModeModal'

interface GodModeButtonProps {
    tenant: {
        userId: string
        businessName: string | null
        plan: string
        maxBranches?: number
        extraSurveys?: number
    }
}

export default function GodModeButton({ tenant }: GodModeButtonProps) {
    const [isOpen, setIsOpen] = useState(false)

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className="flex items-center gap-2 px-3 py-1.5 bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/20 text-orange-400 text-xs font-bold rounded-lg transition"
                title="Edit Subscription (God Mode)"
            >
                <Zap className="w-4 h-4" />
                <span>God Mode Edit</span>
            </button>

            {isOpen && (
                <GodModeModal
                    isOpen={isOpen}
                    onClose={() => setIsOpen(false)}
                    tenant={tenant}
                />
            )}
        </>
    )
}
