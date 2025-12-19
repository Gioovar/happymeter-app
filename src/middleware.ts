import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

const isPublicRoute = createRouteMatcher([
    '/',
    '/s/(.*)',
    '/api/surveys(.*)',
    '/sign-in(.*)',
    '/sign-up(.*)',
    '/creators(.*)',
    '/api/webhooks(.*)',
    '/report(.*)'
])

// Basic Middleware for Clerk Handshake only
export default clerkMiddleware((auth, req) => {
    // We rely on Layouts for protection to avoid Edge Runtime crashes
})

export const config = {
    matcher: [
        '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
        '/(api|trpc)(.*)',
    ],
}
