
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

const isPublicRoute = createRouteMatcher([
  '/',
  '/s/(.*)',
  '/api/surveys(.*)',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/creators(.*)', // Public landing for creators
  '/api/webhooks(.*)', // Webhooks
  '/report(.*)' // Public shared reports
])

// export default clerkMiddleware(async (auth, request) => {
//   if (!isPublicRoute(request)) {
//     await auth.protect()
//   }
//   return NextResponse.next()
// })

export default function middleware(request: any) {
  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
}
