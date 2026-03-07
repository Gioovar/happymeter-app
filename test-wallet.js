const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function getWallet() {
    const phone = '5574131657';
    try {
        const globalProfile = await prisma.globalPromoter.findUnique({
            where: { phone },
            include: { responses: true }
        });
        if (!globalProfile) return { success: false, error: "Perfil no encontrado" };

        const localProfiles = await prisma.promoterProfile.findMany({
            where: { phone },
            include: {
                business: { select: { businessName: true, logoUrl: true } },
                reservations: { select: { status: true, partySize: true, settlementId: true } }
            }
        });

        console.log('Local profiles:', localProfiles.length);

        // Calculate
        const placesCount = localProfiles.length;
        let totalEarnings = 0;
        let totalPending = 0;
        let totalPaid = 0;
        let totalReservations = 0;
        let totalConfirmedAttendees = 0;

        const places = localProfiles.map((p) => {
            const confirmedRes = p.reservations.filter((r) => r.status === 'CONFIRMED' || r.status === 'CHECKED_IN');

            const placePending = confirmedRes
                .filter((r) => !r.settlementId)
                .reduce((sum, r) => sum + (p.commissionType === 'PER_PERSON' ? r.partySize * p.commissionValue : p.commissionValue), 0);

            const placePaid = confirmedRes
                .filter((r) => r.settlementId)
                .reduce((sum, r) => sum + (p.commissionType === 'PER_PERSON' ? r.partySize * p.commissionValue : p.commissionValue), 0);

            const placeAttendees = confirmedRes.reduce((sum, r) => sum + r.partySize, 0);

            totalPending += placePending;
            totalPaid += placePaid;
            totalEarnings += (placePending + placePaid);
            totalReservations += p.reservations.length;
            totalConfirmedAttendees += placeAttendees;

            return {
                businessId: p.businessId,
                name: p.business?.businessName || 'Business',
                logoUrl: p.business?.logoUrl,
                slug: p.slug,
                totalReservations: p.reservations.length,
                pending: placePending,
                paid: placePaid,
                attendees: placeAttendees
            }
        });

        console.log('Success!', { placesCount, totalEarnings });
    } catch (e) {
        console.error('ERROR IN WALLET', e);
    }
}

getWallet().finally(() => prisma.$disconnect());
