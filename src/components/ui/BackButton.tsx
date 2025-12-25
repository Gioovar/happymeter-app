'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

interface BackButtonProps {
    fallbackRoute?: string
    label?: string
}

export default function BackButton({ fallbackRoute = '/dashboard/responses', label = 'Volver' }: BackButtonProps) {
    const router = useRouter()
    const searchParams = useSearchParams()
    const source = searchParams.get('source')

    if (source === 'notification') {
        return (
            <button
                onClick={() => router.back()}
                className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition group py-2"
            >
                <div className="p-2 rounded-lg bg-white/5 border border-white/5 group-hover:bg-white/10 transition">
                    <ArrowLeft className="w-4 h-4" />
                </div>
                <span className="text-sm font-medium">{label}</span>
            </button>
        )
    }

    return (
        <Link href={fallbackRoute} className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition group py-2">
            <div className="p-2 rounded-lg bg-white/5 border border-white/5 group-hover:bg-white/10 transition">
                <ArrowLeft className="w-4 h-4" />
            </div>
            <span className="text-sm font-medium">{label}</span>
        </Link>
    )
}
