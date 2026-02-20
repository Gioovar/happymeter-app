'use client'

import { useState, useTransition } from 'react'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { updateReservationSettings } from '@/actions/reservations'
import { Loader2 } from 'lucide-react'

interface ReservationSettingsProps {
    initialSettings: {
        standardTimeEnabled: boolean
        standardDurationMinutes: number
        simpleMode?: boolean
        dailyPaxLimit?: number
    }
}

export default function ReservationSettings({ initialSettings }: ReservationSettingsProps) {
    const [settings, setSettings] = useState(initialSettings)
    const [isPending, startTransition] = useTransition()

    const handleSave = () => {
        startTransition(async () => {
            const res = await updateReservationSettings(settings)
            if (res.success) {
                toast.success('Configuración guardada')
            } else {
                toast.error('Error al guardar configuración')
            }
        })
    }

    return (
        <div className="bg-[#111] border border-white/5 rounded-2xl p-6 space-y-8 mb-6">
            <div>
                <h2 className="text-lg font-bold text-white">Configuración General</h2>
                <p className="text-sm text-gray-500">Define cómo funcionan tus reservaciones</p>
            </div>

            {/* Simple Mode Toggle */}
            <div className="flex items-center justify-between">
                <div className="space-y-1">
                    <Label className="text-white text-base">Modo Simple (Sin Mapa)</Label>
                    <p className="text-sm text-gray-500 max-w-sm">
                        Permite reservaciones sin asignar mesa específica. Ideal para eventos o listas de espera.
                    </p>
                </div>
                <Switch
                    checked={settings.simpleMode || false}
                    onCheckedChange={(checked) => setSettings(prev => ({ ...prev, simpleMode: checked }))}
                />
            </div>

            {/* Daily Pax Limit (Only if Simple Mode is ON) */}
            {settings.simpleMode && (
                <div className="ml-4 pl-4 border-l-2 border-indigo-500/50 space-y-4 animate-in slide-in-from-left-2">
                    <div className="space-y-2">
                        <Label className="text-white">Límite de Personas por Día</Label>
                        <div className="flex items-center gap-3">
                            <Input
                                type="number"
                                value={settings.dailyPaxLimit || 50}
                                onChange={(e) => setSettings(prev => ({ ...prev, dailyPaxLimit: parseInt(e.target.value) || 0 }))}
                                className="w-32 bg-zinc-900 border-zinc-800"
                            />
                            <span className="text-sm text-gray-500">personas máximo</span>
                        </div>
                        <p className="text-xs text-indigo-400">
                            El sistema dejará de aceptar reservaciones cuando se alcance este total de personas confirmadas en el día.
                        </p>
                    </div>
                </div>
            )}

            <div className="h-px bg-white/5" />

            {/* Existing Settings: Block All Day vs Time Slots */}
            <div className={`space-y-6 ${settings.simpleMode ? 'opacity-50 pointer-events-none grayscale' : ''}`}>
                <div className="flex items-center justify-between">
                    <div className="space-y-1">
                        <Label className="text-white text-base">Reservar por Horarios (Slots)</Label>
                        <p className="text-sm text-gray-500 max-w-sm">
                            Si está activo, valida la duración de la mesa. Si está inactivo, bloquea la mesa todo el día.
                        </p>
                    </div>
                    <Switch
                        checked={settings.standardTimeEnabled}
                        onCheckedChange={(checked) => setSettings(prev => ({ ...prev, standardTimeEnabled: checked }))}
                    />
                </div>

                {settings.standardTimeEnabled && (
                    <div className="ml-4 pl-4 border-l-2 border-white/10 space-y-4">
                        <div className="space-y-2">
                            <Label className="text-white">Duración Estándar (Minutos)</Label>
                            <Input
                                type="number"
                                value={settings.standardDurationMinutes}
                                onChange={(e) => setSettings(prev => ({ ...prev, standardDurationMinutes: parseInt(e.target.value) || 0 }))}
                                className="w-32 bg-zinc-900 border-zinc-800"
                            />
                        </div>
                    </div>
                )}
            </div>

            <div className="pt-4 border-t border-white/5 flex justify-end">
                <Button
                    onClick={handleSave}
                    disabled={isPending}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white min-w-[150px]"
                >
                    {isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                    Guardar Cambios
                </Button>
            </div>
        </div>
    )
}
