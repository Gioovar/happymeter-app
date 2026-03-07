import { NextResponse } from 'next/server';
import { generateAppleWalletPass } from '@/actions/wallet-pass';

export async function GET(request: Request, { params }: { params: { customerId: string } }) {
    const { customerId } = params;

    // Security check: in production we should check session
    // For now, assume this endpoint is called directly
    const result = await generateAppleWalletPass(customerId);

    if (!result.success || !result.buffer) {
        return new NextResponse(result.error || "Error", { status: 400 });
    }

    return new NextResponse(result.buffer as any, {
        status: 200,
        headers: {
            'Content-Type': 'application/vnd.apple.pkpass',
            'Content-Disposition': `attachment; filename="happymeters-tarjeta-${customerId}.pkpass"`
        }
    });
}
