'use client'

import NotificationCenter from '@/components/admin/NotificationCenter'

export default function TestPage() {
    return (
        <div className="min-h-screen bg-gray-900 p-10 flex justify-center items-start">
            <div className="text-white">
                <h1 className="mb-4">Debug Notifications</h1>
                {/* Render the component here */}
                <NotificationCenter />
            </div>
        </div>
    )
}
