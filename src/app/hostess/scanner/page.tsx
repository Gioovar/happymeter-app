import { getOpsSession } from "@/lib/ops-auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import ScannerClient from "@/components/hostess/ScannerClient";

export default async function ScannerPage() {
    const { isAuthenticated, member, userId } = await getOpsSession();

    if (!isAuthenticated) {
        redirect("/ops/login");
    }

    let branchId = "";
    let adminId = "";

    if (member) {
        branchId = member.ownerId; // Offline operator or assigned member
        adminId = member.id; // Record the action under the member ID
    } else if (userId) {
        // Owner accessing directly without a specific member record
        const teamMember = await prisma.teamMember.findFirst({
            where: { userId: userId },
            select: { ownerId: true, id: true },
        });
        if (teamMember) {
            branchId = teamMember.ownerId;
            adminId = teamMember.id;
        } else {
            branchId = userId; // Fallback
            adminId = userId;
        }
    }

    if (!branchId) {
        redirect("/ops/login");
    }

    return <ScannerClient branchId={branchId} adminId={adminId} />;
}

