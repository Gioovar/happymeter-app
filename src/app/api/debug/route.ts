import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
    try {
        const phone = "+525574131657";
        const customers = await prisma.customer.findMany({
            where: {
                OR: [
                    { phone: phone },
                    { phone: "5574131657" },
                    { phone: "+52 55 7413 1657" }
                ]
            },
            include: {
                loyaltyCards: {
                    include: { business: { select: { name: true } } }
                }
            }
        });
        return NextResponse.json(customers);
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
