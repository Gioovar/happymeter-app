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
import { getFloorPlans, getDashboardReservations, getOtherBranchSchedules } from "@/actions/reservations"
import { ReservationCalendar } from "@/components/dashboard/reservations/ReservationCalendar"
import { NewReservationButton } from "@/components/dashboard/reservations/NewReservationButton"
import { ReservationsList } from "@/components/dashboard/reservations/ReservationsList"
import OccupancyRadarWidget from '@/components/dashboard/OccupancyRadarWidget'
import ActiveTablesWidget from '@/components/dashboard/ActiveTablesWidget'
import { prisma } from "@/lib/prisma"
import { ReservationLinkButton } from "@/components/dashboard/reservations/ReservationLinkButton"
import ReservationSetupModal from "@/components/dashboard/reservations/ReservationSetupModal"
import { ReservationScheduleDialog } from "@/components/dashboard/reservations/ReservationScheduleDialog"

import { getActiveBusinessId } from "@/lib/tenant"

export const dynamic = 'force-dynamic'

export default async function ReservationsPage() {
    const user = await currentUser()
    const userProfile = {
        name: user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : undefined,
        email: user?.emailAddresses[0]?.emailAddress,
        phone: user?.phoneNumbers[0]?.phoneNumber
    }

    // Resolve tenant ID
    const activeId = await getActiveBusinessId()
    const effectiveUserId = activeId || user?.id

    if (!effectiveUserId) {
        return <div>Error: Sesión no válida</div>
    }

    // Fetch existing floor plan
    const floorPlans = await getFloorPlans()

    // Fetch User Settings for Reservation Config
    const userSettings = await prisma.userSettings.findUnique({
        where: { userId: effectiveUserId },
        select: { createdAt: true, plan: true, reservationSettings: true }
    })

    // Fetch other branches for schedule dialog
    const otherBranches = await getOtherBranchSchedules(effectiveUserId)

    // Fetch reservations for calendar
    const reservationsResult = await getDashboardReservations()
    const reservations = reservationsResult.success ? reservationsResult.reservations : []

    // Fetch program for Link Button
    let program = null
    try {
        if (effectiveUserId) {
            // Correct field is 'userId' based on schema, not 'clerkUserId'
            program = await prisma.loyaltyProgram.findUnique({
                where: { userId: effectiveUserId }
            })

            // AUTO-CREATE if missing so user sees the button
            if (!program) {
                console.log("Auto-creating Loyalty Program for Reservations...")
                program = await prisma.loyaltyProgram.create({
                    data: {
                        userId: effectiveUserId,
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
    })

    stats.canceladas = reservations.filter((r: any) => r.status === 'CANCELED').length

    // Calculate dynamic occupancy
    let totalCapacity = 0
    if (floorPlans && floorPlans.length > 0) {
        floorPlans.forEach((fp: any) => {
            if (fp.tables) {
                fp.tables.forEach((t: any) => {
                    totalCapacity += (t.capacity || 0)
                })
            }
        })
    }
    
    // User daily limit override if available
    if (userSettings?.reservationSettings && (userSettings.reservationSettings as any).dailyPaxLimit) {
        totalCapacity = (userSettings.reservationSettings as any).dailyPaxLimit
    }

    // Default to a sensible number if no capacity is set to avoid NaN
    if (totalCapacity === 0) totalCapacity = 100

    const occupancyPercentage = Math.min(100, Math.round((stats.personasHoy / totalCapacity) * 100))

    const hasTables = floorPlans && floorPlans.some((fp: any) => fp.tables && fp.tables.length > 0);
    const simpleModeActive = (userSettings?.reservationSettings as any)?.simpleMode === true;
    const isConfigured = hasTables || simpleModeActive;
    
    // We will use a popup for setup if not configured instead of a full block.
    // Allow the dashboard to render, let ReservationSetupModal handle the blocking/unconfigured state.

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 md:gap-0">
                <div>
                    <h1 className="text-3xl font-bold text-white tracking-tight">Reservaciones</h1>
                    <p className="text-gray-400 mt-2">Gestiona tu agenda, capacidad y horarios.</p>
                </div>
                <div className="flex flex-wrap gap-3 w-full md:w-auto items-center">
                    {program && <ReservationLinkButton programId={program.id} />}

                    <ReservationScheduleDialog
                        isSimpleMode={userSettings?.reservationSettings?.simpleMode === true}
                        branchId={effectiveUserId}
                        currentSchedule={(userSettings?.reservationSettings as any)?.availability}
                        otherBranches={otherBranches}
                    />

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

            {/* Real-Time Ops */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 my-8">
                <OccupancyRadarWidget />
                <ActiveTablesWidget />
            </div>

            {/* Agenda View */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Upcoming List (Client Component with Dialog Interaction) */}
                <ReservationsList reservations={reservations} />

                {/* Right Column: Calendar & Stats */}
                <div className="space-y-6">
                    {/* NEW CALENDAR WIDGET */}
                    <ReservationCalendar reservations={reservations} />

                    {/* Capacity (Mini) - Maintained for quick reference or replaced entirely by Ops Widgets */}
                    <div className="bg-[#111] border border-white/10 rounded-2xl p-6">
                        <h3 className="text-sm font-bold text-white mb-4">Capacidad Hoy</h3>
                        <div>
                            <div className="flex justify-between text-xs mb-2">
                                <span className="text-gray-400">Ocupación Tool</span>
                                <span className="text-white font-bold">{occupancyPercentage}%</span>
                            </div>
                            <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                                <div 
                                    className="h-full bg-gradient-to-r from-orange-500 to-amber-500 rounded-full transition-all duration-1000" 
                                    style={{ width: `${occupancyPercentage}%` }}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modal de Configuración (Popup) */}
            <ReservationSetupModal isOpen={!isConfigured} setupLink="/dashboard/reservations/setup" branchId={effectiveUserId} />
        </div>
    )
}
