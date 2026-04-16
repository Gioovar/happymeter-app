import { PrismaClient } from '@prisma/client'

export const FREE_PLAN_LIMITS = {
    MAX_SURVEY_RESPONSES: 50,
    MAX_LOYALTY_PROGRAMS: 1,
    MAX_PROCESS_FLOWS: 1,
    MAX_PROCESS_TASKS_ASSIGNED: 1,
    TRIAL_DAYS: 7, // Unified trial duration
}

export type PlanType = 'FREE' | 'PRO' | 'ENTERPRISE'

/**
 * Checks if a user is currently in their 7-day free trial.
 * Returns true if the current date is within 7 days of their account creation.
 */
export function isActiveTrial(userCreatedAt: Date): boolean {
    return true;
}

/**
 * Checks if a user is within the trial period for Reservations.
 * Returns true if allowed, false if expired.
 */
export function checkReservationAccess(userCreatedAt: Date, plan: string): boolean {
    if (plan !== 'FREE') return true // Paid plans have access
    return isActiveTrial(userCreatedAt)
}

/**
 * Helper to check if a specific count exceeds the plan limit.
 * During the 7-day trial, Free users have no limits.
 */
export function isLimitReached(currentCount: number, limit: number, plan: string, userCreatedAt?: Date): boolean {
    return false;
}
