import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { customerId, programId } = body;

        if (!customerId || !programId) {
            return new NextResponse("Missing data", { status: 400 });
        }

        // 1. Fetch customer and program
        const customer = await prisma.loyaltyCustomer.findUnique({
            where: { id: customerId },
            include: {
                program: { include: { user: true } },
                redemptions: { where: { status: "PENDING" } }
            }
        });

        if (!customer) return new NextResponse("Customer not found", { status: 404 });
        const { program } = customer;

        // 2. B2B Subscription Block
        if (program.user?.subscriptionStatus === 'EXPIRED' || program.user?.subscriptionStatus === 'SUSPENDED') {
            return new NextResponse("Business stopped paying", { status: 403 });
        }

        // 3. Geofence Active Check
        if (!program.isGeofenceActive) {
            return new NextResponse("Geofence not active for this program", { status: 400 });
        }

        // 4. Anti-spam Checks
        const now = new Date();
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const startOfWeek = new Date(startOfDay);
        startOfWeek.setDate(startOfDay.getDate() - startOfDay.getDay());

        const recentPushes = await prisma.loyaltyEvent.findMany({
            where: {
                customerId,
                programId,
                createdAt: { gte: startOfWeek }
            }
        });

        const pushesToday = recentPushes.filter(p => new Date(p.createdAt) >= startOfDay).length;
        if (pushesToday >= 1) {
            return new NextResponse("Anti-spam: Already sent today", { status: 429 });
        }
        if (recentPushes.length >= 3) {
            return new NextResponse("Anti-spam: Already sent 3 this week", { status: 429 });
        }

        // Has visited recently? (Don't bug them if they just left the store within 12 hours)
        if (customer.lastVisitDate) {
            const hoursSinceVisit = (now.getTime() - new Date(customer.lastVisitDate).getTime()) / (1000 * 60 * 60);
            if (hoursSinceVisit < 12) {
                return new NextResponse("Anti-spam: Visited recently", { status: 429 });
            }
        }

        // 5. Select Campaign (Dynamic)
        // Find active campaigns
        const activeCampaigns = await prisma.loyaltyCampaign.findMany({
            where: { programId, isActive: true }
        });

        let title = "¡Estás cerca!";
        let message = `Te extrañamos en ${program.businessName}. ¡Ven a visitarnos!`;
        let campaignId = null;

        if (activeCampaigns.length > 0) {
            // In a real scenario we'd match triggerTypes, for now pick the first active one
            const campaign = activeCampaigns[0];
            title = campaign.name;
            message = campaign.message;
            campaignId = campaign.id;
        } else {
            // Contextual Fallbacks
            if (customer.redemptions.length > 0) {
                title = "Tienes un premio pendiente 🎁";
                message = `¡Estás muy cerca de ${program.businessName}! Aprovecha y pasa a cobrar tu premio hoy.`;
            }
        }

        // 6. Send Push Notification (Firebase / APNs Mock)
        // Here we would use `admin.messaging().sendToDevice(...)` 
        // using the tokens registered in User/Customer pushSubscriptions.
        console.log(`[PUSH ENGINE] Sending Push to ${customerId}: ${title} - ${message}`);

        // 7. Log to DB
        await prisma.loyaltyEvent.create({
            data: {
                programId,
                customerId,
                type: "PUSH_SENT",
                metadata: { title, message, campaignId }
            }
        });

        return NextResponse.json({ success: true, title, message });

    } catch (error) {
        console.error("Geofence Engine Error:", error);
        return new NextResponse("Server Error", { status: 500 });
    }
}
