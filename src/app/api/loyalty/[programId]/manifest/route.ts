
import { getPublicLoyaltyProgramInfo } from "@/actions/loyalty"
import { NextResponse } from "next/server"

export async function GET(request: Request, { params }: { params: { programId: string } }) {
    const program = await getPublicLoyaltyProgramInfo(params.programId)

    if (!program) {
        return NextResponse.json({ error: "Program not found" }, { status: 404 })
    }

    const { businessName, logoUrl, themeColor } = program

    const manifest = {
        name: businessName,
        short_name: businessName.substring(0, 12), // Short name limit
        description: `Tarjeta de lealtad de ${businessName}`,
        start_url: `/app`, // Redirects to smart entry point
        display: "standalone",
        background_color: "#18181b", // Dark theme background
        theme_color: themeColor || "#8b5cf6",
        orientation: "portrait",
        icons: logoUrl ? [
            {
                src: logoUrl,
                sizes: "192x192",
                type: "image/png"
            },
            {
                src: logoUrl,
                sizes: "512x512",
                type: "image/png"
            }
        ] : [
            {
                src: "/happymeter_logo.png",
                sizes: "192x192",
                type: "image/png"
            },
            {
                src: "/happymeter_logo.png",
                sizes: "512x512",
                type: "image/png"
            }
        ]
    }

    return NextResponse.json(manifest)
}
