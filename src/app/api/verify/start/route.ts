import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'

export async function POST(req: Request) {
    try {
        const { userId } = await auth()
        if (!userId) return new NextResponse("Unauthorized", { status: 401 })

        const { phone } = await req.json()

        console.log(`[MOCK_VERIFY] Sending code to ${phone}...`)

        // Simular delay de envío
        await new Promise(resolve => setTimeout(resolve, 1000))

        // En un futuro, aquí se llamaría a Twilio
        // await client.verify.v2.services(serviceSid).verifications.create({ to: phone, channel: 'whatsapp' })

        return NextResponse.json({ success: true, message: "Code sent" })
    } catch (error) {
        console.error('[VERIFY_START]', error)
        return new NextResponse("Internal Error", { status: 500 })
    }
}
