import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
    try {
        const { userId } = await auth()
        if (!userId) {
            return new NextResponse("Unauthorized", { status: 401 })
        }

        const chains = await prisma.chain.findMany({
            where: {
                ownerId: userId
            },
            include: {
                branches: {
                    include: {
                        branch: {
                            select: {
                                userId: true,
                                businessName: true, // Use businessName from UserSettings
                                plan: true,
                                bannerUrl: true,
                                phone: true,
                                whatsappContact: true
                            }
                        }
                    },
                    orderBy: {
                        order: 'asc'
                    }
                }
            }
        })

        return NextResponse.json(chains)
    } catch (error) {
        console.error('[CHAINS_GET]', error)
        return new NextResponse("Internal Error", { status: 500 })
    }
}
