'use server'

import { cookies } from "next/headers"
import { SignJWT, jwtVerify } from "jose"
import { prisma } from "@/lib/prisma"
import { randomUUID } from "node:crypto"

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'happymeter-super-secret-key-2024')
const GLOBAL_COOKIE_NAME = "hm_global_loyalty_session"

// -----------------------------------------------------------------------------
// Global Session Management
// -----------------------------------------------------------------------------

export async function createGlobalLoyaltySession(phone: string) {
    const token = await new SignJWT({ phone })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('30d') // 30 days
        .sign(JWT_SECRET)

    const cookieStore = await cookies()
    cookieStore.set(GLOBAL_COOKIE_NAME, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 30
    })

    return token
}

export async function getGlobalLoyaltySession() {
    const cookieStore = await cookies()
    const token = cookieStore.get(GLOBAL_COOKIE_NAME)?.value

    if (!token) return null

    try {
        const { payload } = await jwtVerify(token, JWT_SECRET)
        return payload as { phone: string }
    } catch (e) {
        return null
    }
}

export async function clearGlobalLoyaltySession() {
    const cookieStore = await cookies()
    cookieStore.delete(GLOBAL_COOKIE_NAME)
    return { success: true }
}

// -----------------------------------------------------------------------------
// Authentication Actions
// -----------------------------------------------------------------------------

export async function sendGlobalLoyaltyOtp(phone: string) {
    try {
        const safePhone = phone.replace(/\s/g, '').trim()
        if (!safePhone) return { success: false, error: "Teléfono inválido" }

        // Here you would integrate Twilio or WhatsApp API to send real OTP.
        // For now, we simulate sending an OTP or just allow direct login (Magic Flow).
        // Since we are building the Global App, let's just create the session directly 
        // as a prototype, or require an OTP if you have the infra.

        // *Prototype Shortcut*: Directly log them in. 
        // In production, generate a 6 digit pin, save to DB `UserOtp` table, and text it.

        await createGlobalLoyaltySession(safePhone)

        return { success: true }
    } catch (error) {
        console.error(error)
        return { success: false, error: "Error enviando código" }
    }
}

// -----------------------------------------------------------------------------
// Wallet & Ecosystem Actions
// -----------------------------------------------------------------------------

export async function getGlobalWallet() {
    const session = await getGlobalLoyaltySession()
    if (!session?.phone) return { success: false, error: "No autenticado" }

    try {
        // Fetch all LoyaltyCustomer records tied to this phone number
        const cards = await prisma.loyaltyCustomer.findMany({
            where: { phone: session.phone },
            include: {
                program: {
                    include: {
                        user: {
                            select: { subscriptionStatus: true, plan: true, logoUrl: true } // VITAL for blocking and fallback logo
                        }
                    }
                },
                tier: true
            },
            orderBy: { lastVisitDate: 'desc' }
        })

        return { success: true, cards, phone: session.phone }
    } catch (error) {
        console.error("Wallet Error:", error)
        return { success: false, error: "Error cargando la billetera" }
    }
}

export async function getCustomerForProgram(programId: string) {
    const session = await getGlobalLoyaltySession()
    if (!session?.phone) return { success: false, error: "No autenticado" }

    try {
        const customer = await prisma.loyaltyCustomer.findUnique({
            where: {
                programId_phone: {
                    programId,
                    phone: session.phone
                }
            },
            include: {
                program: {
                    include: {
                        rewards: { where: { isActive: true }, orderBy: { costInVisits: 'asc' } },
                        promotions: { where: { isActive: true } },
                        tiers: { orderBy: { order: 'asc' } },
                        user: { select: { subscriptionStatus: true, plan: true } }
                    }
                },
                redemptions: { include: { reward: true } },
                tier: true
            }
        })

        if (!customer) return { success: false, error: "Cliente no encontrado para este programa" }

        return { success: true, customer }
    } catch (error) {
        console.error("getCustomerForProgram error:", error)
        return { success: false, error: "Error cargando datos del programa" }
    }
}

export async function updateGlobalProfile(data: { name: string, email: string, birthday?: Date }) {
    const session = await getGlobalLoyaltySession()
    if (!session?.phone) return { success: false, error: "No autenticado" }

    try {
        // Update all specific profile cards with the new global data
        await prisma.loyaltyCustomer.updateMany({
            where: { phone: session.phone },
            data: {
                name: data.name,
                email: data.email,
                birthday: data.birthday
            }
        })

        return { success: true }
    } catch (error) {
        console.error("Profile Error:", error)
        return { success: false, error: "Error actualizando el perfil" }
    }
}

export async function joinProgram(loyaltyCode: string) {
    const session = await getGlobalLoyaltySession()
    if (!session?.phone) return { success: false, error: "No autenticado" }

    try {
        const cleanCode = loyaltyCode.trim()
        if (!cleanCode) return { success: false, error: "Código inválido" }

        // Find Program by ID or a future "Code" field
        const program = await prisma.loyaltyProgram.findUnique({
            where: { id: cleanCode }
        })

        if (!program) return { success: false, error: "Programa no encontrado" }

        // Check if already joined
        const existing = await prisma.loyaltyCustomer.findUnique({
            where: {
                programId_phone: {
                    programId: program.id,
                    phone: session.phone
                }
            }
        })

        if (existing) return { success: false, error: "Ya estás unido a este programa" }

        await prisma.loyaltyCustomer.create({
            data: {
                phone: session.phone,
                programId: program.id,
                joinDate: new Date(),
                magicToken: randomUUID() // Keep for legacy/QR support
            }
        })

        return { success: true }
    } catch (error) {
        console.error("Join Error:", error)
        return { success: false, error: "Error al unirse al programa" }
    }
}
