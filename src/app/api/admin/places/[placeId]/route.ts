
import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'

export async function GET(
    req: Request,
    { params }: { params: Promise<{ placeId: string }> }
) {
    const { placeId } = await params
    try {
        const { userId } = await auth()
        if (!userId) return new NextResponse('Unauthorized', { status: 401 })

        const place = await prisma.place.findUnique({
            where: { id: placeId },
            include: {
                visits: {
                    include: {
                        creator: {
                            select: {
                                code: true,
                                userId: true, // You might want to join with User table for names if possible, or store name in AffiliateProfile
                                // Since AffiliateProfile doesn't have name, we might rely on client fetching or stored data
                            }
                        }
                    },
                    orderBy: { visitDate: 'desc' }
                }
            }
        })

        if (!place) return new NextResponse('Place not found', { status: 404 })

        return NextResponse.json(place)
    } catch (error) {
        console.error('[PLACE_GET]', error)
        return new NextResponse('Internal Error', { status: 500 })
    }
}

export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ placeId: string }> }
) {
    const { placeId } = await params
    try {
        const { userId } = await auth()
        if (!userId) return new NextResponse('Unauthorized', { status: 401 })

        const body = await req.json()
        const place = await prisma.place.update({
            where: { id: placeId },
            data: { ...body }
        })

        return NextResponse.json(place)
    } catch (error) {
        console.error('[PLACE_PATCH]', error)
        return new NextResponse('Internal Error', { status: 500 })
    }
}

export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ placeId: string }> }
) {
    const { placeId } = await params
    try {
        const { userId } = await auth()
        if (!userId) return new NextResponse('Unauthorized', { status: 401 })

        await prisma.place.delete({
            where: { id: placeId }
        })

        return new NextResponse(null, { status: 204 })
    } catch (error) {
        console.error('[PLACE_DELETE]', error)
        return new NextResponse('Internal Error', { status: 500 })
    }
}
