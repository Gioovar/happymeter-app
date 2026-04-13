export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'

export async function PATCH(req: Request, { params }: { params: Promise<{ ticketId: string }> }) {
    try {
        const { userId } = await auth()
        if (!userId) return new NextResponse("Unauthorized", { status: 401 })

        const { ticketId } = await params
        const body = await req.json()
        const { status, resolutionNotes, isRecurring } = body

        // Verify ownership
        const ticket = await prisma.issueTicket.findUnique({
            where: { id: ticketId }
        })

        if (!ticket || ticket.businessId !== userId) {
            return new NextResponse("Not Found or Unauthorized", { status: 404 })
        }

        const updatedTicket = await prisma.issueTicket.update({
            where: { id: ticketId },
            data: {
                ...(status && { status }),
                ...(resolutionNotes !== undefined && { resolutionNotes }),
                ...(isRecurring !== undefined && { isRecurring })
            }
        })

        return NextResponse.json(updatedTicket)

    } catch (error) {
        console.error('[ISSUE_PATCH]', error)
        return new NextResponse("Internal Error", { status: 500 })
    }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ ticketId: string }> }) {
    try {
        const { userId } = await auth()
        if (!userId) return new NextResponse("Unauthorized", { status: 401 })

        const { ticketId } = await params

        const ticket = await prisma.issueTicket.findUnique({
            where: { id: ticketId }
        })

        if (!ticket || ticket.businessId !== userId) {
            return new NextResponse("Not Found or Unauthorized", { status: 404 })
        }

        await prisma.issueTicket.delete({
            where: { id: ticketId }
        })

        return new NextResponse(null, { status: 204 })

    } catch (error) {
        console.error('[ISSUE_DELETE]', error)
        return new NextResponse("Internal Error", { status: 500 })
    }
}
