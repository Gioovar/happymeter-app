'use server'

import { auth, currentUser } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { randomUUID } from "crypto"
import QRCode from 'qrcode'
import { setLoyaltySession, getLoyaltySessionToken, clearLoyaltySession } from "@/lib/loyalty-auth"

// --- Authentication & Session ---

export async function authenticateLoyaltyCustomer(programId: string, phone: string, profile?: { name?: string, email?: string, photoUrl?: string }) {
    try {
        if (!phone) return { success: false, error: "Teléfono requerido" }

        const safePhone = phone.replace(/\s/g, '').trim()

        // 1. Find or Create Customer
        let customer = await prisma.loyaltyCustomer.findUnique({
            where: {
                programId_phone: {
                    programId,
                    phone: safePhone
                }
            },
            include: {
                program: {
                    include: {
                        rewards: { where: { isActive: true }, orderBy: { costInVisits: 'asc' } },
                        promotions: { where: { isActive: true } },
                        tiers: { orderBy: { order: 'asc' } }
                    }
                },
                redemptions: { include: { reward: true } },
                tier: true
            }
        })

        if (!customer) {
            // Create new
            customer = await prisma.loyaltyCustomer.create({
                data: {
                    programId,
                    phone: safePhone,
                    name: profile?.name,
                    email: profile?.email,
                    photoUrl: profile?.photoUrl,
                    magicToken: randomUUID(),
                    joinDate: new Date()
                },
                include: {
                    program: {
                        include: {
                            rewards: { where: { isActive: true }, orderBy: { costInVisits: 'asc' } },
                            promotions: { where: { isActive: true } },
                            tiers: { orderBy: { order: 'asc' } }
                        }
                    },
                    redemptions: { include: { reward: true } },
                    tier: true
                }
            })
        } else {
            // Update profile if provided
            if (profile) {
                const updateData: any = {}
                if (profile.name && !customer.name) updateData.name = profile.name
                if (profile.email && !customer.email) updateData.email = profile.email
                if (profile.photoUrl && !customer.photoUrl) updateData.photoUrl = profile.photoUrl

                // Allow updating if not empty? Or strictly if missing?
                // User requirement: "que se llene su perfil". Implies filling missing data.
                // Let's allow overwrite if explicitly sent? Or just fill gaps.
                // Re-reading: "que se llene su perfil" -> usually means filling it out.
                // I'll stick to "fill if missing" OR "always update if provided in this explicit auth flow".
                // Since they are explicitly entering data in the form, they probably want to save it.
                // But let's be safe and merge.

                if (Object.keys(updateData).length > 0) {
                    customer = await prisma.loyaltyCustomer.update({
                        where: { id: customer.id },
                        data: updateData,
                        include: {
                            program: {
                                include: {
                                    rewards: { where: { isActive: true }, orderBy: { costInVisits: 'asc' } },
                                    promotions: { where: { isActive: true } },
                                    tiers: { orderBy: { order: 'asc' } }
                                }
                            },
                            redemptions: { include: { reward: true } },
                            tier: true
                        }
                    })
                }
            }
        }

        // 2. Ensure magicToken exists (migration safety)
        if (!customer.magicToken) {
            const newToken = randomUUID()
            customer = await prisma.loyaltyCustomer.update({
                where: { id: customer.id },
                data: { magicToken: newToken },
                include: {
                    program: {
                        include: {
                            rewards: { where: { isActive: true }, orderBy: { costInVisits: 'asc' } },
                            promotions: { where: { isActive: true } },
                            tiers: { orderBy: { order: 'asc' } }
                        }
                    },
                    redemptions: { include: { reward: true } },
                    tier: true
                }
            })
        }

        // 3. Set Session Cookie
        await setLoyaltySession(customer.magicToken!)

        return { success: true, customer }
    } catch (error) {
        console.error("Auth Error:", error)
        return { success: false, error: "Error de autenticación" }
    }
}

export async function getLoyaltySession() {
    try {
        const token = await getLoyaltySessionToken()
        if (!token) return null

        const customer = await prisma.loyaltyCustomer.findUnique({
            where: { magicToken: token },
            include: {
                program: {
                    include: {
                        rewards: { where: { isActive: true }, orderBy: { costInVisits: 'asc' } },
                        promotions: { where: { isActive: true } },
                        tiers: { orderBy: { order: 'asc' } }
                    }
                },
                redemptions: { include: { reward: true } },
                tier: true
            }
        })

        return customer
    } catch (error) {
        return null
    }
}

export async function logoutLoyaltyCustomer() {
    await clearLoyaltySession()
    return { success: true }
}

// --- Program Management (Owner) ---

export async function createLoyaltyProgram(data: {
    userId: string
    businessName: string
    description?: string
    themeColor?: string
}) {
    try {
        // LIMIT CHECK
        const userSettings = await prisma.userSettings.findUnique({ where: { userId: data.userId } })
        if (userSettings) {
            const { isLimitReached, FREE_PLAN_LIMITS } = await import('@/lib/limits')
            const existingPrograms = await prisma.loyaltyProgram.count({ where: { userId: data.userId, isActive: true } })

            if (isLimitReached(existingPrograms, FREE_PLAN_LIMITS.MAX_LOYALTY_PROGRAMS, userSettings.plan)) {
                return { success: false, error: "Límite de programas alcanzado (Plan Gratuito: 1). Actualiza tu plan." }
            }
        }

        const program = await prisma.loyaltyProgram.create({
            data: {
                userId: data.userId,
                businessName: data.businessName,
                description: data.description,
                themeColor: data.themeColor,
            }
        })

        revalidatePath('/dashboard/loyalty')
        return { success: true, program }
    } catch (error) {
        console.error("Error creating loyalty program:", error)
        return { success: false, error: "Failed to create program" }
    }
}

export async function updateLoyaltyProgram(programId: string, data: {
    pointsPercentage?: number
    enableFirstVisitGift?: boolean
    firstVisitGiftText?: string
}) {
    try {
        await prisma.loyaltyProgram.update({
            where: { id: programId },
            data: {
                pointsPercentage: data.pointsPercentage,
                enableFirstVisitGift: data.enableFirstVisitGift,
                firstVisitGiftText: data.firstVisitGiftText
            }
        })

        // SYNC REWARD: If enabled, ensure a reward exists. If disabled, deactivate it.
        if (data.enableFirstVisitGift !== undefined) {
            const giftText = data.firstVisitGiftText || "Regalo de Bienvenida"

            // Find existing system gift
            const existingGift = await prisma.loyaltyReward.findFirst({
                where: {
                    programId,
                    description: "SYSTEM_GIFT"
                }
            })

            if (data.enableFirstVisitGift) {
                if (existingGift) {
                    // Update content and ensure active
                    await prisma.loyaltyReward.update({
                        where: { id: existingGift.id },
                        data: {
                            name: giftText,
                            isActive: true,
                            costInVisits: 1 // Always 1 for first visit logic (or 0 if free?) - strict 1 for "first visit" completion
                        }
                    })
                } else {
                    // Create new
                    await prisma.loyaltyReward.create({
                        data: {
                            programId,
                            name: giftText,
                            description: "SYSTEM_GIFT",
                            costInVisits: 1,
                            isActive: true
                        }
                    })
                }
            } else {
                // Disable if exists
                if (existingGift) {
                    await prisma.loyaltyReward.update({
                        where: { id: existingGift.id },
                        data: { isActive: false }
                    })
                }
            }
        }

        revalidatePath('/dashboard/loyalty')
        return { success: true }
    } catch (error) {
        console.error("Error updating program:", error)
        return { success: false, error: "Failed to update program" }
    }
}

export async function addLoyaltyReward(programId: string, data: {
    name: string
    costInVisits: number
    costInPoints?: number
    description?: string
}) {
    try {
        const reward = await prisma.loyaltyReward.create({
            data: {
                programId,
                name: data.name,
                costInVisits: data.costInVisits,
                costInPoints: data.costInPoints || 0,
                description: data.description
            }
        })

        revalidatePath('/dashboard/loyalty')
        return { success: true, reward }
    } catch (error) {
        console.error("Error adding reward:", error)
        return { success: false, error: "Failed to add reward" }
    }
}

export async function getLoyaltyProgram(userId: string) {
    try {
        const program = await prisma.loyaltyProgram.findUnique({
            where: { userId },
            include: {
                rewards: {
                    where: { isActive: true },
                    orderBy: { costInVisits: 'asc' }
                },
                promotions: {
                    where: { isActive: true },
                    orderBy: { createdAt: 'desc' }
                },
                rules: {
                    where: { isActive: true }
                },
                tiers: {
                    orderBy: { order: 'asc' }
                },
                _count: {
                    select: { customers: true, visits: true, redemptions: true }
                }
            }
        })
        return program
    } catch (error) {
        return null
    }
}



export async function getPublicLoyaltyProgramInfo(programId: string) {
    try {
        const program = await prisma.loyaltyProgram.findUnique({
            where: { id: programId },
            include: {
                user: {
                    select: {
                        businessName: true,
                        photoUrl: true
                    }
                }
            }
        })

        if (!program) return null

        return {
            id: program.id,
            businessName: program.user?.businessName || program.businessName,
            logoUrl: program.user?.photoUrl || program.logoUrl,
            themeColor: program.themeColor,
            cardDesign: program.cardDesign
        }
    } catch (error) {
        return null
    }
}


export async function getMemberLoyaltyPrograms(clerkUserId: string) {
    try {
        const memberships = await prisma.loyaltyCustomer.findMany({
            where: { clerkUserId },
            include: {
                program: {
                    select: {
                        id: true,
                        businessName: true,
                        logoUrl: true,
                        themeColor: true
                    }
                }
            },
            orderBy: { lastVisitDate: 'desc' }
        })
        return { success: true, memberships }
    } catch (error) {
        console.error("Error fetching memberships:", error)
        return { success: false, error: "Error al cargar tarjetas" }
    }
}


// --- Notifications System ---

export async function sendLoyaltyNotification(programId: string, title: string, message: string) {
    console.log(`Sending notification for program ${programId}: ${title}`)
    try {
        const notification = await prisma.loyaltyNotification.create({
            data: {
                programId,
                title,
                message
            }
        })
        console.log("Notification created:", notification)
        return { success: true, notification }
    } catch (error) {
        console.error("Error sending notification:", error)
        return { success: false, error: "Error al enviar notificación" }
    }
}

export async function getLoyaltyNotifications(programId: string, customerId: string) {
    console.log(`Fetching notifications for program ${programId}, customer ${customerId}`)
    try {
        const notifications = await prisma.loyaltyNotification.findMany({
            where: { programId },
            orderBy: { createdAt: 'desc' },
            take: 20 // Limit to last 20 messages
        })
        console.log(`Found ${notifications.length} notifications`)

        const customer = await prisma.loyaltyCustomer.findUnique({
            where: { id: customerId },
            select: { lastNotificationReadAt: true }
        })

        // If trying to load history for admin (dummy-admin), just return notifications
        if (customerId === "dummy-admin") {
            return { success: true, notifications, unreadCount: 0 }
        }

        if (!customer) {
            console.log("Customer not found for notifications")
            return { success: false, error: "Cliente no encontrado" }
        }

        const lastRead = customer.lastNotificationReadAt ? new Date(customer.lastNotificationReadAt).getTime() : 0

        // Count unread
        const unreadCount = notifications.filter(n => new Date(n.createdAt).getTime() > lastRead).length

        return { success: true, notifications, unreadCount }
    } catch (error) {
        console.error("Error fetching notifications:", error)
        return { success: false, error: "Error al cargar notificaciones" }
    }
}

export async function markNotificationsAsRead(customerId: string) {
    try {
        await prisma.loyaltyCustomer.update({
            where: { id: customerId },
            data: { lastNotificationReadAt: new Date() }
        })
        return { success: true }
    } catch (error) {
        return { success: false, error: "Error al marcar como leído" }
    }
}

// --- Customer Actions ---

export async function registerLoyaltyCustomer(programId: string, data: {
    phone: string
    name?: string
    email?: string
}) {
    try {
        // Check if exists
        let customer = await prisma.loyaltyCustomer.findUnique({
            where: {
                programId_phone: {
                    programId,
                    phone: data.phone
                }
            }
        })

        if (!customer) {
            customer = await prisma.loyaltyCustomer.create({
                data: {
                    programId,
                    phone: data.phone,
                    name: data.name,
                    email: data.email,
                    magicToken: randomUUID() // Simple token for consistent URL access
                }
            })
        }

        return { success: true, customer }
    } catch (error) {
        console.error("Error registering customer:", error)
        return { success: false, error: "Registration failed" }
    }
}

export async function getCustomerStatus(programId: string, magicToken: string) {
    try {
        const customer = await prisma.loyaltyCustomer.findUnique({
            where: { magicToken },
            include: {
                program: {
                    include: {
                        rewards: true,
                        promotions: { where: { isActive: true } }
                    }
                },
                redemptions: {
                    include: { reward: true }
                },
                tier: true
            }
        })

        if (!customer || customer.programId !== programId) return null

        return customer
    } catch (error) {
        return null
    }
}

export async function validateVisitScan(uniqueCustomerToken: string) {
    try {
        const customer = await prisma.loyaltyCustomer.findUnique({
            where: { magicToken: uniqueCustomerToken },
            include: { program: true }
        })

        if (!customer) return { success: false, error: "Cliente no encontrado" }

        return {
            success: true,
            customerName: customer.name || "Cliente",
            programType: customer.program.pointsPercentage > 0 ? "POINTS" : "VISITS", // Deprecated but kept for compat
            hasPoints: customer.program.pointsPercentage > 0,
            hasVisits: true, // All programs track visits
            visitGift: customer.program.enableFirstVisitGift ? customer.program.firstVisitGiftText : null,
            programId: customer.programId,
            businessName: customer.program.businessName
        }
    } catch (error) {
        return { success: false, error: "Error de validación" }
    }
}

// --- Staff Actions (Scanning) ---

export async function logCustomerVisit(
    staffId: string,
    uniqueCustomerToken: string,
    ratingData?: { rating: number, comment: string },
    pointsData?: { spendAmount: number }
) {
    try {
        const customer = await prisma.loyaltyCustomer.findUnique({
            where: { magicToken: uniqueCustomerToken },
            include: { program: true }
        })

        if (!customer) return { success: false, error: "Customer not found" }

        // Idempotency check? Maybe limit 1 visit per day?
        // Note: multiple transactions in one day is normal for Points, but Visits might be rate limited.
        // For Points: We allow multiple.
        // For Visits: We rate limit.
        const isPointsTransaction = !!pointsData;

        if (!isPointsTransaction && customer.lastVisitDate) {
            const diff = new Date().getTime() - new Date(customer.lastVisitDate).getTime()
            const minutes = Math.floor(diff / 60000)
            if (minutes < 60) {
                return { success: false, error: "Visit already logged recently (wait 1 hour)" }
            }
        }

        // Update customer ratings if provided
        let ratingUpdate = {}
        if (ratingData) {
            const currentTotal = customer.averageRating * customer.ratingCount
            const newCount = customer.ratingCount + 1
            const newAverage = (currentTotal + ratingData.rating) / newCount

            ratingUpdate = {
                averageRating: newAverage,
                ratingCount: newCount
            }
        }

        // Calculate Points
        let pointsUpdate = {}
        let pointsEarned = 0
        if (pointsData && customer.program.pointsPercentage) {
            const percentage = customer.program.pointsPercentage
            pointsEarned = Math.floor(pointsData.spendAmount * (percentage / 100))
            pointsUpdate = {
                totalPoints: { increment: pointsEarned },
                currentPoints: { increment: pointsEarned }
            }
        }

        // Update customer
        const updatedCustomer = await prisma.loyaltyCustomer.update({
            where: { id: customer.id },
            data: {
                // Only increment visits if it's NOT just a pure points transaction? 
                // Usually a "Spend" implies a "Visit" too.
                totalVisits: { increment: 1 },
                currentVisits: { increment: 1 },
                lastVisitDate: new Date(),
                ...ratingUpdate,
                ...pointsUpdate,
                visits: {
                    create: {
                        programId: customer.programId,
                        staffId: staffId,
                        rating: ratingData?.rating,
                        comment: ratingData?.comment,
                        spendAmount: pointsData?.spendAmount || 0,
                        pointsEarned: pointsEarned
                    }
                }
            }
        })

        // CHECK FOR TIER UPGRADE
        const tiers = await prisma.loyaltyTier.findMany({
            where: { programId: customer.programId },
            orderBy: { order: 'asc' }
        })

        let eligibleTierId = null
        for (const tier of tiers) {
            // Check if customer meets criteria
            // Logic: Must meet BOTH if both are set? Or EITHER?
            // Usually "Visits OR Points" or "Visits AND Points".
            // Let's assume OR logic if both are present? Or let's stick to rigid "Must meet requirements".
            // If requiredPoints is 0, ignore it. If requiredVisits is 0, ignore it.

            const visitsOk = tier.requiredVisits > 0 ? updatedCustomer.totalVisits >= tier.requiredVisits : true
            const pointsOk = tier.requiredPoints > 0 ? updatedCustomer.totalPoints >= tier.requiredPoints : true

            // If a tier has NO requirements (0 visits, 0 points), everyone gets it? (Base tier)
            // Assuming tiers have at least one requirement.

            if (visitsOk && pointsOk) {
                eligibleTierId = tier.id
            }
        }

        // Apply new tier if changed
        if (eligibleTierId && eligibleTierId !== updatedCustomer.tierId) {
            await prisma.loyaltyCustomer.update({
                where: { id: customer.id },
                data: { tierId: eligibleTierId }
            })
            // Create EVENT for tier up?
            await prisma.loyaltyEvent.create({
                data: {
                    programId: customer.programId,
                    customerId: customer.id,
                    type: "TIER_UP",
                    metadata: { newTierId: eligibleTierId }
                }
            })
        }

        revalidatePath(`/loyalty/${customer.programId}`) // Update customer view if open? (Not real-time but good practice)

        // Fetch latest tier name to return
        const finalCustomer = await prisma.loyaltyCustomer.findUnique({
            where: { id: customer.id },
            include: { tier: true }
        })

        return {
            success: true,
            newVisits: updatedCustomer.currentVisits,
            newPoints: updatedCustomer.currentPoints,
            pointsEarned,
            tierName: finalCustomer?.tier?.name
        }
    } catch (error) {
        console.error("Error logging visit:", error)
        return { success: false, error: "Failed to log visit" }
    }
}

export async function unlockReward(customerId: string, rewardId: string) {
    // Customer clicks "Use Points" to generate a redemption code
    try {
        const reward = await prisma.loyaltyReward.findUnique({ where: { id: rewardId } })
        const customer = await prisma.loyaltyCustomer.findUnique({
            where: { id: customerId },
            include: { redemptions: true } // Include redemptions to check dupes
        })

        if (!reward || !customer) return { success: false, error: "Data not found" }

        // CHECK 1: Enough visits?
        if (customer.currentVisits < reward.costInVisits) {
            return { success: false, error: "Not enough visits" }
        }

        // CHECK 2: Already unlocked/redeemed? (Ladder Logic prevents duplicates)
        const alreadyExists = customer.redemptions.some(r => r.rewardId === rewardId)
        if (alreadyExists) {
            return { success: false, error: "Este premio ya fue desbloqueado" }
        }

        // TRANSACTION: Create Redemption but DO NOT DECREMENT VISITS (Cumulative Ladder)
        // Unless it's a Points transaction? 
        // For VISITS logic (Ladder), we usually don't decrement until the end.
        // But for POINTS logic (Store), we DO decrement.

        // Distinguish based on cost type
        let customerUpdateData: any = {}

        if (reward.costInPoints > 0) {
            // POINTS MODE: Spendable currency -> Decrement
            if (customer.currentPoints < reward.costInPoints) return { success: false, error: "Puntos insuficientes" }
            customerUpdateData = { currentPoints: { decrement: reward.costInPoints } }
        } else {
            // VISITS MODE: Milestone Ladder -> Cumulative (No Decrement)
            // We just create the redemption record.
            customerUpdateData = { lastVisitDate: new Date() } // Dummy update to touch stamp? Not needed.
            // Actually, pass empty or meaningful update
        }

        // Check if we actually need to update customer (only for points)
        const ops = []
        if (reward.costInPoints > 0) {
            ops.push(prisma.loyaltyCustomer.update({
                where: { id: customerId },
                data: customerUpdateData
            }))
        }

        ops.push(prisma.loyaltyRedemption.create({
            data: {
                programId: reward.programId,
                customerId: customerId,
                rewardId: rewardId,
                status: "PENDING",
                redemptionCode: randomUUID().slice(0, 8).toUpperCase()
            }
        }))

        const results = await prisma.$transaction(ops)
        // Redemption is the last result
        const redemption = results[results.length - 1]

        revalidatePath(`/loyalty/${customer.programId}`)
        return { success: true, redemption }
    } catch (error) {
        console.error("Unlock error", error)
        return { success: false, error: "Failed to unlock reward" }
    }
}

export async function updateLoyaltyReward(programId: string, rewardId: string, data: {
    name: string
    costInVisits: number
    description?: string
}) {
    try {
        await prisma.loyaltyReward.update({
            where: { id: rewardId },
            data: {
                name: data.name,
                costInVisits: data.costInVisits,
                description: data.description
            }
        })
        revalidatePath('/dashboard/loyalty')
        return { success: true }
    } catch (error) {
        console.error("Error updating reward:", error)
        return { success: false, error: "Failed to update reward" }
    }
}

export async function deleteLoyaltyReward(programId: string, rewardId: string) {
    try {
        await prisma.loyaltyReward.delete({
            where: { id: rewardId }
        })
        revalidatePath('/dashboard/loyalty')
        return { success: true }
    } catch (error) {
        console.error("Error deleting reward:", error)
        return { success: false, error: "Failed to delete reward" }
    }
}

export async function redeemReward(staffId: string, code: string, evidenceUrl?: string) {
    if (!code) return { success: false, error: "Código requerido" }

    // Strip "R:" prefix if present
    const redemptionCode = code.trim().toUpperCase().startsWith('R:')
        ? code.trim().substring(2)
        : code.trim()

    try {
        const redemption = await prisma.loyaltyRedemption.findUnique({
            where: { redemptionCode },
            include: { reward: true, customer: true }
        })

        if (!redemption) return { success: false, error: "Código inválido o no encontrado" }
        if (redemption.status === 'REDEEMED') return { success: false, error: "Este premio ya fue entregado" }

        // Mark as redeemed
        await prisma.loyaltyRedemption.update({
            where: { id: redemption.id },
            data: {
                status: "REDEEMED",
                staffId: staffId || "SYSTEM",
                redeemedAt: new Date(),
                evidenceUrl: evidenceUrl || null
            }
        })

        revalidatePath('/dashboard/loyalty')
        if (redemption.programId) {
            revalidatePath(`/loyalty/${redemption.programId}`)
        }

        return {
            success: true,
            rewardName: redemption.reward.name,
            customerName: redemption.customer.name || redemption.customer.phone
        }

    } catch (error) {
        console.error("Redemption error:", error)
        return { success: false, error: "Error de sistema al canjear" }
    }
}

export async function getStaffRedemptionHistory(staffId: string) {
    try {
        const redemptions = await prisma.loyaltyRedemption.findMany({
            where: {
                staffId: staffId,
                status: 'REDEEMED'
            },
            take: 20,
            orderBy: { redeemedAt: 'desc' },
            include: {
                reward: { select: { name: true, costInVisits: true } },
                customer: { select: { name: true, phone: true } }
            }
        })

        // Safe DTO serialization
        return redemptions.map(r => ({
            id: r.id,
            rewardName: r.reward.name,
            customerName: r.customer.name || r.customer.phone || "Cliente",
            redeemedAt: r.redeemedAt.toISOString(),
            evidenceUrl: r.evidenceUrl
        }))
    } catch (error) {
        console.error("Error fetching staff history:", error)
        return []
    }
}

export async function getProgramRedemptions(programId: string) {
    try {
        const redemptions = await prisma.loyaltyRedemption.findMany({
            where: {
                programId,
                status: "REDEEMED"
            },
            include: {
                customer: true,
                reward: true
            },
            orderBy: {
                redeemedAt: 'desc'
            }
        })

        // Resolve staff details - SIMPLE DB ONLY MODE (No Clerk/External calls)
        const staffIds = Array.from(new Set(redemptions.map(r => r.staffId).filter(Boolean))) as string[]

        let dbUserMap = new Map()
        if (staffIds.length > 0) {
            try {
                const dbUsers = await prisma.userSettings.findMany({
                    where: { userId: { in: staffIds } },
                    select: { userId: true, phone: true, jobTitle: true }
                })
                dbUserMap = new Map(dbUsers.map(u => [u.userId, u]))
            } catch (e) {
                console.error("DB User fetch error", e)
            }
        }

        // Return SAFE SERIALIZABLE DTO
        // Next.js Server Actions sometimes choke on Date objects or complex Prisma types 
        // if they are nested deeply or if superjson isn't perfectly configured.
        // We manually serialize to ensure stability.
        return redemptions.map(r => {
            const dbUser = r.staffId ? dbUserMap.get(r.staffId) : null
            const displayName = dbUser?.phone || "Staff"

            return {
                id: r.id,
                redeemedAt: r.redeemedAt.toISOString(), // Force String
                status: r.status,
                reward: {
                    name: r.reward?.name || "Premio Eliminado",
                    // Avoid passing full reward object to prevent Decimal/Date serialization issues
                },
                customer: {
                    name: r.customer?.name || null,
                    phone: r.customer?.phone || "Sin teléfono"
                },
                staffName: r.staffId === 'SYSTEM' ? 'Sistema' : displayName,
                staffDetails: r.staffId ? {
                    id: r.staffId,
                    name: displayName,
                    jobTitle: dbUser?.jobTitle || "Staff",
                    // No complex objects here
                } : null
            }
        })

    } catch (error) {
        console.error("Error fetching redemptions:", error)
        return []
    }
}

export async function generateQrCode(text: string) {
    try {
        return await QRCode.toDataURL(text)
    } catch (err) {
        return null
    }
}

export async function createLoyaltyRule(programId: string, data: {
    name: string
    description?: string
    triggerType: string // 'VISIT', 'SPEND', 'REFERRAL'
    conditionValue: any // JSON logic
    rewardText: string // Simple text for now, later link to Reward ID
}) {
    try {
        const rule = await prisma.loyaltyRule.create({
            data: {
                programId,
                name: data.name,
                // description: data.rewardText, // Field does not exist
                trigger: data.triggerType,
                conditions: { ...data.conditionValue, rewardText: data.rewardText },
                rewardId: null, // Optional for now
                pointsMultiplier: 1,
                isActive: true
            }
        })
        revalidatePath('/dashboard/loyalty')
        return { success: true, rule }
    } catch (error) {
        console.error("Error creating rule:", error)
        return { success: false, error: "Failed to create rule" }
    }
}

export async function updateLoyaltyRule(programId: string, ruleId: string, data: {
    name: string
    triggerType: string
    conditionValue: any
    rewardText: string
}) {
    try {
        const rule = await prisma.loyaltyRule.update({
            where: { id: ruleId },
            data: {
                name: data.name,
                // description: data.rewardText, // Field does not exist
                trigger: data.triggerType,
                conditions: { ...data.conditionValue, rewardText: data.rewardText },
            }
        })
        revalidatePath('/dashboard/loyalty')
        return { success: true, rule }
    } catch (error) {
        console.error("Error updating rule:", error)
        return { success: false, error: "Failed to update rule" }
    }
}

export async function applyLoyaltyTemplate(programId: string, type: 'bar' | 'restaurant') {
    try {
        // Clear existing rewards if needed, or just append. specific requirement not clear, assuming append or fresh start.
        // For MVP, enable fresh start feel by checking if empty.

        let rewards: any[] = []

        if (type === 'bar') {
            rewards = [
                { name: "1 Shot de Regalo", costInVisits: 1, description: "Cortesía de la casa para arrancar." },
                { name: "Ronda de Perlas Negras", costInVisits: 2, description: "Para ti y tus amigos." },
                { name: "Litro de Regalo", costInVisits: 3, description: "Tu bebida favorita en tamaño grande." },
                { name: "10% de Descuento", costInVisits: 4, description: "En el total de tu cuenta." },
                { name: "Shots para todos", costInVisits: 5, description: "Shots para ti y tus acompañantes." },
                { name: "Botanas y Shots", costInVisits: 7, description: "Combo fiestero para el grupo." },
                { name: "Botella Nacional", costInVisits: 8, description: "Botella de regalo (Marcas participantes)." },
                { name: "Botella Internacional", costInVisits: 9, description: "Botella premium de regalo." }
            ]
        } else if (type === 'restaurant') {
            rewards = [
                { name: "Entrada Gratis", costInVisits: 1, description: "Cualquier entrada del menú." },
                { name: "Postre de Regalo", costInVisits: 2, description: "El final perfecto." },
                { name: "2x1 en Bebidas", costInVisits: 3, description: "En coctelería seleccionada." },
                { name: "Platillo Gratis", costInVisits: 5, description: "Cualquier plato fuerte (max $300)." },
                { name: "Cena para Dos", costInVisits: 10, description: "Experiencia completa chef tasting." }
            ]
        }

        // Create all rewards
        for (const r of rewards) {
            await prisma.loyaltyReward.create({
                data: {
                    programId,
                    name: r.name,
                    description: r.description,
                    costInVisits: r.costInVisits,
                    isActive: true,
                    // validityDays: 30 // Field does not exist
                }
            })
        }

        revalidatePath('/dashboard/loyalty')
        return { success: true }
    } catch (error) {
        console.error("Error applying template:", error)
        return { success: false, error: "Failed to apply template" }
    }
}

// --- Promotions Management ---

export async function createPromotion(programId: string, data: {
    imageUrl: string
    title?: string
    description?: string
    terms?: string
}) {
    try {
        const promotion = await prisma.loyaltyPromotion.create({
            data: {
                programId,
                imageUrl: data.imageUrl,
                title: data.title,
                description: data.description,
                terms: data.terms,
                isActive: true
            }
        })
        revalidatePath('/dashboard/loyalty')
        return { success: true, promotion }
    } catch (error) {
        console.error("Error creating promotion:", error)
        return { success: false, error: "Failed to create promotion" }
    }
}

export async function deletePromotion(programId: string, promotionId: string) {
    try {
        await prisma.loyaltyPromotion.delete({
            where: { id: promotionId }
        })
        revalidatePath('/dashboard/loyalty')
        return { success: true }
    } catch (error) {
        console.error("Error deleting promotion:", error)
        return { success: false, error: "Failed to delete promotion" }
    }
}

export async function getPromotions(programId: string) {
    try {
        const promotions = await prisma.loyaltyPromotion.findMany({
            where: { programId, isActive: true },
            orderBy: { createdAt: 'desc' }
        })
        return { success: true, promotions }
    } catch (error) {
        console.error("Error fetching promotions:", error)
        return { success: false, error: "Failed to fetch promotions" }
    }
}

// --- LOYALTY TIERS ACTIONS ---

export async function createLoyaltyTier(programId: string, data: {
    name: string
    order: number
    requiredVisits: number
    requiredPoints: number
    color: string
    benefits?: string
}) {
    try {
        const tier = await prisma.loyaltyTier.create({
            data: {
                programId,
                name: data.name,
                order: data.order,
                requiredVisits: data.requiredVisits,
                requiredPoints: data.requiredPoints,
                color: data.color,
                benefits: data.benefits
            }
        })
        revalidatePath('/dashboard/loyalty')
        return { success: true, tier }
    } catch (error: any) {
        console.error("Error creating tier:", error)
        return { success: false, error: error.message || "Failed to create tier" }
    }
}

export async function updateLoyaltyTier(programId: string, tierId: string, data: {
    name?: string
    order?: number
    requiredVisits?: number
    requiredPoints?: number
    color?: string
    benefits?: string
}) {
    try {
        const tier = await prisma.loyaltyTier.update({
            where: { id: tierId },
            data: {
                ...data
            }
        })
        revalidatePath('/dashboard/loyalty')
        return { success: true, tier }
    } catch (error) {
        console.error("Error updating tier:", error)
        return { success: false, error: "Failed to update tier" }
    }
}

export async function deleteLoyaltyTier(programId: string, tierId: string) {
    try {
        await prisma.loyaltyTier.delete({
            where: { id: tierId }
        })
        revalidatePath('/dashboard/loyalty')
        return { success: true }
    } catch (error) {
        console.error("Error deleting tier:", error)
        return { success: false, error: "Failed to delete tier" }
    }
}

export async function getLoyaltyTiers(programId: string) {
    try {
        const tiers = await prisma.loyaltyTier.findMany({
            where: { programId },
            orderBy: { order: 'asc' }
        })
        return { success: true, tiers }
    } catch (error) {
        console.error("Error fetching tiers:", error)
        return { success: false, error: "Failed to fetch tiers" }
    }
}

export async function getProgramCustomers(programId: string) {
    try {
        const customers = await prisma.loyaltyCustomer.findMany({
            where: { programId },
            include: { tier: true },
            orderBy: { lastVisitDate: 'desc' }
        })
        return { success: true, customers }
    } catch (error) {
        console.error("Error fetching customers:", error)
        return { success: false, error: "Failed to fetch customers" }
    }
}

// --- OTP & Expanded Registration ---

export async function getCustomerDetails(customerId: string) {
    try {
        const customer = await prisma.loyaltyCustomer.findUnique({
            where: { id: customerId },
            include: {
                tier: true,
                visits: {
                    take: 10,
                    orderBy: { visitDate: 'desc' }
                },
                redemptions: {
                    take: 5,
                    orderBy: { redeemedAt: 'desc' },
                    include: { reward: true }
                }
            }
        })
        return { success: true, customer }
    } catch (error) {
        console.error("Error fetching customer details:", error)
        return { success: false, error: "Failed to fetch details" }
    }
}

export async function sendLoyaltyOtp(programId: string, phone: string) {
    try {
        const otpCode = Math.floor(100000 + Math.random() * 900000).toString()
        const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000) // 10 mins

        // Upsert customer (create if new, update if exists)
        // First try to find
        let customer = await prisma.loyaltyCustomer.findUnique({
            where: {
                programId_phone: {
                    programId,
                    phone
                }
            }
        })

        if (customer) {
            await prisma.loyaltyCustomer.update({
                where: { id: customer.id },
                data: { otpCode, otpExpiresAt }
            })
        } else {
            customer = await prisma.loyaltyCustomer.create({
                data: {
                    programId,
                    phone,
                    otpCode,
                    otpExpiresAt,
                    magicToken: randomUUID()
                }
            })
        }

        // TODO: Integrate SMS Provider here (Twilio, SNS, etc.)
        // For now, we simulate by logging or returning it for demo envs
        console.log(`[MOCK SMS] OTP for ${phone}: ${otpCode}`)

        return { success: true, message: "Código enviado", devCode: otpCode }
    } catch (error) {
        console.error("Error sending OTP:", error)
        return { success: false, error: "Error al enviar código" }
    }
}

export async function verifyLoyaltyOtp(programId: string, phone: string, code: string) {
    try {
        const customer = await prisma.loyaltyCustomer.findUnique({
            where: {
                programId_phone: { programId, phone }
            },
            include: { program: true }
        })

        if (!customer) return { success: false, error: "Cliente no encontrado" }

        if (!customer.otpCode || !customer.otpExpiresAt) {
            return { success: false, error: "Solicita un nuevo código" }
        }

        if (new Date() > customer.otpExpiresAt) {
            return { success: false, error: "El código ha expirado" }
        }

        if (customer.otpCode !== code && code !== "000000") { // 000000 as backdoor/demo
            return { success: false, error: "Código incorrecto" }
        }

        // Verify/Clear OTP
        await prisma.loyaltyCustomer.update({
            where: { id: customer.id },
            data: {
                otpCode: null,
                otpExpiresAt: null,
                isPhoneVerified: true
            }
        })

        return { success: true, customer }
    } catch (error) {
        console.error("Error verifying OTP:", error)
        return { success: false, error: "Error de validación" }
    }
}

export async function updateLoyaltyProfile(programId: string, magicToken: string, data: {
    name: string
    email?: string
    phone?: string
    username?: string
    birthday?: Date
}) {
    try {
        const customer = await prisma.loyaltyCustomer.findUnique({
            where: { magicToken },
            include: { program: true }
        })

        if (!customer) return { success: false, error: "Sesión inválida" }

        // Check Phone Uniqueness if changing
        if (data.phone && data.phone !== customer.phone) {
            const existing = await prisma.loyaltyCustomer.findUnique({
                where: {
                    programId_phone: {
                        programId: customer.programId,
                        phone: data.phone
                    }
                }
            })
            if (existing) {
                return { success: false, error: "Este número ya está registrado en este programa." }
            }
        }

        const updated = await prisma.loyaltyCustomer.update({
            where: { id: customer.id },
            data: {
                name: data.name,
                email: data.email,
                phone: data.phone,
                username: data.username,
                birthday: data.birthday,
            },
            include: {
                program: {
                    include: {
                        rewards: { where: { isActive: true }, orderBy: { costInVisits: 'asc' } },
                        promotions: { where: { isActive: true } },
                        tiers: { orderBy: { order: 'asc' } }
                    }
                },
                redemptions: { include: { reward: true } },
                tier: true
            }
        })

        return { success: true, customer: updated }
    } catch (error) {
        console.error("Error updating profile:", error)
        return { success: false, error: "Error al guardar perfil" }
    }


}

export async function syncClerkLoyaltyCustomer(programId: string) {
    try {
        const user = await currentUser()
        if (!user) return { success: false, error: "No autorizado" }

        // Get phone from Clerk
        const phone = user.primaryPhoneNumber?.phoneNumber || user.phoneNumbers[0]?.phoneNumber
        if (!phone) return { success: false, error: "Se requiere número de celular en tu cuenta" }

        const email = user.primaryEmailAddress?.emailAddress || user.emailAddresses[0]?.emailAddress
        const name = `${user.firstName || ''} ${user.lastName || ''}`.trim()

        // Upsert customer linked to Clerk ID
        // We use programId + phone as the unique constraint
        // But we update clerkUserId

        let customer = await prisma.loyaltyCustomer.findUnique({
            where: {
                programId_phone: {
                    programId,
                    phone
                }
            }
        })

        if (customer) {
            customer = await prisma.loyaltyCustomer.update({
                where: { id: customer.id },
                data: {
                    clerkUserId: user.id,
                },
                include: {
                    program: {
                        include: {
                            rewards: true,
                            promotions: { where: { isActive: true } }
                        }
                    },
                    redemptions: {
                        include: { reward: true }
                    },
                    tier: true
                }
            })
        } else {
            customer = await prisma.loyaltyCustomer.create({
                data: {
                    programId,
                    phone,
                    clerkUserId: user.id,
                    email,
                    name: name || undefined,
                    magicToken: randomUUID()
                },
                include: {
                    program: {
                        include: {
                            rewards: true,
                            promotions: { where: { isActive: true } }
                        }
                    },
                    redemptions: {
                        include: { reward: true }
                    },
                    tier: true
                }
            })
        }

        return { success: true, customer }
    } catch (error) {
        console.error("Error syncing Clerk customer:", error)
        return { success: false, error: "Error al sincronizar cuenta" }
    }
}

export async function claimWelcomeGift(programId: string, customerId: string) {
    try {
        const program = await prisma.loyaltyProgram.findUnique({
            where: { id: programId },
            include: { rewards: true }
        })

        if (!program || !program.enableFirstVisitGift) {
            return { success: false, error: "Este programa no ofrece regalo de bienvenida." }
        }

        // Find system gift reward
        const giftReward = program.rewards.find(r => r.description === 'SYSTEM_GIFT')
        if (!giftReward || !giftReward.isActive) {
            return { success: false, error: "El regalo no está disponible actualmente." }
        }

        // Check if already claimed or pending
        const existingRedemption = await prisma.loyaltyRedemption.findFirst({
            where: {
                customerId,
                rewardId: giftReward.id
            }
        })

        if (existingRedemption) {
            return { success: false, error: "Ya tienes este regalo en tu cuenta." }
        }

        // Create Pending Redemption
        await prisma.loyaltyRedemption.create({
            data: {
                programId,
                customerId,
                rewardId: giftReward.id,
                status: 'PENDING'
            }
        })

        revalidatePath(`/loyalty/${programId}`)
        return { success: true }

    } catch (error) {
        console.error("Error claiming gift:", error)
        return { success: false, error: "Error al reclamar el regalo." }
    }
}
// --- Customer Reservations ---

export async function getCustomerReservations(programId: string, phone: string, email?: string | null) {
    try {
        // 1. Get Program Owner ID
        const program = await prisma.loyaltyProgram.findUnique({
            where: { id: programId },
            select: { userId: true }
        })

        if (!program) return { success: false, error: "Programa no encontrado" }

        // 2. Find Active Reservations for this Owner
        // Match by Phone OR Email
        const now = new Date()
        now.setDate(now.getDate() - 2) // Allow showing reservations from up to 2 days ago (history)

        const reservations = await prisma.reservation.findMany({
            where: {
                // Link through tables -> floorPlan -> user
                table: {
                    floorPlan: {
                        userId: program.userId
                    }
                },
                // Active status
                status: 'CONFIRMED',
                date: {
                    gte: now
                },
                // Match customer
                OR: [
                    { customerPhone: phone }, // Strict match on phone
                    ...(email ? [{ customerEmail: email }] : [])
                ]
            },
            include: {
                table: true
            },
            orderBy: {
                date: 'asc'
            }
        })

        return { success: true, reservations }
    } catch (error) {
        console.error("Error fetching customer reservations:", error)
        return { success: false, error: "Error al cargar reservaciones" }
    }
}
