
import { NextResponse } from 'next/server'
import { currentUser } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'

// TODO: Move to a config or env var
const ADMIN_EMAILS = ['admin@happymeter.com', 'gioovar@gmail.com']

async function isAdmin() {
    const user = await currentUser()
    if (!user || !user.emailAddresses.some(email => ADMIN_EMAILS.includes(email.emailAddress))) {
        return false
    }
    return true
}

export async function GET(req: Request, { params }: { params: { userId: string } }) {
    try {
        if (!await isAdmin()) {
            return new NextResponse("Unauthorized", { status: 403 })
        }

        const { userId } = params
        const { searchParams } = new URL(req.url)
        const format = searchParams.get('format') // 'meta' or 'whatsapp'

        if (!userId) return new NextResponse("User ID required", { status: 400 })

        // Fetch all responses for this user's surveys
        const surveys = await prisma.survey.findMany({
            where: { userId },
            include: {
                responses: {
                    include: {
                        answers: {
                            include: { question: true }
                        }
                    }
                }
            }
        })

        // Flatten responses
        const allResponses = surveys.flatMap(s => s.responses)

        if (allResponses.length === 0) {
            return new NextResponse("No data found", { status: 404 })
        }

        let csvContent = ''
        const filename = `export_${format}_${userId}_${new Date().toISOString().split('T')[0]}.csv`

        if (format === 'meta') {
            // Meta Custom Audience Format: email, phone, fn, ln, country, zip
            // We'll try to map what we have: email, fn (from name), phone (from answers)

            csvContent = 'email,phone,fn,ln\n'

            allResponses.forEach(r => {
                const email = r.customerEmail || ''
                const nameParts = (r.customerName || '').split(' ')
                const fn = nameParts[0] || ''
                const ln = nameParts.slice(1).join(' ') || ''

                // Try to find a phone number in answers
                let phone = ''
                const phoneAnswer = r.answers.find(a =>
                    a.question.text.toLowerCase().includes('whatsapp') ||
                    a.question.text.toLowerCase().includes('teléfono') ||
                    a.question.text.toLowerCase().includes('celular')
                )
                if (phoneAnswer) phone = phoneAnswer.value

                if (email || phone) {
                    csvContent += `${email},${phone},${fn},${ln}\n`
                }
            })

        } else if (format === 'whatsapp') {
            // WhatsApp / Google Contacts CSV Format: Name, Given Name, Additional Name, Family Name, Yomi Name, Given Name Yomi, Additional Name Yomi, Family Name Yomi, Name Prefix, Name Suffix, Initials, Nickname, Short Name, Maiden Name, Birthday, Gender, Location, Billing Information, Directory Server, Mileage, Occupation, Hobby, Sensitivity, Priority, Subject, Notes, Language, Photo, Group Membership, Phone 1 - Type, Phone 1 - Value
            // Simplified: Name, Phone 1 - Value

            csvContent = 'Name,Phone 1 - Value\n'

            allResponses.forEach(r => {
                const name = r.customerName || 'Cliente'

                // Try to find a phone number in answers
                let phone = ''
                const phoneAnswer = r.answers.find(a =>
                    a.question.text.toLowerCase().includes('whatsapp') ||
                    a.question.text.toLowerCase().includes('teléfono') ||
                    a.question.text.toLowerCase().includes('celular')
                )
                if (phoneAnswer) phone = phoneAnswer.value

                if (phone) {
                    csvContent += `${name},${phone}\n`
                }
            })
        } else {
            return new NextResponse("Invalid format", { status: 400 })
        }

        return new NextResponse(csvContent, {
            headers: {
                'Content-Type': 'text/csv',
                'Content-Disposition': `attachment; filename="${filename}"`
            }
        })

    } catch (error) {
        console.error('[ADMIN_EXPORT_GET]', error)
        return new NextResponse("Internal Error", { status: 500 })
    }
}
