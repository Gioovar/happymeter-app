import { prisma } from "@/lib/prisma"
import { randomUUID } from "crypto"

export type LoyaltyEventType = 'CHECK_IN' | 'SPEND' | 'VISIT' | 'REFERRAL' | 'FEEDBACK' | 'CUSTOM'

interface EventContext {
    programId: string
    customerId: string
    type: LoyaltyEventType
    metadata?: any
}

export async function processLoyaltyEvent(ctx: EventContext) {
    console.log(`[LoyaltyEngine] Processing event: ${ctx.type} for customer ${ctx.customerId}`)

    // 1. Log the Immutable Event
    await prisma.loyaltyEvent.create({
        data: {
            programId: ctx.programId,
            customerId: ctx.customerId,
            type: ctx.type,
            metadata: ctx.metadata || {}
        }
    })

    // 2. Fetch Active Rules & Customer Data
    const [rules, customer] = await Promise.all([
        prisma.loyaltyRule.findMany({
            where: { programId: ctx.programId, isActive: true },
            include: { reward: true }
        }),
        prisma.loyaltyCustomer.findUnique({
            where: { id: ctx.customerId },
            include: {
                visits: { orderBy: { visitDate: 'desc' }, take: 10 },
                events: { where: { type: ctx.type }, orderBy: { createdAt: 'desc' } } // Fetch recent events of same type
            }
        })
    ])

    if (!customer) return { success: false, error: "Customer not found" }

    // 3. Evaluate Rules
    const triggeredRewards = []

    for (const rule of rules) {
        if (rule.trigger !== ctx.type) continue

        const conditions = rule.conditions as any
        let isTriggered = false

        // --- RULE ENGINE LOGIC --- //

        // Condition: Frequency (e.g., "2 visits in 7 days")
        if (conditions.frequency && conditions.days) {
            // Count events in the last X days
            const cutoff = new Date()
            cutoff.setDate(cutoff.getDate() - conditions.days)
            const recentEvents = customer.events.filter((e: any) => new Date(e.createdAt) > cutoff)

            if (recentEvents.length >= conditions.frequency) {
                isTriggered = true
            }
        }

        // Condition: Spend (e.g. "Spend > 500")
        if (conditions.minSpend && ctx.metadata?.amount) {
            if (ctx.metadata.amount >= conditions.minSpend) {
                isTriggered = true
            }
        }

        // Condition: Specific Time (e.g. "Thursday")
        if (conditions.specificDay) {
            const today = new Date().getDay() // 0=Sun, 1=Mon...
            if (today === conditions.specificDay) {
                isTriggered = true
            }
        }

        // Default: If no complex conditions, trigger on action (1:1)
        if (Object.keys(conditions).length === 0) {
            isTriggered = true
        }


        // --- ACTION: GRANT REWARD --- //
        if (isTriggered && rule.rewardId) {
            // Create Redemption (Reward in Wallet)
            const redemption = await prisma.loyaltyRedemption.create({
                data: {
                    programId: ctx.programId,
                    customerId: ctx.customerId,
                    rewardId: rule.rewardId,
                    status: "PENDING",
                    redemptionCode: randomUUID().slice(0, 8).toUpperCase()
                }
            })
            triggeredRewards.push(redemption)
            console.log(`[LoyaltyEngine] Rule met: "${rule.name}" -> Reward: ${rule.rewardId}`)
        }
    }

    // 4. Check Tier Upgrade (Status)
    // Simple logic: Total visits thresholds
    // Implementation: Fetch tiers, compare totalVisits, update if higher tier found.
    const tiers = await prisma.loyaltyTier.findMany({
        where: { programId: ctx.programId },
        orderBy: { order: 'desc' } // Check highest first
    })

    let newTierId = customer.tierId

    for (const tier of tiers) {
        if (customer.totalVisits >= tier.requiredVisits) {
            if (customer.tierId !== tier.id) {
                newTierId = tier.id
                // Log Tier Upgrade Event?
                await prisma.loyaltyEvent.create({
                    data: {
                        programId: ctx.programId,
                        customerId: ctx.customerId,
                        type: "TIER_UP",
                        metadata: { oldTier: customer.tierId, newTier: tier.id }
                    }
                })
            }
            break // Stop at highest matching tier
        }
    }

    if (newTierId !== customer.tierId) {
        await prisma.loyaltyCustomer.update({
            where: { id: customer.id },
            data: { tierId: newTierId }
        })
    }

    return { success: true, triggeredRewards, newTierId }
}
