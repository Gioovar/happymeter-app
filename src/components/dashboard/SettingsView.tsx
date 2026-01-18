'use client'

import { SettingsForm } from '@/app/dashboard/settings/SettingsForm'
import PortalButton from '@/app/dashboard/settings/PortalButton'
import { Settings, Store, User } from 'lucide-react'
import Link from 'next/link'

interface SettingsViewProps {
    userSettings: any
    branchId?: string
}

export default function SettingsView({ userSettings, branchId }: SettingsViewProps) {
    if (!userSettings) {
        return <div>Error loading settings</div>
    }

    return (
        <div className="p-8 max-w-4xl mx-auto text-white">
            <div className="mb-8 flex items-center gap-3">
                <div className="p-3 bg-violet-600/20 rounded-xl text-violet-400">
                    <Settings className="w-8 h-8" />
                </div>
                <div>
                    <h1 className="text-3xl font-bold">Configuración</h1>
                    <p className="text-gray-400">Administra los detalles de tu negocio y preferencias.</p>
                </div>
            </div>

            <div className="bg-[#111] border border-white/10 rounded-2xl p-8 shadow-xl mb-8">
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <h2 className="text-xl font-bold mb-1">Tu Suscripción</h2>
                        <p className="text-gray-400 text-sm">Gestiona tu plan y facturación.</p>
                    </div>
                </div>

                <div className="bg-white/5 rounded-xl p-6 flex flex-col md:flex-row justify-between items-center gap-6">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <span className="text-2xl font-bold text-white uppercase">{userSettings.plan}</span>
                            <span className={`px-3 py-1 text-xs font-bold rounded-full ${userSettings.subscriptionStatus === 'active' ? 'bg-green-500/10 text-green-400' : 'bg-yellow-500/10 text-yellow-500'}`}>
                                {(userSettings.subscriptionStatus || 'INACTIVE').toUpperCase()}
                            </span>
                        </div>
                        {userSettings.subscriptionPeriodEnd && (
                            <p className="text-sm text-gray-500">
                                Renueva el: {userSettings.subscriptionPeriodEnd.toLocaleDateString()}
                            </p>
                        )}
                    </div>

                    <div className="flex gap-4">
                        <PortalButton />
                        <Link href="/pricing" className="px-5 py-2.5 bg-violet-600 hover:bg-violet-500 text-white font-bold rounded-xl transition">
                            Ver Planes
                        </Link>
                    </div>
                </div>
            </div>

            <div className="bg-[#111] border border-white/10 rounded-2xl p-8 shadow-xl">
                <SettingsForm userSettings={userSettings} branchId={branchId} />
            </div>
        </div>
    )
}
