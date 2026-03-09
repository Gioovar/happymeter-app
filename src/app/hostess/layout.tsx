import Link from "next/link";
import { Users, QrCode, Settings, CalendarRange } from "lucide-react";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

export default async function HostessLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { userId } = await auth();

    if (!userId) {
        redirect("/sign-in");
    }

    // Validate the user has HOSTESS or higher permissions if needed.
    // For now, if they are routed here, they should have access.
    // We can fetch their team identity to get their branch.
    const teamMember = await prisma.teamMember.findFirst({
        where: { userId: userId },
        include: {
            owner: true, // The business owner
        },
    });

    if (!teamMember) {
        // If they aren't a team member, they shouldn't be in the Hostess app
        redirect("/sign-in");
    }

    return (
        <div className="flex flex-col h-[100dvh] bg-black text-white">
            {/* Main Content Area */}
            <main className="flex-1 overflow-y-auto pb-20 no-scrollbar">
                {children}
            </main>

            {/* Bottom Mobile Navigation */}
            <nav className="fixed bottom-0 left-0 right-0 bg-[#111111] border-t border-white/10 px-6 py-4 flex justify-between items-center z-50 rounded-t-2xl pb-safe">
                <Link
                    href="/hostess"
                    className="flex flex-col items-center gap-1 text-white/50 hover:text-white transition-colors"
                >
                    <CalendarRange className="w-6 h-6" />
                    <span className="text-[10px] font-medium tracking-wide">Reservas</span>
                </Link>
                <Link
                    href="/hostess/scanner"
                    className="flex flex-col items-center gap-1 -mt-6"
                >
                    <div className="bg-sky-500 rounded-full p-4 shadow-lg shadow-sky-500/20 text-white">
                        <QrCode className="w-8 h-8" />
                    </div>
                    <span className="text-[10px] font-medium tracking-wide text-sky-500 mt-1">Escanear</span>
                </Link>
                <Link
                    href="/hostess/account"
                    className="flex flex-col items-center gap-1 text-white/50 hover:text-white transition-colors"
                >
                    <Settings className="w-6 h-6" />
                    <span className="text-[10px] font-medium tracking-wide">Ajustes</span>
                </Link>
            </nav>
        </div>
    );
}
