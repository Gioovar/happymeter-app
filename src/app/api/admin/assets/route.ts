
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'
import { auth } from '@clerk/nextjs/server'

export async function POST(req: Request) {
    try {
        const { userId } = await auth()
        // Simple auth check - in production use proper role check
        if (!userId) {
            return new NextResponse("Unauthorized", { status: 401 })
        }

        const formData = await req.formData()
        const file = formData.get('file') as File
        const name = formData.get('name') as string
        const type = formData.get('type') as string || 'OTHER'

        if (!file) {
            return new NextResponse("No file uploaded", { status: 400 })
        }

        const bytes = await file.arrayBuffer()
        const buffer = Buffer.from(bytes)

        // Ensure directory exists
        const uploadDir = path.join(process.cwd(), 'public/uploads')
        try {
            await mkdir(uploadDir, { recursive: true })
        } catch (e) {
            // Ignore if exists
        }

        // Create unique filename
        const filename = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '')}`
        const filepath = path.join(uploadDir, filename)

        // Write file
        await writeFile(filepath, buffer)

        // Save to DB
        const asset = await prisma.brandAsset.create({
            data: {
                name: name || file.name,
                url: `/uploads/${filename}`,
                type: type
            }
        })

        return NextResponse.json(asset)

    } catch (error) {
        console.error('[ADMIN_ASSETS_POST]', error)
        return new NextResponse("Internal Error", { status: 500 })
    }
}

export async function GET() {
    try {
        const assets = await prisma.brandAsset.findMany({
            orderBy: { createdAt: 'desc' }
        })
        return NextResponse.json(assets)
    } catch (error) {
        console.error('[ADMIN_ASSETS_GET]', error)
        return new NextResponse("Internal Error", { status: 500 })
    }
}
