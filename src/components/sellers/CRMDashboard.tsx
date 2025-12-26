'use client'

import { useState } from 'react'
import { Plus, Calendar as CalendarIcon, Phone, MapPin, User, MoreVertical, Edit, Trash } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { createLead, scheduleVisit, updateLeadStatus } from '@/actions/crm'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

// Status Badges
const STATUS_COLORS: Record<string, string> = {
    'NEW': 'bg-blue-500/10 text-blue-500',
    'CONTACTED': 'bg-yellow-500/10 text-yellow-500',
    'VISITED': 'bg-purple-500/10 text-purple-500',
    'NEGOTIATING': 'bg-orange-500/10 text-orange-500',
    'WON': 'bg-emerald-500/10 text-emerald-500',
    'LOST': 'bg-red-500/10 text-red-500'
}

const STATUS_LABELS: Record<string, string> = {
    'NEW': 'Nuevo',
    'CONTACTED': 'Contactado',
    'VISITED': 'Visitado',
    'NEGOTIATING': 'Negociando',
    'WON': 'Ganado',
    'LOST': 'Perdido'
}

export default function CRMDashboard({ leads, userState }: { leads: any[], userState: string }) {
    const [view, setView] = useState<'list' | 'calendar' | 'map'>('list')
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [loading, setLoading] = useState(false)

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        setLoading(true)
        const formData = new FormData(e.currentTarget)
        try {
            await createLead(formData)
            toast.success('Prospecto creado correctamente')
            setIsDialogOpen(false)
        } catch (error) {
            toast.error('Error al crear prospecto')
        } finally {
            setLoading(false)
        }
    }

    // Google Calendar Link Generator
    const getGoogleCalendarLink = (lead: any) => {
        if (!lead.scheduledVisit) return '#'
        const date = new Date(lead.scheduledVisit)
        const start = date.toISOString().replace(/-|:|\.\d\d\d/g, "")
        const end = new Date(date.getTime() + 60 * 60 * 1000).toISOString().replace(/-|:|\.\d\d\d/g, "") // +1 hour
        const details = `Visita a ${lead.businessName}. Contacto: ${lead.contactName || 'N/A'}. Tel: ${lead.phone || 'N/A'}`
        return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=Visita+Comercial:+${encodeURIComponent(lead.businessName)}&dates=${start}/${end}&details=${encodeURIComponent(details)}&location=${encodeURIComponent(lead.address || '')}`
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white">Gestor de Prospectos</h1>
                    <p className="text-gray-400">Organiza tus visitas y cierra más ventas.</p>
                </div>
                <div className="flex items-center gap-2">
                    <div className="bg-[#111] p-1 rounded-lg border border-white/10 flex">
                        <button
                            onClick={() => setView('list')}
                            className={cn("px-3 py-1.5 text-sm rounded-md transition-all", view === 'list' ? "bg-white/10 text-white" : "text-gray-400 hover:text-white")}
                        >
                            Lista
                        </button>
                        <button
                            onClick={() => setView('calendar')}
                            className={cn("px-3 py-1.5 text-sm rounded-md transition-all", view === 'calendar' ? "bg-white/10 text-white" : "text-gray-400 hover:text-white")}
                        >
                            Calendario
                        </button>
                        <button
                            onClick={() => setView('map')}
                            className={cn("px-3 py-1.5 text-sm rounded-md transition-all", view === 'map' ? "bg-white/10 text-white" : "text-gray-400 hover:text-white")}
                        >
                            Mapa
                        </button>
                    </div>

                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                        <DialogTrigger asChild>
                            <Button className="bg-emerald-500 hover:bg-emerald-600 text-white">
                                <Plus className="w-4 h-4 mr-2" />
                                Nuevo Prospecto
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="bg-[#111] border-white/10 text-white sm:max-w-md">
                            <DialogHeader>
                                <DialogTitle>Registrar Nuevo Prospecto</DialogTitle>
                            </DialogHeader>
                            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                                <div className="space-y-2">
                                    <Label>Nombre del Negocio</Label>
                                    <Input name="businessName" placeholder="Ej. Restaurante El Sol" required className="bg-black/50 border-white/10" />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Contacto</Label>
                                        <Input name="contactName" placeholder="Juan Pérez" className="bg-black/50 border-white/10" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Teléfono</Label>
                                        <Input name="phone" placeholder="55 1234 5678" className="bg-black/50 border-white/10" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label>Dirección</Label>
                                    <Input name="address" placeholder="Av. Siempre Viva 123" className="bg-black/50 border-white/10" />
                                </div>
                                <div className="space-y-2">
                                    <Label>Notas</Label>
                                    <Textarea name="notes" placeholder="Detalles importantes..." className="bg-black/50 border-white/10" />
                                </div>
                                <Button type="submit" disabled={loading} className="w-full bg-emerald-500 hover:bg-emerald-600">
                                    {loading ? 'Guardando...' : 'Guardar Prospecto'}
                                </Button>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            {/* List View */}
            {view === 'list' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {leads.map((lead) => (
                        <div key={lead.id} className="group bg-[#111] border border-white/10 rounded-xl p-5 hover:border-emerald-500/30 transition-all">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h3 className="font-bold text-lg text-white group-hover:text-emerald-400 transition-colors">{lead.businessName}</h3>
                                    <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                                        <MapPin className="w-3 h-3" /> {lead.address || 'Sin dirección'}
                                    </p>
                                </div>
                                <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider", STATUS_COLORS[lead.status] || 'bg-gray-800 text-gray-400')}>
                                    {STATUS_LABELS[lead.status] || lead.status}
                                </span>
                            </div>

                            <div className="space-y-3 mb-4">
                                <div className="flex items-center gap-2 text-sm text-gray-400">
                                    <User className="w-4 h-4 text-gray-600" />
                                    {lead.contactName || 'Sin contacto'}
                                </div>
                                <div className="flex items-center gap-2 text-sm text-gray-400">
                                    <Phone className="w-4 h-4 text-gray-600" />
                                    {lead.phone || 'Sin teléfono'}
                                </div>
                            </div>

                            {lead.scheduledVisit && (
                                <div className="mb-4 p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
                                    <p className="text-xs text-blue-400 font-medium mb-1">Visita Programada</p>
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-white">
                                            {format(new Date(lead.scheduledVisit), "d 'de' MMMM, HH:mm", { locale: es })}
                                        </span>
                                        <a
                                            href={getGoogleCalendarLink(lead)}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-blue-400 hover:text-blue-300 pointer-events-auto"
                                            title="Añadir a Google Calendar"
                                        >
                                            <CalendarIcon className="w-4 h-4" />
                                        </a>
                                    </div>
                                </div>
                            )}

                            <div className="pt-4 border-t border-white/5 flex items-center justify-between gap-2">
                                <form action={async () => {
                                    // Quick Action: Status Update 
                                    // For simplicity using a cycle or dropdown would be better
                                }}>
                                    <select
                                        defaultValue={lead.status}
                                        onChange={(e) => updateLeadStatus(lead.id, e.target.value)}
                                        className="bg-black/30 border border-white/10 rounded text-xs px-2 py-1 text-gray-300 focus:outline-none focus:border-emerald-500"
                                    >
                                        {Object.entries(STATUS_LABELS).map(([key, label]) => (
                                            <option key={key} value={key}>{label}</option>
                                        ))}
                                    </select>
                                </form>
                                <Dialog>
                                    <DialogTrigger asChild>
                                        <Button variant="ghost" size="sm" className="h-7 text-xs text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10">
                                            Agendar Visita
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent className="bg-[#111] border-white/10 text-white">
                                        <DialogHeader><DialogTitle>Programar Visita</DialogTitle></DialogHeader>
                                        {/* Simplified Date Picker */}
                                        <form action={async (formData) => {
                                            const dateStr = formData.get('date') as string
                                            const timeStr = formData.get('time') as string
                                            const date = new Date(`${dateStr}T${timeStr}`)
                                            await scheduleVisit(lead.id, date)
                                            toast.success('Visita agendada')
                                        }}>
                                            <div className="grid gap-4 py-4">
                                                <div className="grid gap-2">
                                                    <Label>Fecha</Label>
                                                    <Input type="date" name="date" required className="bg-black/50 border-white/10 [color-scheme:dark]" />
                                                </div>
                                                <div className="grid gap-2">
                                                    <Label>Hora</Label>
                                                    <Input type="time" name="time" required className="bg-black/50 border-white/10 [color-scheme:dark]" />
                                                </div>
                                                <Button type="submit" className="bg-blue-600 hover:bg-blue-700">Guardar en Calendario</Button>
                                            </div>
                                        </form>
                                    </DialogContent>
                                </Dialog>
                            </div>
                        </div>
                    ))}

                    {leads.length === 0 && (
                        <div className="col-span-full py-12 text-center border-2 border-dashed border-white/10 rounded-2xl">
                            <p className="text-gray-500">No tienes prospectos registrados.</p>
                            <Button variant="link" className="text-emerald-400" onClick={() => setIsDialogOpen(true)}>
                                Crear mi primer prospecto
                            </Button>
                        </div>
                    )}
                </div>
            )}

            {/* Calendar View Placeholder (Can be expanded later with FullCalendar or similar) */}
            {view === 'calendar' && (
                <div className="bg-[#111] border border-white/10 rounded-2xl p-8 text-center">
                    <CalendarIcon className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                    <h3 className="text-lg font-bold text-white mb-2">Vista de Calendario</h3>
                    <p className="text-gray-400 mb-6">Visualiza todas tus visitas programadas en un solo lugar.</p>
                    <div className="space-y-2">
                        {leads.filter(l => l.scheduledVisit).map(lead => (
                            <div key={lead.id} className="bg-black/40 p-3 rounded-lg border border-white/5 flex items-center justify-between text-left max-w-md mx-auto">
                                <div>
                                    <p className="text-sm font-bold text-white">{lead.businessName}</p>
                                    <p className="text-xs text-gray-500">{format(new Date(lead.scheduledVisit), "PPP p", { locale: es })}</p>
                                </div>
                                <a
                                    href={getGoogleCalendarLink(lead)}
                                    target="_blank"
                                    className="p-2 bg-blue-500/10 text-blue-400 rounded hover:bg-blue-500/20"
                                >
                                    <CalendarIcon className="w-4 h-4" />
                                </a>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Map Prospecting View */}
            {view === 'map' && (
                <div className="bg-[#111] border border-white/10 rounded-2xl p-6">
                    <div className="text-center mb-8">
                        <MapPin className="w-12 h-12 text-blue-500 mx-auto mb-4 animate-bounce" />
                        <h2 className="text-2xl font-bold text-white">Mapa de Prospección</h2>
                        <p className="text-gray-400 max-w-lg mx-auto">
                            Encuentra negocios potenciales en <span className="text-blue-400 font-bold">{userState || 'tu zona'}</span>.
                            Abre el mapa, selecciona un negocio y llámales directamente para agendar una visita.
                        </p>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto">
                        {[
                            { name: 'Restaurantes', query: 'restaurantes', bg: 'bg-orange-500/10 text-orange-500' },
                            { name: 'Bares', query: 'bares', bg: 'bg-purple-500/10 text-purple-500' },
                            { name: 'Gimnasios', query: 'gimnasios', bg: 'bg-blue-500/10 text-blue-500' },
                            { name: 'Cafeterías', query: 'cafeterias', bg: 'bg-yellow-500/10 text-yellow-500' },
                            { name: 'Barberías', query: 'barberias', bg: 'bg-emerald-500/10 text-emerald-500' },
                            { name: 'Hoteles', query: 'hoteles', bg: 'bg-pink-500/10 text-pink-500' },
                            { name: 'Spas', query: 'spas', bg: 'bg-teal-500/10 text-teal-500' },
                            { name: 'Tiendas', query: 'tiendas', bg: 'bg-indigo-500/10 text-indigo-500' },
                        ].map((cat) => (
                            <a
                                key={cat.name}
                                href={`https://www.google.com/maps/search/${cat.query}+en+${userState || ''}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={cn(
                                    "flex flex-col items-center justify-center p-6 rounded-xl border border-white/5 hover:border-white/20 transition-all hover:scale-105",
                                    cat.bg
                                )}
                            >
                                <MapPin className="w-6 h-6 mb-2" />
                                <span className="font-bold">{cat.name}</span>
                                <span className="text-[10px] opacity-70 mt-1">Ver en Mapa</span>
                            </a>
                        ))}
                    </div>

                    <div className="mt-8 p-4 bg-blue-900/20 border border-blue-500/20 rounded-xl text-center">
                        <p className="text-sm text-blue-200">
                            💡 <strong>Tip:</strong> Al abrir el mapa en tu celular, puedes usar el botón de <strong>"Llamar"</strong> de Google Maps para contactar al negocio y ofrecerles HappyMeter.
                        </p>
                    </div>
                </div>
            )}
        </div>
    )
}
