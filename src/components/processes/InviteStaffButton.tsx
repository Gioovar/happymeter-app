"use client";

import { useState } from "react";
import { Users } from "lucide-react";
import InviteMemberModal from "@/components/team/InviteMemberModal";

export default function InviteStaffButton({ branchId, branchSlug }: { branchId: string; branchSlug: string }) {
    const [isModalOpen, setIsModalOpen] = useState(false);

    return (
        <>
            <button
                onClick={() => setIsModalOpen(true)}
                className="bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 px-6 py-3 rounded-xl font-bold hover:bg-indigo-600/40 hover:text-white transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/10"
            >
                <Users className="w-5 h-5" />
                Agregar Personal
            </button>
            <InviteMemberModal
                isOpen={isModalOpen}
                onOpenChange={setIsModalOpen}
                branchId={branchId}
                branchSlug={branchSlug}
                staffOnly={true}
            />
        </>
    );
}
