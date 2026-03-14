"use server"

import { auth } from "@clerk/nextjs/server"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { PromoterCommissionType } from "@prisma/client"
import { sendSMS } from "@/lib/sms"
import { DEFAULT_SENDER } from "@/lib/email"
import { resend } from "@/lib/resend"
import { sendPushNotificationToRP } from "@/lib/push-service"

export async function createGlobalPromoterSession(phone: string) {
    const cookieStore = await cookies();
    cookieStore.set('rps_global_session', phone, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 30, // 30 days
        path: '/rps'
    });
    return { success: true };
}

export async function logoutGlobalPromoter() {
    const cookieStore = await cookies();
    cookieStore.delete('rps_global_session');
    redirect('/rps');
}

export async function createPromoter(data: {
    name: string
    phone?: string
    email?: string
    commissionType: PromoterCommissionType
    commissionValue: number
    branchId?: string
    slug: string
}) {
    try {
        const { userId: ownerId } = await auth()
        if (!ownerId) return { success: false, error: "No autorizado" }

        // Check if slug is unique
        const existing = await prisma.promoterProfile.findUnique({
            where: { slug: data.slug }
        })

        if (existing) return { success: false, error: "El código/link ya existe" }

        const promoter = await prisma.promoterProfile.create({
            data: {
                ...data,
                businessId: ownerId,
            }
        })

        if (data.email) {
            await sendPromoterNotification(promoter.id, 'email')
        } else if (data.phone) {
            await sendPromoterNotification(promoter.id, 'sms')
        }

        revalidatePath('/dashboard/[branchSlug]/reservations/rps', 'page')
        return { success: true, promoter }
    } catch (error) {
        console.error("Error creating promoter:", error)
        return { success: false, error: "Error al crear promotor" }
    }
}

export async function getPromoters(userIdOverride?: string) {
    try {
        const { userId: authUserId } = await auth()
        if (!authUserId) return { success: false, promoters: [] }

        const targetUserId = userIdOverride || authUserId

        const promoters = await prisma.promoterProfile.findMany({
            where: {
                businessId: targetUserId
            },
            include: {
                _count: {
                    select: { reservations: true }
                },
                reservations: {
                    select: {
                        status: true,
                        partySize: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        })

        return { success: true, promoters }
    } catch (error) {
        console.error("Error fetching promoters:", error)
        return { success: false, promoters: [] }
    }
}

export async function deletePromoter(id: string) {
    try {
        const { userId: ownerId } = await auth()
        if (!ownerId) return { success: false, error: "No autorizado" }

        await prisma.promoterProfile.delete({
            where: { id, businessId: ownerId }
        })

        revalidatePath('/dashboard/[branchSlug]/reservations/rps', 'page')
        return { success: true }
    } catch (error) {
        console.error("Error deleting promoter:", error)
        return { success: false, error: "Error al eliminar promotor" }
    }
}

export async function updatePromoter(id: string, data: any) {
    try {
        const { userId: ownerId } = await auth()
        if (!ownerId) return { success: false, error: "No autorizado" }

        await prisma.promoterProfile.update({
            where: { id, businessId: ownerId },
            data
        })

        revalidatePath('/dashboard/[branchSlug]/reservations/rps', 'page')
        return { success: true }
    } catch (error) {
        console.error("Error updating promoter:", error)
        return { success: false, error: "Error al actualizar promotor" }
    }
}

export async function getPromoterAnalytics(promoterId?: string, dateRange?: { from: Date, to: Date }) {
    try {
        const { userId: ownerId } = await auth()
        if (!ownerId) return { success: false, stats: null }

        const where: any = {
            promoter: { businessId: ownerId }
        }

        if (promoterId) {
            where.promoterId = promoterId
        }

        if (dateRange) {
            where.date = {
                gte: dateRange.from,
                lte: dateRange.to
            }
        }

        const reservations = await prisma.reservation.findMany({
            where,
            include: { promoter: true }
        })

        const stats = {
            totalReservations: reservations.length,
            confirmedAttendees: reservations
                .filter(r => r.status === 'CONFIRMED' || r.status === 'CHECKED_IN')
                .reduce((sum, r) => sum + r.partySize, 0),
            noShows: reservations.filter(r => r.status === 'NO_SHOW').length,
            revenue: 0, // Assume 0 if no price linked yet, or calculate if available
            conversionRate: reservations.length > 0
                ? (reservations.filter(r => r.status === 'CHECKED_IN').length / reservations.length) * 100
                : 0,
            guestTypes: {
                new: reservations.filter(r => (r as any).guestType === 'NEW').length,
                returning: reservations.filter(r => (r as any).guestType === 'RETURNING').length,
                vip: reservations.filter(r => (r as any).guestType === 'VIP').length,
            }
        }

        return { success: true, stats }
    } catch (error) {
        console.error("Error fetching promoter analytics:", error)
        return { success: false, stats: null }
    }
}

export async function createSettlement(data: {
    promoterId: string
    amount: number
    startDate: Date
    endDate: Date
    notes?: string
}) {
    try {
        const { userId: ownerId } = await auth()
        if (!ownerId) return { success: false, error: "No autorizado" }

        const settlement = await prisma.promoterSettlement.create({
            data: {
                ...data,
                status: 'PENDING'
            }
        })

        revalidatePath(`/dashboard/[branchSlug]/reservations/rps/[promoterId]`, 'page')
        return { success: true, settlement }
    } catch (error) {
        console.error("Error creating settlement:", error)
        return { success: false, error: "Error al crear liquidación" }
    }
}

export async function markSettlementAsPaid(id: string) {
    try {
        const { userId: ownerId } = await auth()
        if (!ownerId) return { success: false, error: "No autorizado" }

        await prisma.promoterSettlement.update({
            where: { id },
            data: {
                status: 'PAID',
                paidAt: new Date()
            }
        })

        revalidatePath(`/dashboard/[branchSlug]/reservations/rps`, 'page')
        return { success: true }
    } catch (error) {
        console.error("Error marking settlement as paid:", error)
        return { success: false, error: "Error al actualizar liquidación" }
    }
}

export async function getPromoterSettlements(promoterId: string) {
    try {
        const settlements = await prisma.promoterSettlement.findMany({
            where: { promoterId },
            orderBy: { createdAt: 'desc' }
        })

        return { success: true, settlements }
    } catch (error) {
        console.error("Error fetching settlements:", error)
        return { success: false, settlements: [] }
    }
}

export async function sendPromoterNotification(promoterId: string, type: 'sms' | 'email') {
    try {
        const { userId: ownerId } = await auth()
        if (!ownerId) return { success: false, error: "No autorizado" }

        const promoter = await prisma.promoterProfile.findUnique({
            where: { id: promoterId, businessId: ownerId },
            include: { business: true }
        })

        if (!promoter) return { success: false, error: "Promotor no encontrado" }

        // Fetch Loyalty Program ID for the referral link
        const loyaltyProgram = await prisma.loyaltyProgram.findFirst({
            where: { userId: ownerId }
        })

        if (!loyaltyProgram) return { success: false, error: "No se encontró un programa de reservaciones activo" }

        const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.happymeters.com'
        const portalLink = `${appUrl}/rps/${promoter.slug}`
        const generalPortalLink = `${appUrl}/rps`
        const businessName = promoter.business?.businessName || 'nuestro negocio'

        if (type === 'sms') {
            if (!promoter.phone) return { success: false, error: "El promotor no tiene teléfono registrado" }
            const message = `Hola ${promoter.name}, has sido invitado como RP en ${businessName}. Entra a ${generalPortalLink} con tu número de teléfono para crear tu perfil y PIN de acceso.`
            return await sendSMS(promoter.phone, message)
        } else {
            if (!promoter.email) return { success: false, error: "El promotor no tiene correo registrado" }

            await resend.emails.send({
                from: DEFAULT_SENDER,
                to: [promoter.email],
                subject: `🚀 Tu Código de Acceso de RP para ${businessName}`,
                html: `
                    <!DOCTYPE html>
                    <html lang="es">
                    <head>
                        <meta charset="UTF-8">
                        <meta name="viewport" content="width=device-width, initial-scale=1.0">
                        <title>Bienvenido a tu Panel de RP</title>
                    </head>
                    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f3f4f6; margin: 0; padding: 40px 20px;">
                        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);">
                            <tr>
                                <td align="center" style="padding: 40px 30px; background: linear-gradient(135deg, #18181b 0%, #09090b 100%);">
                                    <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 800; letter-spacing: -0.5px;">Acceso a tu Panel RP</h1>
                                    <p style="color: #a1a1aa; margin: 10px 0 0 0; font-size: 16px;">${businessName}</p>
                                </td>
                            </tr>
                            <tr>
                                <td style="padding: 40px 30px;">
                                    <p style="margin: 0 0 20px 0; color: #3f3f46; font-size: 16px; line-height: 24px;">
                                        ¡Hola <strong>${promoter.name}</strong>! Ya tienes acceso exclusivo a tu panel personal.
                                    </p>
                                    <p style="margin: 0 0 30px 0; color: #3f3f46; font-size: 16px; line-height: 24px;">
                                        Desde esta aplicación web podrás consultar cuántos clientes has llevado, el estatus de tus comisiones en tiempo real y descargar tu código QR personalizado para compartir.
                                    </p>
                                    
                                    <div style="background-color: #f4f4f5; border: 1px solid #e4e4e7; border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 30px;">
                                        <p style="margin: 0 0 8px 0; color: #71717a; font-size: 13px; text-transform: uppercase; letter-spacing: 1px; font-weight: 600;">
                                            TU CÓDIGO DE INVITACIÓN ES UNILINK:
                                        </p>
                                        <p style="margin: 0; color: #18181b; font-size: 16px; font-weight: 500;">
                                            Usa únicamente tu <strong>número de celular</strong> para acceder.
                                        </p>
                                    </div>

                                    <table border="0" cellpadding="0" cellspacing="0" width="100%">
                                        <tr>
                                            <td align="center">
                                                <a href="${generalPortalLink}" style="display: inline-block; background-color: #6366f1; color: #ffffff; font-size: 16px; font-weight: 700; text-decoration: none; padding: 16px 32px; border-radius: 12px; box-shadow: 0 4px 14px 0 rgba(99, 102, 241, 0.39);">
                                                    Entrar a mi Panel
                                                </a>
                                            </td>
                                        </tr>
                                    </table>
                                </td>
                            </tr>
                            <tr>
                                <td style="padding: 30px; background-color: #fafafa; border-top: 1px solid #f4f4f5; text-align: center;">
                                    <p style="margin: 0 0 10px 0; color: #a1a1aa; font-size: 14px;">
                                        Si tienes problemas con el botón, copia y pega este enlace en tu navegador:
                                    </p>
                                    <a href="${portalLink}" style="color: #6366f1; font-size: 14px; text-decoration: none; word-break: break-all;">
                                        ${portalLink}
                                    </a>
                                </td>
                            </tr>
                        </table>
                        <p style="text-align: center; margin: 30px 0 0 0; color: #9ca3af; font-size: 12px; font-weight: 600; letter-spacing: 2px; text-transform: uppercase;">
                            Powered by HappyMeter
                        </p>
                    </body>
                    </html>
                `
            })
            return { success: true }
        }
    } catch (error) {
        console.error("Error sending promoter notification:", error)
        return { success: false, error: "Error al enviar notificación" }
    }
}

export async function getPublicPromoterPortal(slug: string) {
    try {
        const startOfDay = new Date()
        startOfDay.setHours(0, 0, 0, 0)

        const promoter = await prisma.promoterProfile.findUnique({
            where: { slug },
            include: {
                business: {
                    select: {
                        businessName: true,
                        logoUrl: true
                    }
                },
                reservations: {
                    where: { date: { gte: startOfDay }, status: { notIn: ['CANCELED', 'REJECTED'] } },
                    orderBy: { date: 'asc' },
                    select: {
                        id: true,
                        status: true,
                        partySize: true,
                        createdAt: true,
                        date: true,
                        customerName: true,
                        customerPhone: true,
                        table: { select: { label: true } }
                    }
                }
            }
        })

        if (!promoter) return { success: false, data: null }

        // Fetch Loyalty Program for the base referral link
        const loyaltyProgram = await prisma.loyaltyProgram.findFirst({
            where: { userId: promoter.businessId }
        })

        const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.happymeters.com'
        const referralLink = loyaltyProgram
            ? `${appUrl}/book/${loyaltyProgram.id}?rp=${promoter.slug}`
            : null

        const now = new Date();
        // Today bounds
        const todayStart = new Date(now.setHours(0, 0, 0, 0));
        const todayEnd = new Date(now.setHours(23, 59, 59, 999));

        const isToday = (date: Date) => date >= todayStart && date <= todayEnd;

        // ALL TIME
        const allTimeConfirmed = promoter.reservations
            .filter((r: any) => r.status === 'CONFIRMED' || r.status === 'CHECKED_IN')
            .reduce((sum: number, r: any) => sum + r.partySize, 0)

        const allTimeCommission = promoter.reservations
            .filter((r: any) => r.status === 'CHECKED_IN' && r.commissionEarned)
            .reduce((sum: number, r: any) => sum + (r.commissionEarned || 0), 0)

        // TODAY
        const todayReservations = promoter.reservations.filter((r: any) => isToday(new Date(r.date)));

        const todayConfirmed = todayReservations
            .filter((r: any) => r.status === 'CONFIRMED' || r.status === 'CHECKED_IN')
            .reduce((sum: number, r: any) => sum + r.partySize, 0)

        const todayCommission = promoter.commissionType === 'PER_PERSON'
            ? todayConfirmed * promoter.commissionValue
            : 0;

        // GAMIFICATION & TIME BOUNDS
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay());
        startOfWeek.setHours(0, 0, 0, 0);

        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        const thisWeekConfirmed = promoter.reservations
            .filter((r: any) => (r.status === 'CONFIRMED' || r.status === 'CHECKED_IN') && new Date(r.date) >= startOfWeek)
            .reduce((sum: number, r: any) => sum + r.partySize, 0);

        const thisMonthConfirmed = promoter.reservations
            .filter((r: any) => (r.status === 'CONFIRMED' || r.status === 'CHECKED_IN') && new Date(r.date) >= startOfMonth)
            .reduce((sum: number, r: any) => sum + r.partySize, 0);

        const businessSettings = await (prisma.userSettings as any).findUnique({
            where: { userId: promoter.businessId },
            select: { weeklyGoalAttendees: true, monthlyGoalAttendees: true }
        });
        const weeklyGoal = businessSettings?.weeklyGoalAttendees || 50;
        const monthlyGoal = businessSettings?.monthlyGoalAttendees || 200;

        const allPromoters = await prisma.promoterProfile.findMany({
            where: { businessId: promoter.businessId, isActive: true },
            include: {
                reservations: {
                    where: { status: { in: ['CONFIRMED', 'CHECKED_IN'] }, date: { gte: startOfMonth } },
                    select: { partySize: true }
                }
            }
        });

        const leaderboard = allPromoters.map((p: any) => ({
            id: p.id,
            name: p.name,
            slug: p.slug,
            monthlyConfirmed: p.reservations.reduce((sum: number, r: any) => sum + r.partySize, 0)
        })).sort((a: any, b: any) => b.monthlyConfirmed - a.monthlyConfirmed);

        const currentRank = leaderboard.findIndex((r: any) => r.id === promoter.id) + 1;

        // Gamification Level (0-99 Bronze, 100-299 Silver, 300+ Gold based on ALL TIME)
        let gamificationLevel = 'BRONZE';
        if (allTimeConfirmed >= 300) gamificationLevel = 'GOLD';
        else if (allTimeConfirmed >= 100) gamificationLevel = 'SILVER';

        const stats = {
            allTime: {
                totalReservations: promoter.reservations.length,
                confirmedAttendees: allTimeConfirmed,
                commission: allTimeCommission
            },
            today: {
                totalReservations: todayReservations.length,
                confirmedAttendees: todayConfirmed,
                commission: todayCommission
            },
            gamification: {
                level: gamificationLevel,
                rank: currentRank,
                totalRps: leaderboard.length,
                weeklyConfirmed: thisWeekConfirmed,
                monthlyConfirmed: thisMonthConfirmed,
                weeklyGoal,
                monthlyGoal,
                leaderboard: leaderboard.slice(0, 10) // Top 10
            },
            referralLink
        }

        const upcomingEvents = await (prisma as any).promoterEvent.findMany({
            where: { businessId: promoter.businessId, date: { gte: now }, isActive: true },
            orderBy: { date: 'asc' },
            take: 10
        });

        // AI Recommendation Engine
        let aiCoachTip = null;
        if (upcomingEvents && upcomingEvents.length > 0) {
            const nextBoostEvent = upcomingEvents.find((e: any) => e.isBoostActive && e.boostCommission);
            if (nextBoostEvent) {
                const boostDate = new Date(nextBoostEvent.date).toLocaleDateString('es-ES', { weekday: 'long' });
                const capitalDate = boostDate.charAt(0).toUpperCase() + boostDate.slice(1);
                aiCoachTip = `💡 Tip IA: Promueve ${promoter.business?.businessName} este ${capitalDate} para el evento "${nextBoostEvent.name}". ¡Aprovecha el Surge Pricing (+ $${nextBoostEvent.boostCommission} extra por persona)!`;
            } else {
                // Check score if it exists, default to 5.0
                const score = (promoter as any).rpScore || 5.0;
                aiCoachTip = `💡 Tip IA: Mantén tu RP Score alto (${score.toFixed(1)}⭐) asegurando que tus invitados no fallen. Esto te dará más prioridad.`;
            }
        } else {
            const score = (promoter as any).rpScore || 5.0;
            if (score < 4.0) {
                aiCoachTip = `💡 Tip IA: Tu calificación bajó a ${score.toFixed(1)}⭐. Confirma la asistencia a tus mesas para evitar los "No-Show" y recuperar tu nivel.`;
            } else {
                aiCoachTip = `💡 Tip IA: El algoritmo nota tu excelencia (${score.toFixed(1)}⭐). ¡Sigue así para desbloquear el nivel Oro o invitaciones VIP!`;
            }
        }

        return {
            success: true,
            data: {
                id: promoter.id,
                role: (promoter as any).role,
                leaderId: (promoter as any).leaderId,
                name: promoter.name,
                businessName: promoter.business?.businessName,
                logoUrl: promoter.business?.logoUrl,
                upcomingReservations: promoter.reservations,
                upcomingEvents,
                stats,
                phone: promoter.phone,
                aiCoachTip
            }
        }
    } catch (error) {
        console.error("Error fetching public promoter portal:", error)
        return { success: false, data: null }
    }
}

export async function updateCommissionSettings(amount: number) {
    try {
        const { userId } = await auth();
        if (!userId) return { success: false, error: "No autorizado" };

        await (prisma.userSettings as any).update({
            where: { userId },
            data: { defaultCommissionPerPerson: amount }
        });

        revalidatePath('/dashboard/reservations/rps', 'page');
        return { success: true };
    } catch (error) {
        console.error("Error updating commission settings:", error);
        return { success: false, error: "Error de servidor al guardar configuración." };
    }
}

export async function verifyPromoterPhone(phone: string) {
    try {
        const cleanPhone = phone.replace(/[^0-9]/g, '');

        // Check if phone matches any local promoter entry first. If not, they shouldn't register globally.
        const localProfiles = await prisma.promoterProfile.findMany({
            where: { phone: cleanPhone },
            select: { id: true, businessId: true }
        });

        if (localProfiles.length === 0) {
            return { success: false, error: "Tu número de teléfono aún no ha sido dado de alta por ningún lugar." };
        }

        // Find or init the global profile
        const globalProfile = await (prisma as any).globalPromoter.findUnique({
            where: { phone: cleanPhone }
        });

        if (!globalProfile) {
            // Can start setup but shouldn't ask for PIN yet
            const firstProfile = await prisma.promoterProfile.findFirst({ where: { phone: cleanPhone } });
            return {
                success: true,
                hasPin: false,
                data: {
                    name: firstProfile?.name || "",
                    email: firstProfile?.email || "",
                    avatarUrl: null
                }
            };
        }

        return {
            success: true,
            hasPin: !!globalProfile.pin,
            data: {
                name: globalProfile.name,
                email: globalProfile.email,
                avatarUrl: globalProfile.avatarUrl
            }
        };
    } catch (error) {
        console.error("Error verifying promoter phone:", error);
        return { success: false, error: "Error de servidor al validar el teléfono" };
    }
}

export async function setupGlobalPromoter(phone: string, pin: string, name: string, email: string, avatarBase64: string, bankAccount: string) {
    try {
        const cleanPhone = phone.replace(/[^0-9]/g, '');

        // This acts as upsert: If somehow there was a PIN missing but it existed, we update it.
        await (prisma as any).globalPromoter.upsert({
            where: { phone: cleanPhone },
            update: {
                pin,
                name,
                email,
                bankAccount,
                avatarUrl: avatarBase64 || null
            },
            create: {
                phone: cleanPhone,
                pin,
                name,
                email,
                bankAccount,
                avatarUrl: avatarBase64 || null
            }
        });

        return { success: true };
    } catch (error) {
        console.error("Error setting up global promoter:", error);
        return { success: false, error: "Error de servidor al crear la identidad global" };
    }
}

export async function verifyGlobalPromoterPin(phone: string, pin: string) {
    try {
        const cleanPhone = phone.replace(/[^0-9]/g, '');
        const globalProfile = await (prisma as any).globalPromoter.findUnique({
            where: { phone: cleanPhone },
            select: { pin: true }
        });

        if (!globalProfile || !globalProfile.pin) {
            return { success: false, error: "Debes configurar tu cuenta primero." };
        }

        if (globalProfile.pin !== pin) {
            return { success: false, error: "PIN de acceso incorrecto." };
        }

        return { success: true };
    } catch (error) {
        console.error("Error verifying global pin:", error);
        return { success: false, error: "Error del servidor." };
    }
}

export async function acceptB2BReferralTerms() {
    try {
        const cookieStore = await cookies();
        const phone = cookieStore.get('rps_global_session')?.value;

        if (!phone) {
            return { success: false, error: "No se encontró sesión activa" };
        }

        await (prisma as any).globalPromoter.update({
            where: { phone },
            data: { agreedToB2BReferral: true }
        });

        // Revalidate the wallet page so the UI updates
        revalidatePath('/rps/wallet');

        return { success: true };
    } catch (error) {
        console.error("Error accepting B2B referral terms:", error);
        return { success: false, error: "Error de servidor al aceptar los términos" };
    }
}

export async function getGlobalPromoterWallet(phone: string) {
    try {
        const globalProfile = await (prisma as any).globalPromoter.findUnique({
            where: { phone }
        });

        if (!globalProfile) return { success: false, error: "Perfil no encontrado" };

        const localProfiles = await (prisma.promoterProfile as any).findMany({
            where: {
                OR: [
                    { phone: phone },
                    { userId: phone }
                ]
            },
            include: {
                business: {
                    select: {
                        businessName: true,
                        logoUrl: true
                    }
                },
                reservations: {
                    select: { status: true, partySize: true, settlementId: true }
                }
            }
        });

        // Calculate unified stats
        const placesCount = localProfiles.length;
        let totalEarnings = 0; // Keeping this for backward compatibility
        let totalPending = 0;
        let totalPaid = 0;
        let totalReservations = 0;
        let totalConfirmedAttendees = 0;

        const places = localProfiles.map((profile: any) => {
            const p = profile as any;
            const confirmedRes = p.reservations.filter((r: any) => r.status === 'CONFIRMED' || r.status === 'CHECKED_IN');

            const placePending = confirmedRes
                .filter((r: any) => !r.settlementId)
                .reduce((sum: number, r: any) => sum + (p.commissionType === 'PER_PERSON' ? r.partySize * p.commissionValue : p.commissionValue), 0);

            const placePaid = confirmedRes
                .filter((r: any) => r.settlementId)
                .reduce((sum: number, r: any) => sum + (p.commissionType === 'PER_PERSON' ? r.partySize * p.commissionValue : p.commissionValue), 0);

            const placeAttendees = confirmedRes.reduce((sum: number, r: any) => sum + r.partySize, 0);

            totalPending += placePending;
            totalPaid += placePaid;
            totalEarnings += (placePending + placePaid);
            totalReservations += p.reservations.length;
            totalConfirmedAttendees += placeAttendees;

            return {
                businessId: p.businessId,
                name: p.business?.businessName || 'Business',
                logoUrl: p.business?.logoUrl,
                slug: p.slug,
                totalReservations: p.reservations.length,
                pending: placePending,
                paid: placePaid,
                attendees: placeAttendees
            }

        });

        return {
            success: true,
            data: {
                globalProfile,
                places,
                stats: {
                    placesCount,
                    totalEarnings,
                    totalPending,
                    totalPaid,
                    totalReservations,
                    totalConfirmedAttendees,
                    rpScore: globalProfile.rpScore
                }
            }
        }

    } catch (error) {
        console.error("Error getting promoter wallet:", error);
        return { success: false, error: "Server error" }
    }
}

export async function processPromoterPayout(promoterId: string, amount: number, reservationIds: string[], notes?: string) {
    try {
        const { userId } = await auth();
        if (!userId) return { success: false, error: "No autorizado" };

        const res = await prisma.$transaction(async (tx: any) => {
            const settlement = await tx.promoterSettlement.create({
                data: {
                    promoterId,
                    amount,
                    status: "PAID",
                    paidAt: new Date(),
                    startDate: new Date(),
                    endDate: new Date(),
                    notes: notes || "Pago de comisiones"
                }
            });

            await tx.reservation.updateMany({
                where: { id: { in: reservationIds } },
                data: { settlementId: settlement.id }
            });

            return settlement;
        });

        // Try to notify the RP
        try {
            const promoterData = await prisma.promoterProfile.findUnique({
                where: { id: promoterId },
                select: { userId: true, name: true, slug: true, business: { select: { businessName: true } } }
            });
            if (promoterData?.userId) {
                const globalP = await (prisma as any).globalPromoter.findUnique({ where: { phone: promoterData.userId } });
                if (globalP) {
                    await sendPushNotificationToRP(globalP.id, {
                        title: "💸 ¡Comisión Pagada!",
                        body: `Has recibido un pago de $${amount} de ${promoterData.business?.businessName || 'el negocio'}. Revisa tu billetera para el recibo.`,
                        url: `/rps/wallet`
                    });
                }
            }
        } catch (pushErr) {
            console.error("Error triggering RP payout notification:", pushErr);
        }

        revalidatePath(`/dashboard/reservations/rps/${promoterId}`, 'page');
        revalidatePath(`/dashboard/reservations/rps`, 'page');
        return { success: true, data: res };
    } catch (error) {
        console.error("Error processing payout:", error);
        return { success: false, error: "Error de servidor al procesar el pago" };
    }
}

export async function createPromoterEvent(data: { name: string, description?: string, date: Date, imageUrl?: string, boostCommission?: number, isBoostActive?: boolean }) {
    try {
        const { userId } = await auth();
        if (!userId) return { success: false, error: "No autorizado" };

        const event = await (prisma as any).promoterEvent.create({
            data: {
                businessId: userId,
                name: data.name,
                description: data.description,
                date: data.date,
                imageUrl: data.imageUrl,
                boostCommission: data.boostCommission || null,
                isBoostActive: data.isBoostActive || false,
            }
        });

        if (data.isBoostActive && data.boostCommission) {
            try {
                const business = await prisma.userSettings.findUnique({
                    where: { userId },
                    select: { businessName: true }
                });

                const profiles = await (prisma as any).promoterProfile.findMany({
                    where: { businessId: userId, isActive: true },
                    include: { globalPromoter: true }
                });

                for (const profile of profiles) {
                    const globalId = (profile as any).globalPromoter?.id;
                    if (globalId) {
                        await sendPushNotificationToRP(globalId, {
                            title: "🔥 Surge Pricing Activado",
                            body: `¡Gana +$${data.boostCommission} extra por persona en el evento "${data.name}" en ${business?.businessName || 'el local'}!`,
                            url: `/rps/${profile.slug}`
                        });
                    }
                }
            } catch (err) {
                console.error("Error triggering Surge Pricing push notifications:", err);
            }
        }

        revalidatePath('/dashboard/reservations/rps');
        return { success: true, data: event };
    } catch (error) {
        console.error("Error creating event:", error);
        return { success: false, error: "Error de servidor" };
    }
}

// --- JEFE DE RPs (LEAD PROMOTER) ACTIONS ---

export async function getJefeTeamInfo(leaderSlug: string) {
    try {
        const leader = await prisma.promoterProfile.findUnique({
            where: { slug: leaderSlug }
        });

        if (!leader || (leader as any).role !== 'JEFE_RP') {
            return { success: false, error: "Access denied" };
        }

        const team = await (prisma as any).promoterProfile.findMany({
            where: { leaderId: leader.id, isActive: true },
            include: {
                reservations: {
                    select: { status: true, partySize: true, commissionEarned: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        // Calculate stats per team member
        const formattedTeam = team.map((member: any) => {
            const memberReservations = (member as any).reservations || [];
            const confirmedAttendees = memberReservations
                .filter((r: any) => r.status === 'CONFIRMED' || r.status === 'CHECKED_IN')
                .reduce((sum: number, r: any) => sum + r.partySize, 0);

            const totalCommission = memberReservations
                .filter((r: any) => r.status === 'CHECKED_IN' && r.commissionEarned)
                .reduce((sum: number, r: any) => sum + (r.commissionEarned || 0), 0);

            return {
                id: member.id,
                name: member.name,
                phone: member.phone,
                email: member.email,
                slug: member.slug,
                commissionType: member.commissionType,
                commissionValue: member.commissionValue,
                confirmedAttendees,
                totalCommission,
            };
        });

        return { success: true, data: formattedTeam };
    } catch (error) {
        console.error("Error fetching team info:", error);
        return { success: false, error: "Server error" };
    }
}

function generateSlug(name: string): string {
    return name.toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '') + '-' + Math.random().toString(36).substring(2, 6);
}

export async function createTeamPromoter(data: { name: string, phone: string, email: string, commissionType: 'PER_PERSON' | 'PERCENTAGE', commissionValue: number }, leaderSlug: string) {
    try {
        const leader = await prisma.promoterProfile.findUnique({
            where: { slug: leaderSlug }
        });

        if (!leader || (leader as any).role !== 'JEFE_RP') {
            return { success: false, error: "Access denied" };
        }

        const currentPromotersCount = await prisma.promoterProfile.count({
            where: { businessId: leader.businessId }
        });

        if (currentPromotersCount >= 50) {
            return { success: false, error: "Limit of 50 RPs reached for this branch." };
        }

        let cleanPhone = data.phone ? data.phone.replace(/[^0-9]/g, '') : null;
        if (!cleanPhone && !data.email) return { success: false, error: "Se requiere un teléfono o un correo válido" };

        const slug = generateSlug(data.name);

        const newPromoter = await (prisma as any).promoterProfile.create({
            data: {
                businessId: leader.businessId,
                branchId: leader.branchId,
                name: data.name,
                email: data.email || null,
                phone: cleanPhone || null,
                userId: cleanPhone || data.email, // Using as global linking key
                slug,
                commissionType: data.commissionType,
                commissionValue: data.commissionValue,
                isActive: true,
                role: 'RP' as any,
                leaderId: leader.id as any
            }
        });

        if (cleanPhone) {
            await (prisma as any).globalPromoter.upsert({
                where: { phone: cleanPhone },
                update: {}, // Don't overwrite existing
                create: {
                    phone: cleanPhone,
                    name: data.name,
                    email: data.email || null,
                    pin: Math.floor(1000 + Math.random() * 9000).toString() // Generate random pin for now
                }
            });
        }

        revalidatePath(`/rps/${leaderSlug}`);
        return { success: true, promoter: newPromoter };
    } catch (error) {
        console.error("Error creating team promoter:", error);
        return { success: false, error: "Server error" };
    }
}

export async function updatePromoterCommission(promoterId: string, commissionValue: number, leaderSlug: string) {
    try {
        const leader = await prisma.promoterProfile.findUnique({
            where: { slug: leaderSlug }
        });

        if (!leader || (leader as any).role !== 'JEFE_RP') {
            return { success: false, error: "Access denied" };
        }

        const targetPromoter = await (prisma as any).promoterProfile.findFirst({
            where: { id: promoterId, leaderId: leader.id }
        });

        if (!targetPromoter) {
            return { success: false, error: "RP not found or does not belong to your team" };
        }

        await prisma.promoterProfile.update({
            where: { id: promoterId },
            data: { commissionValue }
        });

        revalidatePath(`/rps/${leaderSlug}`);
        return { success: true };
    } catch (error) {
        console.error("Error updating promoter commission:", error);
        return { success: false, error: "Server error" };
    }
}

export async function togglePromoterRole(promoterId: string, newRole: 'RP' | 'JEFE_RP') {
    try {
        const { userId } = await auth();
        if (!userId) return { success: false, error: "No autorizado" };

        await (prisma as any).promoterProfile.update({
            where: { id: promoterId, businessId: userId },
            data: { role: newRole }
        });

        revalidatePath('/dashboard/[branchSlug]/reservations/rps', 'page');
        return { success: true };
    } catch (error) {
        console.error("Error toggling promoter role:", error);
        return { success: false, error: "Error al cambiar el rol del promotor" };
    }
}
