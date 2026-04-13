export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import QRCode from 'qrcode';

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const data = searchParams.get('data');

        if (!data) {
            return new NextResponse('Missing data parameter', { status: 400 });
        }

        // Generate QR code as a Buffer (PNG format)
        const qrBuffer = await QRCode.toBuffer(data, {
            type: 'png',
            margin: 2,
            width: 300,
            color: {
                dark: '#000000',
                light: '#ffffff'
            }
        });

        // Return the image
        return new NextResponse(qrBuffer as unknown as BodyInit, {
            status: 200,
            headers: {
                'Content-Type': 'image/png',
                // Allow browsers/email clients to cache the image
                'Cache-Control': 'public, max-age=31536000, immutable',
            },
        });
    } catch (error) {
        console.error('[QR_API_ERROR]', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}
