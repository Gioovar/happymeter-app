import { clerkMiddleware } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// Configure public routes
export default clerkMiddleware((auth, req) => {
    // Allow public access to /play/*, /s/* (surveys), /install, and SEO files
    if (
        req.nextUrl.pathname.startsWith('/play') ||
        req.nextUrl.pathname.startsWith('/s') ||
        req.nextUrl.pathname.startsWith('/report') ||
        req.nextUrl.pathname.startsWith('/install') ||
        req.nextUrl.pathname.startsWith('/sign-up') ||
        req.nextUrl.pathname.startsWith('/api/setup-admin') ||
        req.nextUrl.pathname === '/robots.txt' ||
        req.nextUrl.pathname === '/sitemap.xml' ||
        req.nextUrl.pathname === '/manifest.json'
    ) {
        return // return void to allow access without auth
    }

    // Capture Referral Code
    if (req.nextUrl.searchParams.has('ref')) {
        const refCode = req.nextUrl.searchParams.get('ref')
        const response = NextResponse.next()
        // Save referral code in cookie for 30 days
        response.cookies.set('referral_code', refCode!, {
            path: '/',
            maxAge: 60 * 60 * 24 * 30,
            sameSite: 'lax'
        })
        return response
    }

    // Protect all other routes
    // auth().protect() // This might be too strict if we just want to default to signed-in context for others
})

export const config = {
    matcher: [
        // Skip Next.js internals and all static files, unless found in search params
        '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
        // Always run for API routes
        '/(api|trpc)(.*)',
    ],
};
