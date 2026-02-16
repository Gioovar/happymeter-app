'use server';

import { prisma } from '@/lib/prisma';
import { getOpsSession } from '@/lib/ops-auth';
import { startOfDay, endOfDay, subDays } from 'date-fns';

export async function getStaffPerformanceMetrics() {
    const { isAuthenticated, userId, member } = await getOpsSession();

    if (!isAuthenticated) {
        return {
            compliance: { completed: 0, total: 0, percentage: 0 },
            performance: { score: 0, trend: [] }
        };
    }

    const memberId = member?.id;
    // If we only have userId (Owner/Admin view previewing as staff?), we might not have memberId.
    // Ops dashboard usually relies on memberId for task assignment.
    // If no memberId, we can't track specific assignments well unless we map userId -> members.
    // getOpsSession should return member if logged in as staff.

    if (!memberId) {
        return {
            compliance: { completed: 0, total: 0, percentage: 0 },
            performance: { score: 0, trend: [] }
        };
    }

    const today = new Date();
    const dayName = today.toLocaleDateString('en-US', { weekday: 'short' }); // Mon, Tue...

    // 1. Compliance (Today)
    // Fetch all tasks assigned to this member OR their zone (if they are zone manager)
    // AND that are active today (days array includes today OR is empty/null)

    // We reuse logic similar to getOpsTasks but simplified for counting.
    // Actually, distinct tasks count is tricky because of the "Zone Manager" logic.
    // Let's rely on explicit assignment + Zone assignment.

    const assignedZones = await prisma.processZone.findMany({
        where: {
            OR: [
                { assignedStaffId: memberId },
                { tasks: { some: { assignedStaffId: memberId } as any } }
            ]
        },
        include: {
            tasks: {
                where: {
                    OR: [
                        { days: { has: dayName } },
                        { days: { isEmpty: true } } // If empty, assume daily
                    ]
                },
                include: {
                    evidences: {
                        where: {
                            submittedAt: {
                                gte: startOfDay(today),
                                lt: endOfDay(today)
                            }
                        },
                        take: 1
                    }
                }
            }
        }
    });

    let totalTasks = 0;
    let completedTasks = 0;

    assignedZones.forEach((zone: any) => {
        const isZoneManager = zone.assignedStaffId === memberId;

        zone.tasks.forEach((task: any) => {
            // Filter: Does this task belong to the user?
            const isAssignedToMe = task.assignedStaffId === memberId;

            if (isZoneManager || isAssignedToMe) {
                totalTasks++;
                if (task.evidences.length > 0) {
                    completedTasks++;
                }
            }
        });
    });

    const compliancePercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    // 2. Performance (Last 7 Days)
    // Based on Validation Status: APPROVED = 100, REJECTED = 0, PENDING = Ignore (or 50?)
    // Also check AI Analysis score if strictly needed, but validation is the "truth".

    const recentEvidences = await prisma.processEvidence.findMany({
        where: {
            // task: { ... } // We could filter by task assignment but staffId on evidence is safer source of truth for "my performance"
            staffId: userId || memberId, // Evidences are linked to the user who submitted them
            submittedAt: {
                gte: subDays(today, 7)
            },
            validationStatus: {
                in: ['APPROVED', 'REJECTED'] // Only counted if validated? Or maybe just count submitted?
            }
        },
        orderBy: { submittedAt: 'asc' }
    });

    // Calculate dynamic score
    // Start with 100.
    // Reject = -20? 
    // Or Average of (Approved=100, Rejected=0)

    let scoreSum = 0;
    let scoreCount = 0;

    recentEvidences.forEach(ev => {
        if (ev.validationStatus === 'APPROVED') {
            scoreSum += 100;
            scoreCount++;
        } else if (ev.validationStatus === 'REJECTED') {
            scoreSum += 0;
            scoreCount++;
        }
    });

    // If no validations, maybe show 100 (optimistic) or 0 (neutral)? 
    // Let's show "N/A" effectively aka 0 but handle UI.
    // If they have completed tasks but no validations, maybe 100?
    // Let's default to 100 if they are active, 0 if inactive.

    const performanceScore = scoreCount > 0 ? Math.round(scoreSum / scoreCount) : (completedTasks > 0 ? 100 : 0);

    return {
        compliance: {
            completed: completedTasks,
            total: totalTasks,
            percentage: compliancePercentage
        },
        performance: {
            score: performanceScore,
            trend: [] // TODO: Add daily trend if needed for chart
        }
    };
}
