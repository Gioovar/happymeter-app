import { NextResponse } from 'next/server';
import { verifyMobileAuth } from '@/lib/mobile-auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
    try {
        // 1. Validar autenticación y contexto mediante el helper (resuelve el businessOwnerId)
        const authResult = await verifyMobileAuth(req);
        if (!authResult.isAuthenticated) {
            return NextResponse.json(
                { error: authResult.error?.message || "No autorizado" },
                { status: authResult.error?.status || 401 }
            );
        }

        // 2. Obtener el programa de lealtad de la marca
        const program = await prisma.loyaltyProgram.findUnique({
            where: { userId: authResult.businessOwnerId }
        });

        if (!program) {
            return NextResponse.json(
                { error: "Programa de lealtad no configurado para este negocio" },
                { status: 404 }
            );
        }

        // 3. Buscar el perfil del cliente en base a su clerkUserId y el programId
        const customer = await prisma.loyaltyCustomer.findFirst({
            where: {
                clerkUserId: authResult.userId,
                programId: program.id
            },
            include: {
                tier: true,
                redemptions: {
                    include: { reward: true },
                    orderBy: { redeemedAt: 'desc' },
                    take: 5
                }
            }
        });

        if (!customer) {
            return NextResponse.json(
                { error: "Cliente no registrado en el programa de lealtad de este negocio" },
                { status: 404 }
            );
        }

        // 4. Obtener recompensas activas para comprobar cuáles tiene disponibles según sus puntos
        const rewards = await prisma.loyaltyReward.findMany({
            where: {
                programId: program.id,
                isActive: true
            },
            orderBy: { costInPoints: 'asc' }
        });

        const availableRewards = rewards.map(reward => {
            const canRedeemPoints = customer.currentPoints >= reward.costInPoints;
            const canRedeemVisits = customer.currentVisits >= reward.costInVisits;
            return {
                id: reward.id,
                name: reward.name,
                description: reward.description || "",
                costInPoints: reward.costInPoints,
                costInVisits: reward.costInVisits,
                imageUrl: reward.imageUrl || null,
                canRedeem: canRedeemPoints || canRedeemVisits
            };
        });

        // 5. Responder con la información del cliente optimizada para la app
        return NextResponse.json({
            success: true,
            customer: {
                id: customer.id,
                name: customer.name || "",
                phone: customer.phone,
                email: customer.email || "",
                photoUrl: customer.photoUrl || null,
                joinDate: customer.joinDate,
                currentPoints: customer.currentPoints,
                totalPoints: customer.totalPoints,
                currentVisits: customer.currentVisits,
                totalVisits: customer.totalVisits,
                magicToken: customer.magicToken || customer.id, // Fallback a id si no tiene magicToken generado
                tier: customer.tier ? {
                    id: customer.tier.id,
                    name: customer.tier.name,
                    color: customer.tier.color,
                    benefits: customer.tier.benefits || ""
                } : null,
                // Listado de recompensas y estado de canje del cliente
                rewardsProgress: availableRewards,
                // Historial de canjes recientes
                recentRedemptions: customer.redemptions.map(r => ({
                    id: r.id,
                    rewardName: r.reward.name,
                    redeemedAt: r.redeemedAt,
                    status: r.status,
                    redemptionCode: r.redemptionCode
                }))
            }
        });

    } catch (err: any) {
        console.error("Error en GET /api/v1/mobile/loyalty/profile:", err);
        return NextResponse.json(
            { error: "Error interno del servidor al obtener el perfil de lealtad" },
            { status: 500 }
        );
    }
}
