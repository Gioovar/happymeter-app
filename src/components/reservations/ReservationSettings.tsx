'use client'

import { useState, useTransition } from 'react'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { updateReservationSettings } from '@/actions/reservations'
import { Loader2, Clock } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface ReservationSettingsProps {
    initialSettings: {
        standardTimeEnabled: boolean
        standardDurationMinutes: number
        simpleMode?: boolean
        dailyPaxLimit?: number
        availability?: any[]
    }
}

export default function ReservationSettings({ initialSettings }: ReservationSettingsProps) {
    const [settings, setSettings] = useState(initialSettings)
    const [isPending, startTransition] = useTransition()

    const handleAvailabilityChange = (id: string, field: string, value: any) => {
        setSettings(prev => ({
            ...prev,
            availability: prev.availability?.map((d: any) => d.id === id ? { ...d, [field]: value } : d)
        }))
    }

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

            {/* Availability Matrix */}
            <div className="pt-6 border-t border-white/5 space-y-6">
                <div>
                    <h3 className="text-white font-bold text-base">Horarios de Operación</h3>
                    <p className="text-sm text-gray-500">Define qué días y en qué horarios aceptas reservaciones.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {settings.availability?.map((day: any) => (
                        <div key={day.id} className="flex flex-col gap-3 p-4 rounded-xl bg-zinc-900/50 border border-white/5">
                            <div className="flex items-center justify-between">
                                <Label htmlFor={`switch-${day.id}`} className="font-bold flex items-center gap-2 cursor-pointer text-white">
                                    <div className={`w-2 h-2 rounded-full ${day.isOpen ? 'bg-indigo-500' : 'bg-zinc-700'}`} />
                                    {day.label}
                                </Label>
                                <Switch
                                    id={`switch-${day.id}`}
                                    checked={day.isOpen}
                                    onCheckedChange={(c) => handleAvailabilityChange(day.id, 'isOpen', c)}
                                />
                            </div>

                            <AnimatePresence>
                                {day.isOpen && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="flex flex-col gap-3 pt-3 mt-2 border-t border-white/5"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="flex-1 space-y-1.5">
                                                <Label className="text-xs text-zinc-500 ml-1">Apertura</Label>
                                                <div className="relative">
                                                    <Clock className="absolute left-2.5 top-2.5 w-4 h-4 text-indigo-400" />
                                                    <Input
                                                        type="time"
                                                        className="pl-9 bg-[#111] border-zinc-800 text-sm text-white focus:border-indigo-500"
                                                        value={day.openTime}
                                                        onChange={(e) => handleAvailabilityChange(day.id, 'openTime', e.target.value)}
                                                    />
                                                </div>
                                            </div>

                                            <div className="flex-1 space-y-1.5">
                                                <Label className="text-xs text-zinc-500 ml-1">Cierre</Label>
                                                <div className="relative">
                                                    <Clock className="absolute left-2.5 top-2.5 w-4 h-4 text-orange-400" />
                                                    <Input
                                                        type="time"
                                                        className="pl-9 bg-[#111] border-zinc-800 text-sm text-white focus:border-orange-500"
                                                        value={day.closeTime}
                                                        onChange={(e) => handleAvailabilityChange(day.id, 'closeTime', e.target.value)}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    ))}
                </div>
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
