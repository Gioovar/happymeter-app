import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
    return NextResponse.json({
        ok: true,
        version: "v1",
        service: "HappyMeter Mobile API"
    });
}
