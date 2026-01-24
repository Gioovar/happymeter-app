
import { PrismaClient } from '@prisma/client'

export const FREE_PLAN_LIMITS = {
    MAX_SURVEY_RESPONSES: 50,
    MAX_LOYALTY_PROGRAMS: 1,
    MAX_PROCESS_FLOWS: 1,
    MAX_PROCESS_TASKS_ASSIGNED: 1,
    RESERVATION_TRIAL_DAYS: 7,
}

export type PlanType = 'FREE' | 'PRO' | 'ENTERPRISE'

/**
 * Checks if a user is within the trial period for Reservations.
 * Returns true if allowed, false if expired.
 */
export function checkReservationAccess(userCreatedAt: Date, plan: string): boolean {
    if (plan !== 'FREE') return true // Paid plans have access

    const now = new Date()
    const trialEnd = new Date(userCreatedAt)
    trialEnd.setDate(trialEnd.getDate() + FREE_PLAN_LIMITS.RESERVATION_TRIAL_DAYS)

    return now < trialEnd
}

/**
 * Helper to check if a specific count exceeds the plan limit.
 */
export function isLimitReached(currentCount: number, limit: number, plan: string): boolean {
    if (plan !== 'FREE') return false
    return currentCount >= limit
}
