// @ts-nocheck
import {
    CalendarDays,
    Users,
    CalendarX,
    CalendarCheck,
    Settings
} from 'lucide-react';
import Link from 'next/link';
import { currentUser } from "@clerk/nextjs/server"
import { getFloorPlans, getDashboardReservations } from "@/actions/reservations"
import { ReservationCalendar } from "@/components/dashboard/reservations/ReservationCalendar"
import { NewReservationButton } from "@/components/dashboard/reservations/NewReservationButton"
import { ReservationsList } from "@/components/dashboard/reservations/ReservationsList"
import { prisma } from "@/lib/prisma"
import { ReservationLinkButton } from "@/components/dashboard/reservations/ReservationLinkButton"
import { ReservationSettingsDialog } from "@/components/dashboard/reservations/ReservationSettingsDialog"

export const dynamic = 'force-dynamic'

export default async function ReservationsPage() {
    const user = await currentUser()
    const userProfile = {
        name: user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : undefined,
        email: user?.emailAddresses[0]?.emailAddress,
        phone: user?.phoneNumbers[0]?.phoneNumber
    }

    // Fetch existing floor plan
    const floorPlans = await getFloorPlans()

    // Fetch User Settings for Reservation Config
    const userSettings = await prisma.userSettings.findUnique({
        where: { userId: user?.id }
    })

    // Fetch reservations for calendar

    // Fetch reservations for calendar
    const reservationsResult = await getDashboardReservations()
    const reservations = reservationsResult.success ? reservationsResult.reservations : []

    // Fetch program for Link Button
    // Fetch program for Link Button
    let program = null
    try {
        if (user) {
            // Correct field is 'userId' based on schema, not 'clerkUserId'
            program = await prisma.loyaltyProgram.findUnique({
                where: { userId: user.id }
            })

            // AUTO-CREATE if missing so user sees the button
            if (!program) {
                console.log("Auto-creating Loyalty Program for Reservations...")
                program = await prisma.loyaltyProgram.create({
                    data: {
                        userId: user.id,
                        businessName: userProfile.name || "Mi Negocio",
                        description: "Programa de lealtad creado automáticamente."
                    }
                })
            }
        }
    } catch (error) {
        console.error("Error fetching/creating loyalty program:", error)
    }

    // Compute dynamic stats
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const nextWeek = new Date(today)
    nextWeek.setDate(today.getDate() + 7)

    const stats = { hoy: 0, personasHoy: 0, semana: 0, canceladas: 0 }

    reservations.forEach((res: any) => {
        const resDate = new Date(res.date)
        resDate.setHours(0, 0, 0, 0)

        if (resDate.getTime() === today.getTime() && res.status !== 'CANCELED') {
            stats.hoy++
            stats.personasHoy += (res.pax || res.partySize || 0)
        }

        if (resDate >= today && resDate <= nextWeek && res.status !== 'CANCELED') {
            stats.semana++
        }

        if (res.status === 'CANCELED') {
            stats.canceladas++
        }
    })

    if (!floorPlans || floorPlans.length === 0) {
        return (
            <div className="h-[calc(100vh-4rem)] flex flex-col items-center justify-center text-center space-y-6">
                <div className="bg-zinc-800/50 p-6 rounded-full ring-1 ring-white/10">
                    <Settings className="w-12 h-12 text-amber-500" />
                </div>
                <div className="space-y-2 max-w-md">
                    <h1 className="text-2xl font-bold text-white">Configura tu Espacio</h1>
                    <p className="text-gray-400">
                        Antes de gestionar reservas, necesitas diseñar el plano de tu restaurante.
                        Agrega mesas, barras y define la capacidad.
                    </p>
                </div>
                <Link
                    href="/dashboard/reservations/setup"
                    className="bg-gradient-to-r from-amber-500 to-orange-600 px-8 py-3 rounded-xl font-bold text-white shadow-lg shadow-orange-900/20 hover:scale-105 transition-all flex items-center gap-2"
                >
                    <Settings className="w-5 h-5" />
                    Comenzar Configuración
                </Link>
            </div>
        )
    }

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 md:gap-0">
                <div>
                    <h1 className="text-3xl font-bold text-white tracking-tight">Reservaciones</h1>
                    <p className="text-gray-400 mt-2">Gestiona tu agenda, capacidad y horarios.</p>
                </div>
                <div className="flex flex-wrap gap-3 w-full md:w-auto">
                    {program && <ReservationLinkButton programId={program.id} />}

                    {/* SETTINGS DIALOG */}
                    <ReservationSettingsDialog settings={
                        (userSettings?.reservationSettings as any) || { enabled: false, durationMinutes: 120 }
                    } />

                    <Link
                        href="/dashboard/reservations/setup"
                        className="bg-zinc-800 hover:bg-zinc-700 px-4 py-2.5 rounded-xl font-medium text-sm text-white transition-all flex items-center gap-2"
                    >
                        <Settings className="w-4 h-4" />
                        Editar Plano
                    </Link>

                    {/* NEW RESERVATION BUTTON CLIENT COMPONENT */}
                    <NewReservationButton
                        userProfile={userProfile}
                        programId={program?.id}
                        floorPlans={floorPlans}
                        businessName={userProfile.name} // Or program.businessName if available
                    />
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-[#111] border border-white/10 p-4 rounded-xl flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-orange-500/20 flex items-center justify-center">
                        <CalendarCheck className="w-6 h-6 text-orange-500" />
                    </div>
                    <div>
                        <p className="text-xs text-gray-400 uppercase font-bold">Hoy</p>
                        <p className="text-2xl font-bold text-white">{stats.hoy}</p>
                    </div>
                </div>
                <div className="bg-[#111] border border-white/10 p-4 rounded-xl flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center">
                        <Users className="w-6 h-6 text-emerald-500" />
                    </div>
                    <div>
                        <p className="text-xs text-gray-400 uppercase font-bold">Personas</p>
                        <p className="text-2xl font-bold text-white">{stats.personasHoy}</p>
                    </div>
                </div>
                <div className="bg-[#111] border border-white/10 p-4 rounded-xl flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center">
                        <CalendarDays className="w-6 h-6 text-blue-500" />
                    </div>
                    <div>
                        <p className="text-xs text-gray-400 uppercase font-bold">Semana</p>
                        <p className="text-2xl font-bold text-white">{stats.semana}</p>
                    </div>
                </div>
                <div className="bg-[#111] border border-white/10 p-4 rounded-xl flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center">
                        <CalendarX className="w-6 h-6 text-red-500" />
                    </div>
                    <div>
                        <p className="text-xs text-gray-400 uppercase font-bold">Canceladas</p>
                        <p className="text-2xl font-bold text-white">{stats.canceladas}</p>
                    </div>
                </div>
            </div>

            {/* Agenda View */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Upcoming List (Client Component with Dialog Interaction) */}
                <ReservationsList reservations={reservations} />

                {/* Right Column: Calendar & Stats */}
                <div className="space-y-6">
                    {/* NEW CALENDAR WIDGET */}
                    <ReservationCalendar reservations={reservations} />

                    {/* Capacity (Mini) */}
                    <div className="bg-[#111] border border-white/10 rounded-2xl p-6">
                        <h3 className="text-sm font-bold text-white mb-4">Capacidad Hoy</h3>
                        <div>
                            <div className="flex justify-between text-xs mb-2">
                                <span className="text-gray-400">Ocupación Tool</span>
                                <span className="text-white font-bold">65%</span>
                            </div>
                            <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                                <div className="h-full w-[65%] bg-gradient-to-r from-orange-500 to-amber-500 rounded-full" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
