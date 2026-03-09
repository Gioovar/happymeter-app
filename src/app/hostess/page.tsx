import { Suspense } from "react";
import { getTodayReservations } from "@/actions/hostess";
import { getOpsSession } from "@/lib/ops-auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import OccupancyDashboard from "@/components/hostess/OccupancyDashboard";
import ReservationsList from "@/components/hostess/ReservationsList";
import DownloadCSVButton from "@/components/hostess/DownloadCSVButton";

export const revalidate = 0; // Ensure data is fresh

export default async function HostessDashboardPage() {
    const { isAuthenticated, member, userId } = await getOpsSession();

    if (!isAuthenticated) {
        redirect("/ops/login");
    }

    let branchId = "";

    if (member) {
        branchId = member.ownerId; // Offline operator or assigned member
    } else if (userId) {
        // Owner accessing directly without a specific member record
        const teamMember = await prisma.teamMember.findFirst({
            where: { userId: userId },
            select: { ownerId: true },
        });
        if (teamMember) {
            branchId = teamMember.ownerId;
        } else {
            branchId = userId; // Fallback to their own ID if they are the direct owner
        }
    }

    if (!branchId) {
        redirect("/ops/login");
    }

    const response = await getTodayReservations(branchId);

    if (!response.success || !response.data) {
        return (
            <div className="p-6 text-center text-red-500">
                Error loading reservations: {response.error}
            </div>
        );
    }

    const reservations = response.data;

    // Calculate metrics
    const totalReservations = reservations.length;
    const expectedGuests = reservations.reduce((acc, res) => acc + res.partySize, 0);

    // Actual guests: sum of actualGuests if defined, otherwise 0 for pending, 
    // or maybe only count if status is CHECKED_IN. Let's rely on actualGuests being set.
    // We'll count them if actualGuests > 0.
    const arrivedGuests = reservations.reduce((acc, res) => acc + (res.actualGuests || 0), 0);

    return (
        <div className="flex flex-col min-h-screen pb-24">
            {/* Header Area */}
            <div className="pt-12 pb-6 px-6 bg-gradient-to-b from-sky-900/20 to-black sticky top-0 z-10 backdrop-blur-md flex items-start justify-between">
                <div>
                    <h1 className="text-3xl font-light tracking-tight text-white mb-2">
                        Recepción <span className="font-bold text-sky-500">Ops</span>
                    </h1>
                    <p className="text-white/60 text-sm">Administra las llegadas del día</p>
                </div>
                <DownloadCSVButton branchId={branchId} />
            </div>

            <div className="px-6 space-y-8">
                {/* Quick Stats */}
                <OccupancyDashboard
                    totalReservations={totalReservations}
                    expectedGuests={expectedGuests}
                    arrivedGuests={arrivedGuests}
                />

                {/* List of Reservations */}
                <ReservationsList reservations={reservations} adminId={userId || ""} />
            </div>
        </div>
    );
}
