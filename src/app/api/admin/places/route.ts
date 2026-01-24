import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
    try {
        const { userId } = await auth()
        if (!userId) return new NextResponse('Unauthorized', { status: 401 })

        // Optional: Check if user is actually an admin (implementation depends on your role system)

        const places = await prisma.place.findMany({
            orderBy: { createdAt: 'desc' },
            include: {
                _count: {
                    select: { visits: true }
                }
            }
        })

        return NextResponse.json(places)
    } catch (error) {
        console.error('[PLACES_GET]', error)
        return new NextResponse('Internal Error', { status: 500 })
    }
}

export async function POST(req: Request) {
    try {
        const { userId } = await auth()
        if (!userId) return new NextResponse('Unauthorized', { status: 401 })

        const body = await req.json()
        const { name, description, address, contactName, contactPhone, agreementDetails, coverImage } = body

        if (!name) return new NextResponse('Name is required', { status: 400 })

        const place = await prisma.place.create({
            data: {
                name,
                description,
                address,
                contactName,
                contactPhone,
                agreementDetails,
                coverImage
            }
        })

        return NextResponse.json(place)
    } catch (error) {
        console.error('[PLACES_POST]', error)
        return new NextResponse('Internal Error', { status: 500 })
    }
}
