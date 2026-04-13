import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
    const url = new URL(req.url);
    const pin = url.searchParams.get('pin') || '123456';
    const dbMember = await prisma.teamMember.findFirst({ where: { accessCode: pin }, include: { owner: true } });
    if (!dbMember) return NextResponse.json({ error: "Not found member with pin " + pin });
    
    // Now look at their zones and tasks
    const zones = await prisma.processZone.findMany({
        where: { userId: dbMember.ownerId },
        include: {
            tasks: { select: { id: true, title: true, assignedStaffId: true, limitTime: true } }
        }
    });

    return NextResponse.json({
        dbMember,
        isRestrictedRole: !['ADMIN', 'SUPERVISOR'].includes(dbMember.role),
        totalZonesCount: zones.length,
        zonesDump: zones.map(z => ({ name: z.name, tasksCount: z.tasks.length, tasks: z.tasks }))
    });
}
