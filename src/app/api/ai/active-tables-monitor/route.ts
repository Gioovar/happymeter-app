export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: Request) {
    try {
        const { userId } = await auth()
        if (!userId) return new NextResponse("Unauthorized", { status: 401 })

        const now = new Date()

        const startOfToday = new Date(now)
        startOfToday.setHours(0, 0, 0, 0)

        // Obtener reservaciones reales del día de hoy que estén activas
        // Se asume que una reservación está "activa" si su hora de inicio ya pasó,
        // pero no ha excedido por más de 4 horas (en caso de que no marquen salida manually)
        const activeReservations = await prisma.reservation.findMany({
            where: {
                userId,
                date: {
                    gte: startOfToday,
                    lte: now // Ya empezaron
                },
                status: {
                    in: ['CONFIRMED', 'SEATED', 'IN_PROGRESS'] // Asumiendo estos estados
                }
            },
            include: {
                table: true
            }
        })

        const activeTables = activeReservations
            .filter(res => {
                const startTime = new Date(res.date)
                const elapsedHours = (now.getTime() - startTime.getTime()) / (1000 * 60 * 60)
                // Filtrar las que tienen menos de 4 horas de haber iniciado (están "vivas")
                return elapsedHours >= 0 && elapsedHours <= 4
            })
            .map(res => ({
                reservationId: res.id,
                tableName: res.table?.label || 'Mesa S/N',
                customerName: res.customerName || 'Cliente',
                partySize: res.partySize || 1,
                startedAt: res.date.toISOString(),
                expectedDuration: res.duration || 120, // Minutos esperados
            }))

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
