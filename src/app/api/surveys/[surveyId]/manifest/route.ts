import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
    req: Request,
    { params }: { params: Promise<{ surveyId: string }> }
) {
    try {
        const { surveyId } = await params

        if (surveyId === 'demo') {
            return NextResponse.json({
                name: "Encuesta - Demo",
                short_name: "Encuesta",
                display: "standalone",
                start_url: `/s/demo`,
                scope: `/s/demo`,
                background_color: "#0f1516",
                theme_color: "#8b5cf6",
                icons: [
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
            })
        }

        const survey = await prisma.survey.findUnique({
            where: {
                id: surveyId
            }
        })

        if (!survey) {
            return new NextResponse("Survey not found", { status: 404 })
        }

        const userSettings = await prisma.userSettings.findUnique({
            where: { userId: survey.userId },
            select: { logoUrl: true }
        })

        const manifest = {
            name: `Encuesta - ${survey.title}`,
            short_name: survey.title.substring(0, 12) || "Encuesta",
            display: "standalone",
            start_url: `/s/${surveyId}`,
            scope: `/s/${surveyId}`,
            background_color: "#0f1516",
            theme_color: survey.hexColor || "#8b5cf6",
            icons: [
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
    } catch (error) {
        console.error('[SURVEY_MANIFEST_GET]', error)
        return new NextResponse("Internal Error", { status: 500 })
    }
}
