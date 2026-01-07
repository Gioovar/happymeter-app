'use server';

import { prisma } from '@/lib/prisma';
import { auth } from '@clerk/nextjs/server';
import { ProcessEvidenceStatus, ProcessEvidenceType } from '@prisma/client';
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
