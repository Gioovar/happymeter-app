
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { clerkClient } from '@clerk/nextjs/server'

export async function POST(req: Request) {
    try {
        const { email } = await req.json()
        if (!email) return NextResponse.json({ error: 'Email required' }, { status: 400 })

        console.log('[MANUAL UPGRADE] Starting for:', email)

        const client = await clerkClient()
        const users = await client.users.getUserList({ emailAddress: [email] })

        if (users.data.length === 0) {
            return NextResponse.json({ error: 'User not found in Clerk' }, { status: 404 })
        }

        const user = users.data[0]
        const userId = user.id
        const name = `${user.firstName} ${user.lastName}`.trim() || 'Usuario'

        let userSettings = await prisma.userSettings.findUnique({
            where: { userId }
        })

        if (!userSettings) {
            await prisma.userSettings.create({
                data: {
                    userId,
                    businessName: name,
                    plan: 'FREE'
                }
            })
            console.log('[MANUAL UPGRADE] UserSettings created')
        }

        const chainName = `Cadena de ${name}`
        const existingChain = await prisma.chain.findFirst({
            where: { ownerId: userId }
        })

        if (existingChain) {
            return NextResponse.json({ success: true, message: 'Already has a chain', chainId: existingChain.id })
        }

        const chain = await prisma.chain.create({
            data: {
                name: chainName,
                ownerId: userId,
                branches: {
                    create: {
                        branchId: userId,
                        name: 'Sede Principal',
                        order: 0
                    }
                }
            }
        })

        return NextResponse.json({ success: true, chainId: chain.id, owner: name })

    } catch (error) {
        console.error('[MANUAL UPGRADE] Error:', error)
        return NextResponse.json({ error: String(error) }, { status: 500 })
    }
}
