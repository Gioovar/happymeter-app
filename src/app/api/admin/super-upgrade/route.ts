import { NextResponse } from "next/server"
import { auth, currentUser } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
    const { userId } = await auth();
    const user = await currentUser();
    
    if (!userId || !user) return new NextResponse("Unauthorized", { status: 401 });

    const email = user.emailAddresses[0]?.emailAddress;
    
    if (email !== "gtrendy2017@gmail.com") {
        return new NextResponse("Solo disponible para la cuenta maestra.", { status: 403 });
    }

    try {
        await prisma.userSettings.upsert({
            where: { userId },
            update: {
                plan: "ENTERPRISE",
                maxBranches: 9999,
                maxSurveys: 99999,
                extraSurveys: 99999,
                hasLoyalty: true,
                hasProcesses: true,
                hasReservations: true,
                hasDigitalMenu: true
            },
            create: {
                userId,
                plan: "ENTERPRISE",
                maxBranches: 9999,
                maxSurveys: 99999,
                extraSurveys: 99999,
                hasLoyalty: true,
                hasProcesses: true,
                hasReservations: true,
                hasDigitalMenu: true
            }
        });

        return NextResponse.json({ 
            success: true, 
            message: "¡MAGIA! Tu cuenta ahora tiene todo ILIMITADO.",
            details: {
                plan: "ENTERPRISE",
                maxBranches: 9999,
                addons: "TODOS ACTIVOS"
            }
        });
    } catch(e) {
        return NextResponse.json({ error: String(e) }, { status: 500 });
    }
}
