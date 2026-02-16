'use server'

import { cookies } from "next/headers"
import { redirect } from "next/navigation"

export async function setContext(membershipId: string) {
    const cookieStore = await cookies()
    // Set cookie for 30 days
    cookieStore.set('ops_context_id', membershipId, {
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 30
    })

    redirect("/ops/tasks")
}

export async function clearContext() {
    const cookieStore = await cookies()
    cookieStore.delete('ops_context_id')
    redirect("/ops/select-context")
}
