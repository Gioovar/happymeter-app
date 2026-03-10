"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { auth } from "@clerk/nextjs/server";
import { getEffectiveUserId } from "@/lib/auth-context";

export async function getTickets(branchSlug?: string) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return { success: false, error: "Unauthorized" };
        }

        const effectiveUserId = await getEffectiveUserId(branchSlug || undefined);

        if (!effectiveUserId) {
            return { success: false, error: "Unauthorized Access to Business Tickets" };
        }

        // We fetch tickets either by effectiveUserId (which handles branches properly)
        // or explicitly linking to the branchId/businessId scope
        const tickets = await prisma.issueTicket.findMany({
            where: {
                OR: [
                    { businessId: effectiveUserId },
                    { branchId: effectiveUserId }
                ]
            },
            orderBy: {
                createdAt: "desc",
            },
        });

        return { success: true, tickets };
    } catch (error) {
        console.error("Error fetching tickets:", error);
        return { success: false, error: "Error fetching tickets" };
    }
}

export async function createTicket(data: {
    businessId: string;
    title: string;
    description: string;
    severity?: string;
    status?: string;
}) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return { success: false, error: "Unauthorized" };
        }

        const ticket = await prisma.issueTicket.create({
            data: {
                businessId: data.businessId,
                title: data.title,
                description: data.description,
                severity: data.severity || "MEDIUM",
                status: data.status || "OPEN",
            },
        });

        revalidatePath("/admin/tickets");
        return { success: true, ticket };
    } catch (error) {
        console.error("Error creating ticket:", error);
        return { success: false, error: "Error creating ticket" };
    }
}

export async function updateTicketStatus(ticketId: string, status: string) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return { success: false, error: "Unauthorized" };
        }

        const ticket = await prisma.issueTicket.update({
            where: {
                id: ticketId,
            },
            data: {
                status: status,
            },
        });

        revalidatePath("/admin/tickets");
        return { success: true, ticket };
    } catch (error) {
        console.error("Error updating ticket status:", error);
        return { success: false, error: "Error updating ticket status" };
    }
}
