import { NextResponse } from 'next/server'
import { clerkClient } from '@clerk/nextjs/server'

export async function GET(request: Request) {
    console.log('--- ADMIN DEBUG START (DYNAMIC) ---')
    console.log('DB URL Env:', process.env.DATABASE_URL ? 'FOUND' : 'MISSING')
    
    try {
        const { searchParams } = new URL(request.url)
        const email = searchParams.get('email')
        const secret = searchParams.get('secret')

        if (secret !== 'simulacion123') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        if (!email) return NextResponse.json({ error: 'Email required' }, { status: 400 })

        // Dynamic Import to prevent crash on load
        console.log('Importing Prisma...')
        const { prisma } = await import('@/lib/prisma')
        console.log('Prisma Imported.')

        console.log('Fetching Clerk user...')
        const client = await clerkClient()
        const userList = await client.users.getUserList({ emailAddress: [email] })
        
        if (userList.data.length === 0) {
             return NextResponse.json({ error: 'User not found in Clerk' }, { status: 404 })
        }

        const userId = userList.data[0].id
        console.log('Found ID:', userId)

        const eightDaysAgo = new Date()
        eightDaysAgo.setDate(eightDaysAgo.getDate() - 8)

        const updated = await prisma.userSettings.update({
            where: { userId },
            data: {
                createdAt: eightDaysAgo,
                plan: 'FREE' 
            }
        })

        return NextResponse.json({ 
            success: true, 
            message: `Trial expired for user ${email}`,
            userId: userId,
            newCreatedAt: updated.createdAt
        })

    } catch (error: any) {
        console.error('CRITICAL ERROR:', error)
        return NextResponse.json({ 
            error: 'Internal Server Error', 
            details: error.message,
            envCheck: process.env.DATABASE_URL ? 'Loaded' : 'Missing'
        }, { status: 500 })
    }
}
