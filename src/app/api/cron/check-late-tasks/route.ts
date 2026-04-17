import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getMexicoTodayRange } from '@/actions/processes'
import { createInternalNotification } from '@/actions/internal-communications'

function getAdjustedTimeValue(timeString: string | null): number {
    if (!timeString) return 99999; 
    const [hours, minutes] = timeString.split(':').map(Number);
    let adjustedHours = hours;
    if (hours < 6) {
        adjustedHours += 24;
    }
    return adjustedHours * 60 + minutes;
}

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
    if (req.headers.get('Authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
        // Allow localhost testing without cron secret, but enforce it in prod
        if (process.env.NODE_ENV === 'production') {
            return new NextResponse('Unauthorized', { status: 401 })
        }
    }

    try {
        const { start: todayStart, end: todayEnd, dayOfWeek, mexicoNow } = await getMexicoTodayRange()
        const currentMexicoHour = mexicoNow.getHours().toString().padStart(2, '0');
        const currentMexicoMinute = mexicoNow.getMinutes().toString().padStart(2, '0');
        const currentVal = getAdjustedTimeValue(`${currentMexicoHour}:${currentMexicoMinute}`);

        console.log(`⏰ Cron running - Current MX Time: ${currentMexicoHour}:${currentMexicoMinute} (Val: ${currentVal})`);

        // Find tasks scheduled for today that have a limitTime
        const tasks = await prisma.processTask.findMany({
            where: {
                days: { has: dayOfWeek },
                limitTime: { not: null },
                assignedStaffId: { not: null }
            },
            include: {
                zone: true
            }
        });

        const results = { lateCount: 0, alertedCount: 0, debug: [] as string[] };

        // Find existing evidences for today
        const evidences = await prisma.processEvidence.findMany({
            where: {
                submittedAt: {
                    gte: todayStart,
                    lte: todayEnd
                }
            },
            select: { taskId: true }
        });
        const completedTaskIds = new Set(evidences.map(e => e.taskId));

        // Find existing alerts sent TODAY to avoid spamming
        const existingAlerts = await prisma.internalNotification.findMany({
            where: {
                type: 'LATE_TASK_ALERT',
                createdAt: {
                    gte: todayStart,
                    lte: todayEnd
                }
            },
            select: { actionUrl: true }
        });

        // Extrack task IDs from action URL format e.g. "/ops/tasks/<taskId>"
        const alertedTaskIds = new Set(existingAlerts.map(a => {
            if (a.actionUrl) {
                const parts = a.actionUrl.split('/');
                return parts[parts.length - 1];
            }
            return null;
        }).filter(Boolean));

        for (const task of tasks) {
            const limitVal = getAdjustedTimeValue(task.limitTime);

            // Is it delayed by at least 30 minutes?
            // currentVal - limitVal calculation is handled in minutes: 
            // e.g limit is 14:00 (840) and current is 14:35 (875) => 875 - 840 = 35.
            const isLate = (currentVal - limitVal >= 30) && (currentVal - limitVal < 1440);
            
            if (!isLate) continue;
            results.lateCount++;

            const isDone = completedTaskIds.has(task.id);
            if (isDone) continue; 

            const alreadyAlerted = alertedTaskIds.has(task.id);
            if (alreadyAlerted) continue; 

            // Send Alert!
            const branchId = task.zone.branchId || task.zone.userId;
            const targetUserId = task.assignedStaffId!;
            
            // This will dispatch the internal notification for the bell 
            // AND send a native push notification to their device. 
            await createInternalNotification(
                targetUserId,
                branchId,
                `⏱️ Atraso en Tarea 🤔`,
                `Pasaron más de 30 minutos del límite (${task.limitTime}) para: ${task.title}. Sube tu evidencia pronto para no bajar el desempeño en tu salón.`,
                'LATE_TASK_ALERT',
                `/ops/tasks/${task.id}`
            );
            results.alertedCount++;
            results.debug.push(`Alerted ${targetUserId} for task ${task.id} (Limit: ${task.limitTime})`);
        }

        console.log(`⏰ Cron complete: ${results.alertedCount} new alerts sent out of ${results.lateCount} late pending tasks.`);
        return NextResponse.json({ success: true, results });

    } catch (err: any) {
        console.error('[CRON LATE TASKS ERROR]', err);
        return new NextResponse(`Error: ${err.message}`, { status: 500 });
    }
}
