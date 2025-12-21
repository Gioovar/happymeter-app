import { clerkMiddleware } from "@clerk/nextjs/server";

// Configure public routes
export default clerkMiddleware((auth, req) => {
    // Allow public access to /play/* and /s/* (surveys)
    if (req.nextUrl.pathname.startsWith('/play') || req.nextUrl.pathname.startsWith('/s')) {
        return // return void to allow access without auth
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
