import { NextResponse } from "next/server";
import { auth, currentUser } from '@clerk/nextjs/server';
import { prisma } from "@/lib/prisma";

export async function GET() {
    try {
        const authData = await auth();
        const user = await currentUser();
        const settings = authData.userId ? await prisma.userSettings.findUnique({ where: { userId: authData.userId } }) : null;
        
        return NextResponse.json({
            status: 'OK',
            auth: { userId: authData.userId },
            user: { email: user?.emailAddresses[0]?.emailAddress },
            settings: { found: !!settings }
        });
        return NextResponse.json(customers);
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
