'use client'

import { useEffect, useRef } from 'react'
import { useSearchParams } from 'next/navigation'

export default function LinkTracker() {
    const searchParams = useSearchParams()
    const effectRan = useRef(false)

    useEffect(() => {
        // Prevent double tracking in React Strict Mode (dev)
        if (effectRan.current) return

        const refCode = searchParams.get('ref')
        if (refCode) {
            effectRan.current = true
            // Fire and forget tracking
            fetch('/api/track-click', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code: refCode })
            }).catch(err => console.error('Tracking Error:', err))
        }
    }, [searchParams])

    return null
}
