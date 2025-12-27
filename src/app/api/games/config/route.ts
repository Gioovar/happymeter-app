
import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url)
        const queryUserId = searchParams.get('userId')

        let targetUserId = queryUserId

        // If no query param, try auth (for dashboard usage)
        if (!targetUserId) {
            const { userId } = await auth()
            targetUserId = userId
        }

        if (!targetUserId) {
            return new NextResponse("Unauthorized", { status: 401 })
        }

        const userSettings = await prisma.userSettings.findUnique({
            where: { userId: targetUserId },
            select: { gameConfig: true }
        })

        return NextResponse.json({
            ...userSettings?.gameConfig as any,
            userId: targetUserId
        })
    } catch (error) {
        console.error('[GAMES_CONFIG_GET]', error)
        return new NextResponse("Internal Error", { status: 500 })
    }
}

import { PLAN_LIMITS } from '@/lib/plans'

export async function POST(req: Request) {
    try {
        const { userId } = await auth()
        if (!userId) {
            return new NextResponse("Unauthorized", { status: 401 })
        }

        const body = await req.json()

        const currentSettings = await prisma.userSettings.findUnique({
            where: { userId },
            select: { gameConfig: true, plan: true }
        })

        const currentConfig = (currentSettings?.gameConfig as any) || {}
        const newConfig = { ...currentConfig, ...body }

        // Check Limits
        const planCode = (currentSettings?.plan || 'FREE').toUpperCase() as keyof typeof PLAN_LIMITS
        const currentPlan = PLAN_LIMITS[planCode] || PLAN_LIMITS.FREE
        const maxGames = currentPlan.limits.games

        // Count enabled games in newConfig
        // Assuming config structure: { [gameKey]: { active: boolean, ... } }
        let activeGamesCount = 0
        Object.values(newConfig).forEach((game: any) => {
            if (game?.active) activeGamesCount++
        })

        if (activeGamesCount > maxGames) {
            return new NextResponse(
                JSON.stringify({ error: `Tu plan ${currentPlan.name} solo permite ${maxGames} juegos activos. Desactiva uno para activar otro.` }),
                { status: 403 }
            )
        }

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
