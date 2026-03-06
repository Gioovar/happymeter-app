"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { auth } from "@clerk/nextjs/server";
import { Prisma } from "@prisma/client";

export type FranchiseBySlugResponse = Prisma.PromiseReturnType<typeof getFranchiseBySlug>;

export async function updateFranchiseSettings(
    chainId: string,
    data: { slug?: string; franchiseReservationMode?: boolean }
) {
    try {
        const { userId } = await auth();
        if (!userId) return { success: false, error: "Unauthorized" };

        // Verify ownership
        const chain = await prisma.chain.findFirst({
            where: { id: chainId, ownerId: userId }
        });

        if (!chain) {
            return { success: false, error: "Cadena no encontrada o acceso denegado." };
        }

        // Validate slug slug if provided
        if (data.slug && data.slug !== chain.slug) {
            const existingSlug = await prisma.chain.findFirst({
                where: { slug: data.slug }
            });
            if (existingSlug) {
                return { success: false, error: "Este alias o enlace ya está en uso. Por favor, elige otro." };
            }

            // Ensure valid slug format (letters, numbers, hyphens)
            if (!/^[a-z0-9-]+$/.test(data.slug)) {
                return { success: false, error: "El enlace solo puede contener letras minúsculas, números y guiones." };
            }
        }

        await prisma.chain.update({
            where: { id: chainId },
            data: {
                ...(data.slug !== undefined && { slug: data.slug }),
                ...(data.franchiseReservationMode !== undefined && { franchiseReservationMode: data.franchiseReservationMode })
            }
        });

        revalidatePath("/dashboard/chains");
        return { success: true };
    } catch (error: any) {
        console.error("[UPDATE_FRANCHISE]", error);
        return { success: false, error: "Ocurrió un error al actualizar la configuración." };
    }
}

export async function updateBranchReservationSettings(
    chainBranchId: string,
    data: { reservationType: string; externalReservationUrl?: string; address?: string }
) {
    try {
        const { userId } = await auth();
        if (!userId) return { success: false, error: "Unauthorized" };

        // Verify chain ownership implicitly via chain -> ownerId
        const chainBranch = await prisma.chainBranch.findFirst({
            where: {
                id: chainBranchId,
                chain: { ownerId: userId }
            }
        });

        if (!chainBranch) {
            return { success: false, error: "Sucursal no encontrada o acceso denegado." };
        }

        await prisma.chainBranch.update({
            where: { id: chainBranchId },
            data: {
                reservationType: data.reservationType,
                externalReservationUrl: data.externalReservationUrl || null,
                address: data.address || null,
            }
        });

        revalidatePath("/dashboard/chains");
        return { success: true };
    } catch (error) {
        console.error("[UPDATE_BRANCH_RES]", error);
        return { success: false, error: "Error al guardar la configuración de la sucursal." };
    }
}

export async function getFranchiseBySlug(slug: string) {
    try {
        const franchise = await prisma.chain.findUnique({
            where: { slug },
            include: {
                branches: {
                    include: {
                        branch: {
                            select: { businessName: true, logoUrl: true, bannerUrl: true }
                        }
                    },
                    orderBy: { order: 'asc' }
                }
            }
        });

        if (!franchise || !franchise.franchiseReservationMode) {
            return { success: false, error: "Not found" };
        }

        return { success: true, franchise };
    } catch (error) {
        console.error("[GET_FRANCHISE_BY_SLUG]", error);
        return { success: false, error: "Error fetching franchise data." };
    }
}
