"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { auth } from "@clerk/nextjs/server";

export async function getTickets(businessId: string) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return { success: false, error: "Unauthorized" };
        }

        const tickets = await prisma.issueTicket.findMany({
            where: {
                businessId: businessId,
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
