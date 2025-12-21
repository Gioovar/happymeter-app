import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { RouletteOutcome } from "@/types/game-roulette"

// Helper to calculate winner based on rules
function determineWinner(outcomes: RouletteOutcome[], spinCount: number): string {
    // 1. Check Fixed Interval (Jackpots)
    // Sort by interval to prioritize rare events if overlapping (or order matters)
    const jackpots = outcomes.filter(o => o.rule === 'fixed_interval' && o.interval && o.interval > 0)

    // We check if spinCount is a multiple of interval
    // E.g. every 10 spins. spinCount = 10, 20, 30...
    // We prioritize the largest interval if multiple match? Or just the first one found?
    // Let's verify matches.
    for (const jackpot of jackpots) {
        if (spinCount % jackpot.interval! === 0) {
            return jackpot.id
        }
    }

    // 2. Common Random (Weighted)
    const commons = outcomes.filter(o => o.rule !== 'fixed_interval')

    // Simple verification: if no common prizes, return first outcome or null?
    if (commons.length === 0) return outcomes[0].id

    // Weighted random
    const totalWeight = commons.reduce((acc, curr) => acc + (curr.probability || 0), 0)
    let random = Math.random() * totalWeight

    for (const outcome of commons) {
        if (random < (outcome.probability || 0)) {
            return outcome.id
        }
        random -= (outcome.probability || 0)
    }

    // Fallback
    return commons[0].id
}


export async function POST(req: Request) {
    try {
        const body = await req.json()
        const { userId: ownerId } = body

        if (!ownerId) {
            return new NextResponse("Missing owner ID", { status: 400 })
        }

        // We don't auth the VIEWER (the player), we just need to know WHOSE game it is.
        // The game is public.

        // 1. Fetch current config & stats
        const userSettings = await prisma.userSettings.findUnique({
            where: { userId: ownerId },
            select: { gameConfig: true }
        })

        if (!userSettings) {
            return new NextResponse("User not found", { status: 404 })
        }

        const config = userSettings.gameConfig as any || {}
        const outcomes = config.roulette as RouletteOutcome[] || []

        if (outcomes.length === 0) {
            return new NextResponse("No prizes configured", { status: 400 })
        }

        // 2. Increment Spin Count
        const currentStats = config.stats || { rouletteSpins: 0 }
        const newSpins = (currentStats.rouletteSpins || 0) + 1

        // 3. Determine Winner
        const winnerId = determineWinner(outcomes, newSpins)
        const winnerIndex = outcomes.findIndex(o => o.id === winnerId)

        // 4. Update Stats in DB
        // We update the stats object inside gameConfig
        // Note: This is a race condition risk in high volume, but optimized for single-bar usage.
        await prisma.userSettings.update({
            where: { userId: ownerId },
            data: {
                gameConfig: {
                    ...config,
                    stats: {
                        ...currentStats,
                        rouletteSpins: newSpins
                    }
                }
            }
        })

        return NextResponse.json({
            winnerId,
            winnerIndex: winnerIndex === -1 ? 0 : winnerIndex,
            spinNumber: newSpins
        })

    } catch (error) {
        console.error('[GAME_SPIN]', error)
        return new NextResponse("Internal Error", { status: 500 })
    }
}
