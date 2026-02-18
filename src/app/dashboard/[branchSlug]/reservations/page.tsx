
// @ts-nocheck
import {
    CalendarDays,
    Users,
    CalendarX,
    CalendarCheck,
    Settings
} from 'lucide-react';
import Link from 'next/link';
import { getFloorPlans, getDashboardReservations } from "@/actions/reservations"
import { ReservationCalendar } from "@/components/dashboard/reservations/ReservationCalendar"
import { NewReservationButton } from "@/components/dashboard/reservations/NewReservationButton"
import { ReservationsList } from "@/components/dashboard/reservations/ReservationsList"
import { prisma } from "@/lib/prisma"
import { ReservationLinkButton } from "@/components/dashboard/reservations/ReservationLinkButton"
import { getDashboardContext } from "@/lib/auth-context"
import { redirect } from "next/navigation"
import ReservationSetupModal from "@/components/dashboard/reservations/ReservationSetupModal"

export const dynamic = 'force-dynamic'

export default async function BranchReservationsPage({ params }: { params: { branchSlug: string } }) {
    const context = await getDashboardContext(params.branchSlug)
    if (!context || !context.userId) return redirect('/dashboard')

    const userId = context.userId
    const branchSlug = params.branchSlug

    // For User Profile, we might not have a Clerk User for a Branch "User".
    // We can use the context.name or fetch UserSettings.
    // Ideally we fetch the "Program" or "Business Info" attached to this userId.
    const userProfile = {
        name: context.name || "Sucursal",
        email: undefined, // Branch might not have email
        phone: undefined
    }

    // Fetch existing floor plan with overrides
    const floorPlans = await getFloorPlans(userId)

    // Fetch reservations with overrides
    const reservationsResult = await getDashboardReservations(new Date(), userId)
    const reservations = reservationsResult.success ? reservationsResult.reservations : []

    // Fetch program & UserSettings for Limit Check
    let program = null
    let userSettings = null
    try {
        const [prog, settings] = await Promise.all([
            prisma.loyaltyProgram.findUnique({ where: { userId } }),
            prisma.userSettings.findUnique({ where: { userId }, select: { createdAt: true, plan: true } })
        ])
        program = prog
        userSettings = settings

        // No auto-create for branch? Maybe yes.
        if (!program) {
            program = await prisma.loyaltyProgram.create({
                data: {
                    userId: userId,
                    businessName: context.name || "Sucursal",
                    description: "Programa de lealtad de sucursal."
                }
            })
        }
    } catch (e) {
        console.error(e)
    }

    /* Check Removed: Handled in layout.tsx */

    /* Check Removed: Handled in layout.tsx */

    const setupLink = `/dashboard/${branchSlug}/reservations/setup`

    // Blocking check removed. Now using Popup.
    // Enhanced check: Verify if floor plan is actually configured, not just present (since we auto-create defaults)
    const isConfigured = floorPlans && floorPlans.some((fp: any) => fp.isConfigured);


    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 md:gap-0">
                <div>
                    <h1 className="text-3xl font-bold text-white tracking-tight">Reservaciones <span className="text-xs bg-white/10 px-2 py-1 rounded-full text-gray-300 align-middle">{context.name}</span></h1>
                    <p className="text-gray-400 mt-2">Gestiona agenda y capacidad local.</p>
                </div>
                <div className="flex flex-wrap gap-3 w-full md:w-auto">
                    {program && <ReservationLinkButton programId={program.id} />}

                    <Link
                        href={setupLink}
                        className="bg-zinc-800 hover:bg-zinc-700 px-4 py-2.5 rounded-xl font-medium text-sm text-white transition-all flex items-center gap-2"
                    >
                        <Settings className="w-4 h-4" />
                        Editar Plano
                    </Link>

                    <NewReservationButton
                        userProfile={userProfile}
                        programId={program?.id}
                        floorPlans={floorPlans}
                        businessName={context.name}
                    />
                </div>
            </div>

            {/* Stats - MOCK Calculations or Real? Using same static numbers as original for now until actions provide stats */}
            {/* ... Keeping existing layout ... */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* Reusing existing static placeholders or we can calculate from `reservations` array */}
                <div className="bg-[#111] border border-white/10 p-4 rounded-xl flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-orange-500/20 flex items-center justify-center">
                        <CalendarCheck className="w-6 h-6 text-orange-500" />
                    </div>
                    <div>
                        <p className="text-xs text-gray-400 uppercase font-bold">Total (Mes)</p>
                        <p className="text-2xl font-bold text-white">{reservations.length}</p>
                    </div>
                </div>
                {/* ... other stats omitted for brevity / handled by generic components if possible ... */}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <ReservationsList reservations={reservations} />
                <div className="space-y-6">
                    <ReservationCalendar reservations={reservations} />
                    <div className="bg-[#111] border border-white/10 rounded-2xl p-6">
                        <h3 className="text-sm font-bold text-white mb-4">Capacidad</h3>
                        {/* Static placeholder */}
                        <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                            <div className="h-full w-[20%] bg-gradient-to-r from-orange-500 to-amber-500 rounded-full" />
                        </div>
                    </div>
                </div>
            </div>
            {/* Modal de Configuración (Popup) */}
            <ReservationSetupModal isOpen={!isConfigured} setupLink={setupLink} />
        </div>
    )
}
