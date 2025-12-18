'use server'

import { auth, currentUser } from '@clerk/nextjs/server'
import { sendSupportAlert } from '@/lib/alerts'

export async function requestHumanSupport(message: string, contactInfo?: string) {
    try {
        const user = await currentUser()
        if (!user) {
            return { success: false, error: 'Unauthorized' }
        }

        const email = user.emailAddresses[0]?.emailAddress || 'No email'
        const name = `${user.firstName} ${user.lastName}`

        const sent = await sendSupportAlert(email, name, message, contactInfo)

        if (sent) {
            return { success: true }
        } else {
            return { success: false, error: 'Failed to send alert' }
        }

    } catch (error) {
        console.error('SERVER ACTION ERROR:', error)
        return { success: false, error: 'Internal Server Error' }
    }
}
