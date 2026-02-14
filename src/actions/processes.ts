'use server';

import { prisma } from '@/lib/prisma';
import { auth } from '@clerk/nextjs/server';
import { ProcessEvidenceStatus, ProcessEvidenceType, ProcessTask, ProcessTemplateTask } from '@prisma/client';
import { revalidatePath } from 'next/cache';

/**
 * Parses a time string "HH:MM" and returns a Date object for today with that time.
 */
function getDeadlineDate(timeString: string, referenceDate: Date = new Date()): Date {
    const [hours, minutes] = timeString.split(':').map(Number);
    const deadline = new Date(referenceDate);
    deadline.setHours(hours, minutes, 0, 0);
    return deadline;
}

interface SubmitEvidenceParams {
    taskId: string;
    fileUrl: string;
    capturedAt: Date; // Timestamp reported by the client (device time)
    timezoneOffset?: number; // Optional: Client timezone offset in minutes for accurate local time calculation
}

export async function submitTaskEvidence({ taskId, fileUrl, capturedAt, timezoneOffset = 0 }: SubmitEvidenceParams) {
    const { userId } = await auth();
    if (!userId) {
        throw new Error("Unauthorized");
    }

    // 1. Fetch Task
    const task = await prisma.processTask.findUnique({
        where: { id: taskId },
        include: { zone: true }
    });

    if (!task) {
        throw new Error("Task not found");
    }

    // 2. Validate "Real-Time" Capture (Anti-Gallery Heuristic)
    // We compare the 'capturedAt' reported by client (or extracted metadata) with the current server time 'now'.
    // If the image is too old (e.g. taken > 15 mins ago), we assume it's from gallery/old.
    // Note: 'capturedAt' is passed from the frontend. The frontend must extract this from the File object (lastModified) or enforce it.
    // A robust system would verify EXIF metadata server-side, but standard web uploads strip this often.
    // This server-side check relies on the client identifying the capture time honestly or the browser file timestamp.

    const now = new Date();
    const MAX_DELAY_MS = 15 * 60 * 1000; // 15 minutes tolerance for upload delays
    const timeDiff = Math.abs(now.getTime() - capturedAt.getTime());

    // NOTE: This is a strict check. If the user loses connection and uploads later, this might fail. 
    // But for "Real Time" enforcement, this is the trade-off.
    if (timeDiff > MAX_DELAY_MS) {
        // We reject it? Or just flag it? The requirement says "block upload".
        // Let's return an error.
        throw new Error("La evidencia no parece ser reciente ( > 15 min). Por favor captura una foto/video en tiempo real.");
    }

    // 3. Determine Status (On Time vs Delayed)
    let status: ProcessEvidenceStatus = 'ON_TIME';

    if (task.limitTime) {
        // task.limitTime is "HH:MM" (e.g., "14:00")
        // We need to see if capturedAt > deadline for THAT day.

        // Adjust capturedAt to the relevant Timezone logic if needed. 
        // For simplicity, we compare hours/minutes of the capturedAt directly against the limitTime string
        // assuming the limitTime refers to the SAME day as collection.

        // Parse limit "14:30"
        const [limitHour, limitMinute] = task.limitTime.split(':').map(Number);

        // Get capture time parts
        // Use timezoneOffset if provided to get local time of user, otherwise UTC or Server local
        // Ideally we use date-fns-tz, but here is a simple shift:
        // capturedAt is UTC usually in server. calculate local user Date.
        // User Local Date = capturedAt - (timezoneOffset minutes)
        // timezoneOffset is usually (UTC - Local) in minutes. e.g. UTC-6 is 360.
        // So Local = UTC - (+360)? No, Date.getTime() is UTC. 
        // Let's reconstruct the local hours.

        // Simpler approach: construct the deadline date using the capturedAt date components (in local time? tricky).
        // Let's assume capturedAt is comparable.

        const captureLimit = new Date(capturedAt);
        captureLimit.setHours(limitHour, limitMinute, 0, 0);

        // If capturedAt is AFTER the limit
        if (capturedAt > captureLimit) {
            status = 'DELAYED';
        }
    }

    // 4. Save to DB
    const evidence = await prisma.processEvidence.create({
        data: {
            taskId,
            fileUrl,
            capturedAt,
            status,
            staffId: userId, // associate with the logged in user
        }
    });

    revalidatePath('/dashboard/processes');
    return { success: true, evidence, status };
}

export async function getOpsTasks() {
    const { userId } = await auth();
    if (!userId) return null;

    // 1. Check for Team Memberships (Staff View)
    // We check this first to ensure Staff who completed profile setup (and thus have UserSettings)
    // still get treated as Staff and see only their assigned tasks.
    const memberships = await prisma.teamMember.findMany({
        where: { userId }
    });

    if (memberships.length > 0) {
        // User is a Staff Member (possibly in multiple teams)
        const memberIds = memberships.map(m => m.id);

        console.log(`[getOpsTasks] User ${userId} found in ${memberships.length} teams. IDs:`, memberIds);

        const zones = await prisma.processZone.findMany({
            where: {
                assignedStaffId: { in: memberIds }
            },
            include: {
                tasks: {
                    include: {
                        evidences: {
                            where: {
                                submittedAt: {
                                    gte: new Date(new Date().setHours(0, 0, 0, 0)),
                                    lt: new Date(new Date().setHours(23, 59, 59, 999))
                                }
                            },
                            take: 1,
                            orderBy: { submittedAt: 'desc' }
                        }
                    }
                }
            }
        });
        return { zones };
    }

    // 2. Owner View (Fallback)
    // If not a team member, assume Owner and show ALL zones they own.
    console.log(`[getOpsTasks] User ${userId} is Owner (or has no memberships). Showing all owned zones.`);

    const zones = await prisma.processZone.findMany({
        where: {
            userId: userId
        },
        include: {
            tasks: {
                include: {
                    evidences: {
                        where: {
                            submittedAt: {
                                gte: new Date(new Date().setHours(0, 0, 0, 0)),
                                lt: new Date(new Date().setHours(23, 59, 59, 999))
                            }
                        },
                        take: 1,
                        orderBy: { submittedAt: 'desc' }
                    }
                }
            }
        }
    });

    return { zones };
}

export async function getProcessAnalytics() {
    const { userId } = await auth();
    if (!userId) return null;

    // We fetch ALL evidences for the user's zones (Owner View)
    // TODO: Filter by Team Member access if needed (similar to getOpsTasks)

    // For now, assuming Owner or Admin context for Analytics
    const evidences = await prisma.processEvidence.findMany({
        where: {
            task: {
                zone: {
                    userId: userId
                }
            }
        },
        include: {
            task: {
                include: {
                    zone: true
                }
            }
        },
        orderBy: {
            submittedAt: 'desc'
        },
        take: 100 // Limit to recent 100 for now
    });

    const issues = evidences.filter(e => e.status === 'DELAYED');

    return {
        allEvidences: evidences,
        issues: issues
    };
}

export async function getDailyTaskReport(dateStr: string) {
    const { userId } = await auth();
    if (!userId) return null;

    // Parse Date (YYYY-MM-DD local logic?)
    // We assume the dateStr is "YYYY-MM-DD" from the client.
    // We want to query the DB for evidences submitted on this "Calendar Day".
    // Timezone handling is tricky. We'll approximate using the Server's timezone or assume UTC for storage.
    // Ideally, we search from T00:00:00 to T23:59:59 of that date string.

    // Create Start/End Date objects
    // Append T00:00:00 and T23:59:59 to query
    const startOfDay = new Date(`${dateStr}T00:00:00`);
    const endOfDay = new Date(`${dateStr}T23:59:59.999`);

    // Determine Day of Week string (Mon, Tue...) for Task Filtering
    // Note: ensure we get the day of week for the *intended* date.
    // new Date("2023-10-25") might be UTC. 
    // If we use the exact string year-month-day, we can construct a reliable day index.
    const dateObj = new Date(dateStr + "T12:00:00"); // Noon to avoid timezone shift edge cases
    const dayMap = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const dayOfWeek = dayMap[dateObj.getDay()];

    console.log(`[getDailyTaskReport] Date: ${dateStr}, Day: ${dayOfWeek}`);

    // 1. Fetch All Relevant Tasks (User's Zones)
    // We fetch ALL tasks for the user, regardless of whether they have a team member assigned?
    // The report is for the Manager/Owner, so yes, all tasks in their zones.
    const zones = await prisma.processZone.findMany({
        where: { userId },
        include: {
            assignedStaff: {
                include: {
                    user: {
                        select: { businessName: true, phone: true }
                    }
                }
            },
            tasks: {
                where: {
                    // Filter tasks that recur on this day
                    days: { has: dayOfWeek }
                }
            }
        }
    });

    // Flatten tasks
    const relevantTasks = zones.flatMap(z => z.tasks.map(t => ({
        ...t,
        zoneName: z.name,
        assignedStaffName: z.assignedStaff?.user?.businessName || z.assignedStaff?.user?.phone || 'Sin Asignar'
    })));

    // 2. Fetch Evidence for this Date Range
    // We find evidences linked to these tasks within the time window.
    const taskIds = relevantTasks.map(t => t.id);

    const evidences = await prisma.processEvidence.findMany({
        where: {
            taskId: { in: taskIds },
            submittedAt: {
                gte: startOfDay,
                lte: endOfDay
            }
        },
        orderBy: { submittedAt: 'desc' }
    });

    // 2.5 Fetch Staff Info for Evidence
    // ProcessEvidence has 'staffId' which corresponds to UserSettings.userId
    const staffIds = Array.from(new Set(evidences.map(e => e.staffId).filter(Boolean) as string[]));

    const staffUsers = await prisma.userSettings.findMany({
        where: { userId: { in: staffIds } },
        select: {
            userId: true,
            businessName: true,
            phone: true,
            photoUrl: true,
            // @ts-ignore
            fullName: true
        }
    });

    const staffMap = new Map(staffUsers.map(u => [u.userId, {
        // @ts-ignore
        name: u.fullName || u.businessName || u.phone || 'Usuario',
        photo: u.photoUrl
    }]));

    // 3. Combine Data
    const reportData = relevantTasks.map(task => {
        // Find evidence (taking the latest if multiple, though usually 1 per day per task is the norm)
        const evidence = evidences.find(e => e.taskId === task.id);

        let status: 'COMPLETED' | 'PENDING' | 'MISSED' = 'PENDING';

        if (evidence) {
            status = 'COMPLETED';
        } else {
            const today = new Date();
            // Get local date string for comparison 'YYYY-MM-DD' via locale time if needed, 
            // but for simplicity assuming server/client consistency or UTC handling.
            // Using a simpler string comparison for date part.
            // Note: dateStr comes from client which is selected date.

            const todayStr = today.toISOString().split('T')[0];

            if (dateStr < todayStr) {
                status = 'MISSED';
            } else if (dateStr === todayStr && task.limitTime) {
                // If it's today, check time limit
                // limitTime format is "HH:MM" (24h)
                const nowHours = today.getHours();
                const nowMinutes = today.getMinutes();
                const currentTime = nowHours * 60 + nowMinutes;

                const [limitHours, limitMinutes] = task.limitTime.split(':').map(Number);
                const limitTimeMinutes = limitHours * 60 + limitMinutes;

                if (currentTime > limitTimeMinutes) {
                    status = 'MISSED';
                }
            }
        }

        return {
            id: task.id,
            title: task.title,
            zoneName: task.zoneName,
            limitTime: task.limitTime,
            status,
            assignedStaff: task.assignedStaffName,
            evidence: evidence ? {
                id: evidence.id,
                fileUrl: evidence.fileUrl,
                submittedAt: evidence.submittedAt,
                validationStatus: evidence.status, // Using status as proxy for now or add validationStatus to schema if updated
                completedBy: evidence.staffId ? staffMap.get(evidence.staffId)?.name : null,
                completedByPhoto: evidence.staffId ? staffMap.get(evidence.staffId)?.photo : null
            } : null
        };
    });

    // Stats
    const stats = {
        total: reportData.length,
        completed: reportData.filter(t => t.status === 'COMPLETED').length,
        pending: reportData.filter(t => t.status === 'PENDING').length,
        missed: reportData.filter(t => t.status === 'MISSED').length,
    };

    return {
        date: dateStr,
        stats,
        tasks: reportData
    };
}

// --- Template Management System ---

export async function getProcessTemplates() {
    const templates = await prisma.processTemplate.findMany({
        include: {
            tasks: true
        }
    });
    return { templates };
}

export async function instantiateTemplate(templateId: string, branchId: string, zoneName: string) {
    const { userId } = await auth();
    if (!userId) {
        throw new Error("Unauthorized");
    }

    // 1. Fetch Template
    const template = await prisma.processTemplate.findUnique({
        where: { id: templateId },
        include: { tasks: true }
    });

    if (!template) {
        throw new Error("Plantilla no encontrada");
    }

    // 2. Create Process Zone for the Branch

    // Create Zone
    const zone = await prisma.processZone.create({
        data: {
            userId: branchId,
            name: zoneName || template.name,
            description: `Importado de plantilla: ${template.name}`,
        }
    });

    // 3. Create Tasks
    const creationPromises = template.tasks.map((task: any) =>
        prisma.processTask.create({
            data: {
                zoneId: zone.id,
                title: task.title,
                description: task.description,
                limitTime: task.defaultLimitTime,
                evidenceType: task.evidenceType,
                days: task.days?.length > 0 ? task.days : ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"], // Use template days or default to daily
            }
        })
    );


    await Promise.all(creationPromises);

    revalidatePath(`/dashboard/${branchId}/processes`);
    revalidatePath(`/dashboard/processes`);

    return { success: true, zoneId: zone.id };
}

export async function getProcessZone(zoneId: string) {
    const { userId } = await auth();
    if (!userId) return null;

    const zone = await prisma.processZone.findUnique({
        where: { id: zoneId },
        include: {
            tasks: {
                include: {
                    evidences: {
                        where: {
                            submittedAt: {
                                gte: new Date(new Date().setHours(0, 0, 0, 0)),
                                lt: new Date(new Date().setHours(23, 59, 59, 999))
                            }
                        },
                        take: 1,
                        orderBy: { submittedAt: 'desc' }
                    }
                }
            }
        }
    });

    return zone;
}

export async function getProcessZoneHistory(zoneId: string, dateStr: string) {
    const { userId } = await auth();
    if (!userId) return null;

    // Parse Date similar to getDailyTaskReport
    const startOfDay = new Date(`${dateStr}T00:00:00`);
    const endOfDay = new Date(`${dateStr}T23:59:59.999`);

    // Get Day of Week for recurring tasks check
    const dateObj = new Date(dateStr + "T12:00:00");
    const dayMap = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const dayOfWeek = dayMap[dateObj.getDay()];

    // 1. Fetch Zone and its Tasks (filtered by day)
    const zone = await prisma.processZone.findUnique({
        where: { id: zoneId },
        include: {
            tasks: {
                where: {
                    days: { has: dayOfWeek }
                }
            },
            assignedStaff: {
                include: {
                    user: {
                        select: {
                            fullName: true,
                            businessName: true,
                            photoUrl: true
                        }
                    }
                }
            }
        }
    });

    if (!zone) return null;

    const responsiblePerson = zone.assignedStaff?.user?.fullName || zone.assignedStaff?.user?.businessName || "Personal Asignado";
    const responsiblePhoto = zone.assignedStaff?.user?.photoUrl;

    // 2. Fetch Evidence for these tasks on that date
    const taskIds = zone.tasks.map(t => t.id);
    const evidences = await prisma.processEvidence.findMany({
        where: {
            taskId: { in: taskIds },
            submittedAt: {
                gte: startOfDay,
                lte: endOfDay
            }
        },
        // include: {
        //     staff: {
        //         select: {
        //             businessName: true,
        //             phone: true, 
        //             photoUrl: true,
        //             // @ts-ignore
        //             fullName: true
        //         }
        //     }
        // }
    });

    // 3. Map tasks with status
    const historyTasks = zone.tasks.map((task: ProcessTask) => {
        const evidence = evidences.find(e => e.taskId === task.id);
        let status: 'COMPLETED' | 'PENDING' | 'MISSED' = 'PENDING';

        if (evidence) {
            status = 'COMPLETED';
        } else {
            const todayStr = new Date().toISOString().split('T')[0];
            if (dateStr < todayStr) {
                status = 'MISSED';
            } else if (dateStr === todayStr && task.limitTime) {
                const now = new Date();
                const nowTotalMinutes = now.getHours() * 60 + now.getMinutes();
                const [lh, lm] = task.limitTime.split(':').map(Number);
                if (nowTotalMinutes > (lh * 60 + lm)) {
                    status = 'MISSED';
                }
            }
        }

        return {
            ...task,
            status,
            responsible: responsiblePerson,
            responsiblePhoto,
            evidence: evidence ? {
                id: evidence.id,
                fileUrl: evidence.fileUrl,
                submittedAt: evidence.submittedAt,
                // completedBy: evidence.staff?.fullName || evidence.staff?.businessName || evidence.staff?.phone || 'Usuario',
                // completedByPhoto: evidence.staff?.photoUrl
                completedBy: 'Usuario', // Simplification until relation is fixed
                completedByPhoto: null
            } : null
        };
    });

    // Stats
    const stats = {
        total: historyTasks.length,
        completed: historyTasks.filter(t => t.status === 'COMPLETED').length,
        missed: historyTasks.filter(t => t.status === 'MISSED').length,
        pending: historyTasks.filter(t => t.status === 'PENDING').length
    };

    return {
        date: dateStr,
        stats,
        tasks: historyTasks,
        zoneName: zone.name,
        responsible: responsiblePerson
    };
}

export async function getDashboardProcessStats(branchId: string) {
    // Get today's stats
    const todayStr = new Date().toISOString().split('T')[0];
    const report = await getDailyTaskReport(todayStr);

    if (!report) {
        return {
            total: 0,
            completed: 0,
            missed: 0,
            pending: 0,
            complianceRate: 0,
            zonesCount: 0
        };
    }

    // Calculate aggregate stats
    const total = report.stats.total;
    const completed = report.stats.completed;
    const missed = report.stats.missed;
    const pending = report.stats.pending;
    const complianceRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    // Get zones count separately as report is task-centric
    const uniqueZoneIds = new Set(report.tasks.map((t: any) => t.zoneId));

    return {
        total,
        completed,
        missed,
        pending,
        complianceRate,
        zonesCount: uniqueZoneIds.size
    };
}
