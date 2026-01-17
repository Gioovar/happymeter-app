import { cookies } from "next/headers"

export const LOYALTY_COOKIE_NAME = "loyalty_session_v1";

export async function setLoyaltySession(token: string) {
    const cookieStore = await cookies()
    cookieStore.set(LOYALTY_COOKIE_NAME, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 30 // 30 days
    })
}

export async function getLoyaltySessionToken() {
    const cookieStore = await cookies()
    return cookieStore.get(LOYALTY_COOKIE_NAME)?.value
}

export async function clearLoyaltySession() {
    const cookieStore = await cookies()
    cookieStore.delete(LOYALTY_COOKIE_NAME)
}
