import { SupportHeader } from "@/components/support/SupportHeader";
import { SupportFooter } from "@/components/support/SupportFooter";

export default function SupportLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex min-h-screen flex-col bg-background">
            <SupportHeader />
            <main className="flex-1">{children}</main>
            <SupportFooter />
        </div>
    );
}
