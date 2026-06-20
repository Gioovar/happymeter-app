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

        // 2. Buscar el programa de lealtad asociado al dueño del negocio (businessOwnerId)
        const program = await prisma.loyaltyProgram.findUnique({
            where: { userId: authResult.businessOwnerId },
            include: {
                rewards: {
                    where: { isActive: true },
                    orderBy: { costInPoints: 'asc' }
                },
                tiers: {
                    orderBy: { order: 'asc' }
                },
                rules: {
                    where: { isActive: true }
                }
            }
        });

        if (!program) {
            return NextResponse.json(
                { error: "Programa de lealtad no configurado para este negocio" },
                { status: 404 }
            );
        }

        // 3. Responder con la estructura esperada por la Loyalty Mobile App
        return NextResponse.json({
            success: true,
            context: {
                businessId: authResult.businessId,
                branchId: authResult.branchId
            },
            program: {
                id: program.id,
                businessName: program.businessName,
                description: program.description || "",
                logoUrl: program.logoUrl || null,
                themeColor: program.themeColor || "#8b5cf6",
                cardDesign: program.cardDesign || "SIMPLE",
                pointsPercentage: program.pointsPercentage,
                enableFirstVisitGift: program.enableFirstVisitGift,
                firstVisitGiftText: program.firstVisitGiftText || "",
                // Listado de recompensas activas
                rewards: program.rewards.map(reward => ({
                    id: reward.id,
                    name: reward.name,
                    description: reward.description || "",
                    costInPoints: reward.costInPoints,
                    costInVisits: reward.costInVisits,
                    imageUrl: reward.imageUrl || null
                })),
                // Listado de niveles VIP
                tiers: program.tiers.map(tier => ({
                    id: tier.id,
                    name: tier.name,
                    order: tier.order,
                    requiredVisits: tier.requiredVisits,
                    requiredPoints: tier.requiredPoints,
                    color: tier.color,
                    benefits: tier.benefits || ""
                })),
                // Reglas básicas del programa
                rules: program.rules.map(rule => ({
                    id: rule.id,
                    name: rule.name,
                    trigger: rule.trigger,
                    pointsMultiplier: rule.pointsMultiplier
                }))
            }
        });

    } catch (err: any) {
        console.error("Error en GET /api/v1/mobile/loyalty/program:", err);
        return NextResponse.json(
            { error: "Error interno del servidor al obtener el programa de lealtad" },
            { status: 500 }
        );
    }
}
