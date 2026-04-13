import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
    const member = await prisma.teamMember.findFirst({
        where: { accessCode: '123456' }
    });
    return NextResponse.json(member);
}
