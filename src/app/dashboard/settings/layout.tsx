import { Suspense } from 'react'
import HappyLoader from '@/components/HappyLoader'

export default function SettingsLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <Suspense fallback={
            <div className="w-full h-screen flex items-center justify-center">
                <HappyLoader size="lg" text="Cargando configuración..." />
            </div>
        }>
            {children}
        </Suspense>
    )
}
