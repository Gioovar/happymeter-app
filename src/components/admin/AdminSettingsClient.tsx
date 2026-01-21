'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { updateSystemSettings } from '@/actions/admin-dashboard'
import { Switch } from '@/components/ui/switch' // Assuming you have shadcn Switch, if not I'll make a simple one
import { Loader2, AlertTriangle, Power } from 'lucide-react'

// Simple Toggle Component if shadcn is not available or to reduce dependencies
function Toggle({ checked, onChange, disabled }: { checked: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
    return (
        <button
            onClick={() => onChange(!checked)}
            disabled={disabled}
            className={`
                relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2 focus:ring-offset-black
                ${checked ? 'bg-violet-600' : 'bg-gray-700'}
                ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
            `}
        >
            <span
                className={`
                    inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                    ${checked ? 'translate-x-6' : 'translate-x-1'}
                `}
            />
        </button>
    )
}

interface SettingsPageProps {
    initialSettings: {
        maintenanceMode: boolean
        allowNewSignups: boolean
    }
}

export default function AdminSettingsClient({ initialSettings }: SettingsPageProps) {
    const [settings, setSettings] = useState(initialSettings)
    const [isPending, startTransition] = useTransition()
    const router = useRouter()

    const handleToggle = (key: 'maintenanceMode' | 'allowNewSignups', value: boolean) => {
        const newSettings = { ...settings, [key]: value }
        setSettings(newSettings) // Optimistic

        startTransition(async () => {
            try {
                await updateSystemSettings(newSettings)
                router.refresh()
            } catch (error) {
                setSettings(settings) // Revert
                alert("Error al guardar configuración")
            }
        })
    }

    return (
        <div className="space-y-6 max-w-2xl">
            <div>
                <h1 className="text-3xl font-bold text-white">Configuración del Sistema</h1>
                <p className="text-gray-400 mt-1">Control global de la plataforma.</p>
            </div>

            <div className="bg-[#111] border border-white/10 rounded-xl overflow-hidden divide-y divide-white/5">
                {/* Maintenance Mode */}
                <div className="p-6 flex items-center justify-between">
                    <div className="flex gap-4">
                        <div className="p-3 bg-red-500/10 rounded-xl h-fit">
                            <AlertTriangle className="w-6 h-6 text-red-500" />
                        </div>
                        <div>
                            <h3 className="font-bold text-white">Modo Mantenimiento</h3>
                            <p className="text-sm text-gray-400 max-w-sm mt-1">
                                Si se activa, solo los administradores podrán acceder a la plataforma.
                                Los usuarios verán una pantalla de "En Mantenimiento".
                            </p>
                        </div>
                    </div>
                    <Toggle
                        checked={settings.maintenanceMode}
                        onChange={(v) => handleToggle('maintenanceMode', v)}
                        disabled={isPending}
                    />
                </div>

                {/* Allow Signups */}
                <div className="p-6 flex items-center justify-between">
                    <div className="flex gap-4">
                        <div className="p-3 bg-green-500/10 rounded-xl h-fit">
                            <Power className="w-6 h-6 text-green-500" />
                        </div>
                        <div>
                            <h3 className="font-bold text-white">Permitir Nuevos Registros</h3>
                            <p className="text-sm text-gray-400 max-w-sm mt-1">
                                Controla si nuevos usuarios pueden crear cuentas. Útil para cerrar betas o durante incidentes.
                            </p>
                        </div>
                    </div>
                    <Toggle
                        checked={settings.allowNewSignups}
                        onChange={(v) => handleToggle('allowNewSignups', v)}
                        disabled={isPending}
                    />
                </div>
            </div>

            <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm">
                Nota: Los cambios se aplican inmediatamente en todo el sistema.
            </div>
        </div>
    )
}
