export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@clerk/nextjs/server';

export async function POST(req: Request) {
    try {
        const { userId } = await auth();
        const body = await req.json();
        const { token, platform, appType, customerId } = body;

        // Basic validation
        if (!token || !platform || !appType) {
            return new NextResponse("Missing required fields", { status: 400 });
        }

        // App-specific security check
        if (appType === "OPS") {
            if (!userId) {
                return new NextResponse("Unauthorized for OPS App", { status: 401 });
            }
        }

        if (appType === "LOYALTY") {
            if (!customerId) {
                return new NextResponse("Missing customerId for Loyalty App", { status: 400 });
            }
        }

        // Upsert the token
        const deviceToken = await prisma.deviceToken.upsert({
            where: { token },
            create: {
                token,
                platform, // iOS, Android, Web
                appType, // OPS, LOYALTY, CLIENT
                userId: userId || null, // Optional for Loyalty, required for Ops
                customerId: customerId || null, // Optional for Ops, required for Loyalty
                isActive: true
            },
            update: {
                userId: userId || null,
                customerId: customerId || null,
                isActive: true,
                updatedAt: new Date()
            }
        });

        return NextResponse.json({ success: true, deviceTokenId: deviceToken.id });

    } catch (error) {
        console.error("[Token Registration Error]:", error);
        return new NextResponse("Internal API Error", { status: 500 });
    }
}
