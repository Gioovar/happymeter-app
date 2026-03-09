export default function OccupancyDashboard({
    totalReservations,
    expectedGuests,
    arrivedGuests,
}: {
    totalReservations: number;
    expectedGuests: number;
    arrivedGuests: number;
}) {
    const occupancyPercentage = expectedGuests > 0 ? Math.min(100, (arrivedGuests / expectedGuests) * 100) : 0;

    return (
        <div className="grid grid-cols-3 gap-3">
            <div className="bg-[#111111] border border-white/5 rounded-2xl p-4 flex flex-col items-center justify-center relative overflow-hidden group hover:border-sky-500/30 transition-colors">
                <div className="absolute inset-0 bg-gradient-to-br from-sky-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <span className="text-3xl font-bold text-white mb-1">
                    {totalReservations}
                </span>
                <span className="text-[10px] uppercase tracking-wider text-white/50 text-center">
                    Reservas
                </span>
            </div>

            <div className="bg-[#111111] border border-white/5 rounded-2xl p-4 flex flex-col items-center justify-center relative overflow-hidden group hover:border-purple-500/30 transition-colors">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <span className="text-3xl font-bold text-white mb-1">
                    {expectedGuests}
                </span>
                <span className="text-[10px] uppercase tracking-wider text-white/50 text-center">
                    Esperados
                </span>
            </div>

            <div className="bg-sky-500/10 border border-sky-500/20 rounded-2xl p-4 flex flex-col items-center justify-center relative overflow-hidden">
                <span className="text-3xl font-bold text-sky-400 mb-1">
                    {arrivedGuests}
                </span>
                <span className="text-[10px] uppercase tracking-wider text-sky-400/80 text-center">
                    Llegaron
                </span>

                {/* Progress Bar background effect */}
                <div className="absolute bottom-0 left-0 h-1 bg-sky-500" style={{ width: `${occupancyPercentage}%` }} />
            </div>
        </div>
    );
}
