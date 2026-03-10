import { SupportHeader } from "@/components/support/SupportHeader";
import { SupportFooter } from "@/components/support/SupportFooter";

export default function SupportLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex min-h-screen flex-col bg-[#0B0F19] text-slate-200">
            <SupportHeader />
            <main className="flex-1 selection:bg-fuchsia-500/30">{children}</main>
            <SupportFooter />
        </div>
    );
}
