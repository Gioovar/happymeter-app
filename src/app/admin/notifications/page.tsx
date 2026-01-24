'use client'

import PushNotificationConsole from '@/components/admin/PushNotificationConsole'
import AdminSidebar from '@/components/admin/AdminSidebar'

export default function AdminNotificationsPage() {
    return (
        <div className="min-h-screen bg-black text-white">
            <AdminSidebar />

            <main className="lg:pl-72 p-8">
                <div className="max-w-5xl mx-auto space-y-8">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h1 className="text-3xl font-bold">Centro de Mensajes</h1>
                            <p className="text-gray-400">Envía notificaciones push a tus usuarios.</p>
                        </div>
                    </div>

                    <PushNotificationConsole />
                </div>
            </main>
        </div>
    )
}
