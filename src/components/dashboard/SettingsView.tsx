'use client'

import { SettingsForm } from '@/app/dashboard/settings/SettingsForm'
import PortalButton from '@/app/dashboard/settings/PortalButton'
import { Settings } from 'lucide-react'
import { useState } from 'react'
import SalesModal from '@/components/plans/SalesModal'
import InviteMemberModal from '@/components/team/InviteMemberModal'

interface SettingsViewProps {
    userSettings: any
    branchId?: string
    user?: any
}

export default function SettingsView({ userSettings, branchId, user }: SettingsViewProps) {
    const [isSalesModalOpen, setIsSalesModalOpen] = useState(false)
    const [isInviteModalOpen, setIsInviteModalOpen] = useState(false)

    if (!userSettings) {
        return <div>Error loading settings</div>
    }

    const PLAN_NAMES = {
        FREE: 'Starter Test',
        GROWTH: 'Growth 1K',
        POWER: 'Power 3X',
        CHAIN: 'Chain Master 100',
        ENTERPRISE: 'HappyMeter Infinity'
    }

    const PLAN_PRICES = {
        FREE: '0 MXN/mes',
        GROWTH: '290 MXN/mes',
        POWER: '790 MXN/mes',
        CHAIN: '2,990 MXN/mes',
        ENTERPRISE: 'Contactar Ventas'
    }

    // Fallback for email if Clerk user is not available
    const userEmail = user?.emailAddresses?.[0]?.emailAddress || 'Usuario'

    return (
        <div className="p-8 max-w-4xl mx-auto text-white">
            <div className="mb-8 flex items-center gap-3">
                <div className="p-3 bg-violet-600/20 rounded-xl text-violet-400">
                    <Settings className="w-8 h-8" />
                </div>
                <div>
                    <h1 className="text-3xl font-bold">Ajustes</h1>
                </div>
            </div>

            <div className="bg-[#111] border border-white/10 rounded-2xl p-8 shadow-xl mb-8">
                <SettingsForm userSettings={userSettings} branchId={branchId} />
            </div>

            <h2 className="text-2xl font-bold mb-6">Plan y facturación</h2>
            <div className="bg-[#111] border border-white/10 rounded-2xl p-8 mb-8">
                {/* Plan Details */}
                <div className="mb-8 pb-8 border-b border-white/10">
                    <h3 className="text-xl font-bold mb-6">Plan</h3>
                    <div className="flex flex-col md:flex-row justify-between items-start gap-6">
                        <div>
                            <div className="text-lg font-bold mb-1">
                                {PLAN_NAMES[userSettings.plan as keyof typeof PLAN_NAMES] || userSettings.plan} - {PLAN_PRICES[userSettings.plan as keyof typeof PLAN_PRICES] || ''}
                            </div>
                            <p className="text-gray-400 text-sm mb-4">
                                (Pueden aplicarse el IVA u otros impuestos)
                            </p>

                            <div className="space-y-1">
                                <p className="font-medium">Facturación {userSettings.interval === 'year' ? 'anual' : 'mensual'}</p>
                                {userSettings.subscriptionPeriodEnd && (
                                    <p className="text-gray-400">Próximo pago: {new Date(userSettings.subscriptionPeriodEnd).toLocaleDateString()}</p>
                                )}
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-3">
                            <PortalButton
                                text="Mejorar plan"
                                variant="outline"
                                showSync={false}
                                onClick={() => setIsSalesModalOpen(true)}
                            />
                            {userSettings.interval !== 'year' && (
                                <PortalButton
                                    text="Cambiar a facturación anual"
                                    variant="outline"
                                    showSync={false}
                                    onClick={() => setIsSalesModalOpen(true)}
                                />
                            )}
                            <PortalButton
                                text="Crear tu equipo"
                                variant="outline"
                                showSync={false}
                                onClick={() => setIsInviteModalOpen(true)}
                            />
                        </div>
                    </div>
                </div>

                {/* Billing Info */}
                <div className="mb-8 pb-8 border-b border-white/10">
                    <h2 className="text-xl font-bold mb-6">Información de facturación</h2>
                    <div className="flex flex-col md:flex-row justify-between items-start gap-6">
                        <div>
                            <p className="font-medium mb-1">{user?.firstName} {user?.lastName}</p>
                            <p className="text-gray-400">{userEmail}</p>
                        </div>
                        <div className="flex gap-3">
                            <PortalButton
                                text="Modificar información de facturación"
                                variant="outline"
                                showSync={false}
                            />
                            <PortalButton
                                text="Historial de facturación"
                                variant="outline"
                                showSync={false}
                            />
                        </div>
                    </div>
                </div>

                {/* Payment Data */}
                <div className="mb-8 pb-8 border-b border-white/10">
                    <h2 className="text-xl font-bold mb-6">Datos de pago</h2>
                    <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                        <div className="flex items-center gap-3 bg-white/5 px-4 py-3 rounded-lg">
                            <div className="w-8 h-5 bg-white/20 rounded"></div>
                            <span className="font-mono">************4242</span>
                        </div>
                        <PortalButton
                            text="Actualizar método de pago"
                            variant="outline"
                            showSync={false}
                        />
                    </div>
                </div>

                {/* Danger Zone */}
                <div>
                    <div className="border border-red-500/20 bg-red-500/5 rounded-lg overflow-hidden">
                        <details className="group">
                            <summary className="flex items-center justify-between p-4 cursor-pointer hover:bg-red-500/10 transition">
                                <div>
                                    <h3 className="text-red-500 font-bold mb-1">Zona de peligro</h3>
                                    <p className="text-gray-400 text-sm group-open:hidden">Cancelar una suscripción</p>
                                </div>
                                <span className="transform group-open:rotate-180 transition text-red-500">▼</span>
                            </summary>
                            <div className="p-4 pt-0 border-t border-red-500/10 mt-2">
                                <p className="text-gray-400 text-sm mb-4">
                                    Al cancelar tu suscripción, perderás el acceso a las funciones premium al final del periodo de facturación actual.
                                </p>
                                <PortalButton
                                    text="Cancelar Suscripción"
                                    variant="danger"
                                    showSync={false}
                                />
                            </div>
                        </details>
                    </div>
                </div>
            </div>

            <SalesModal
                isOpen={isSalesModalOpen}
                onOpenChange={setIsSalesModalOpen}
            />

            <InviteMemberModal
                isOpen={isInviteModalOpen}
                onOpenChange={setIsInviteModalOpen}
                branchSlug={branchId}
            />
        </div>
    )
}
