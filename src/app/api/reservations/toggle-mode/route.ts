import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: Request) {
    try {
        const { userId } = await auth()
        if (!userId) {
            return new NextResponse("Unauthorized", { status: 401 })
        }

        const body = await req.json()
        const { simpleMode } = body

        if (typeof simpleMode !== 'boolean') {
            return new NextResponse("Invalid request", { status: 400 })
        }

        // Get current settings to preserve others
        const userSettings = await prisma.userSettings.findUnique({
            where: { userId },
            select: { reservationSettings: true }
        })

        const currentSettings = userSettings?.reservationSettings as any || {}

        // Upsert new settings preserving previous overrides
        await prisma.userSettings.upsert({
            where: { userId },
            update: {
                reservationSettings: {
                    ...currentSettings,
                    simpleMode: simpleMode
                }
            },
            create: {
                userId,
                plan: 'FREE',
                reservationSettings: {
                    standardTimeEnabled: false,
                    standardDurationMinutes: 120,
                    simpleMode: simpleMode,
                    dailyPaxLimit: 50
                }
            }
        })

        return NextResponse.json({ success: true })

    } catch (error) {
        console.error('[TOGGLE_RESERVATION_MODE]', error)
        return new NextResponse("Internal Error", { status: 500 })
    }
}
