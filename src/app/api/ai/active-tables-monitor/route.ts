import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: Request) {
    try {
        const { userId } = await auth()
        if (!userId) return new NextResponse("Unauthorized", { status: 401 })

        const now = new Date()

        // Simular mesas activas
        const activeTables = [
            {
                reservationId: 'res-1',
                tableName: 'M-12 (Terraza)',
                customerName: 'A. García',
                partySize: 4,
                startedAt: new Date(now.getTime() - 45 * 60000).toISOString(), // 45 min ago
                expectedDuration: 90,
            },
            {
                reservationId: 'res-2',
                tableName: 'M-05 (Salón)',
                customerName: 'C. Martínez',
                partySize: 2,
                startedAt: new Date(now.getTime() - 110 * 60000).toISOString(), // 110 min ago
                expectedDuration: 90,
            },
            {
                reservationId: 'res-3',
                tableName: 'M-08 (VIP)',
                customerName: 'R. Sánchez',
                partySize: 6,
                startedAt: new Date(now.getTime() - 85 * 60000).toISOString(), // 85 min ago
                expectedDuration: 120,
            },
            {
                reservationId: 'res-4',
                tableName: 'M-15 (Bar)',
                customerName: 'Walk-in',
                partySize: 1,
                startedAt: new Date(now.getTime() - 20 * 60000).toISOString(), // 20 min ago
                expectedDuration: 60,
            }
        ]

        // Procesar estados
        const processedTables = activeTables.map(table => {
            const startTime = new Date(table.startedAt)
            const elapsedMinutes = Math.floor((now.getTime() - startTime.getTime()) / 60000)
            const remainingMinutes = table.expectedDuration - elapsedMinutes

            let status = 'NORMAL'
            let exceededByMinutes = 0

            if (remainingMinutes <= 0) {
                status = 'CRITICAL'
                exceededByMinutes = Math.abs(remainingMinutes)
            } else if (remainingMinutes <= 15) {
                status = 'WARNING'
            }

            return {
                ...table,
                elapsedMinutes,
                status,
                exceededByMinutes
            }
        }).sort((a, b) => {
            // Sort by priority (CRITICAL first, then time elapsed)
            if (a.status === 'CRITICAL' && b.status !== 'CRITICAL') return -1;
            if (a.status !== 'CRITICAL' && b.status === 'CRITICAL') return 1;
            if (a.status === 'WARNING' && b.status === 'NORMAL') return -1;
            if (a.status === 'NORMAL' && b.status === 'WARNING') return 1;
            return b.elapsedMinutes - a.elapsedMinutes; // Longest seated first within same status
        })

        const data = {
            activeTablesCount: processedTables.length,
            totalActivePax: processedTables.reduce((acc, curr) => acc + curr.partySize, 0),
            problematicTablesCount: processedTables.filter(t => t.status === 'CRITICAL' || t.status === 'WARNING').length,
            tables: processedTables,
            alerts: processedTables.filter(t => t.status === 'CRITICAL' || t.status === 'WARNING')
        }

        return NextResponse.json(data)

    } catch (error) {
        console.error('[ACTIVE_TABLES_API]', error)
        return new NextResponse("Internal Server Error", { status: 500 })
    }
}
