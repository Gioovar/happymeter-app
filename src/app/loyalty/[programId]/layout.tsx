
import { getPublicLoyaltyProgramInfo } from "@/actions/loyalty"
import { Metadata } from "next"

export async function generateMetadata({ params }: { params: { programId: string } }): Promise<Metadata> {
    const program = await getPublicLoyaltyProgramInfo(params.programId)

    // Fallbacks
    const title = program?.businessName || "Tarjeta de Lealtad"
    const icon = program?.logoUrl || "/happymeter_logo.png"
    const themeColor = program?.themeColor || "#8b5cf6"

    return {
        title: title,
        description: `Membresía digital de ${title}`,
        manifest: `/api/loyalty/${params.programId}/manifest`,
        icons: {
            icon: icon,
            apple: icon, // iOS Icon
            shortcut: icon
        },
        appleWebApp: {
            capable: true,
            title: title,
            statusBarStyle: "black-translucent"
        },
        other: {
            "theme-color": themeColor
        }
    }
}

export default function LoyaltyProgramLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <>
            {children}
        </>
    )
}
