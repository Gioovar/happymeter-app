
import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
    try {
        const { userId } = await auth()
        if (!userId) {
            return new NextResponse("Unauthorized", { status: 401 })
        }

        const userSettings = await prisma.userSettings.findUnique({
            where: { userId },
            select: { gameConfig: true }
        })

        return NextResponse.json(userSettings?.gameConfig || {})
    } catch (error) {
        console.error('[GAMES_CONFIG_GET]', error)
        return new NextResponse("Internal Error", { status: 500 })
    }
}

export async function POST(req: Request) {
    try {
        const { userId } = await auth()
        if (!userId) {
            return new NextResponse("Unauthorized", { status: 401 })
        }

        const body = await req.json()

        // Upsert logic for userSettings if not exists, but usually it exists
        // We will merge existing config with new config to avoid overwriting other games

        const currentSettings = await prisma.userSettings.findUnique({
            where: { userId },
            select: { gameConfig: true }
        })

        const currentConfig = (currentSettings?.gameConfig as any) || {}
        const newConfig = { ...currentConfig, ...body }

        const updated = await prisma.userSettings.upsert({
            where: { userId },
            update: {
                gameConfig: newConfig
            },
            create: {
                userId,
                gameConfig: newConfig,
                plan: 'FREE',
                maxSurveys: 3
            }
        })

        return NextResponse.json(updated.gameConfig)
    } catch (error) {
        console.error('[GAMES_CONFIG_POST]', error)
        return new NextResponse("Internal Error", { status: 500 })
    }
}
