
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

export default clerkMiddleware(async (auth, request) => {
  const { nextUrl } = request
  const searchParams = nextUrl.searchParams
  const ref = searchParams.get('ref')

  // Create response object (default to next)
  let response = NextResponse.next()

  // If 'ref' param exists, set a cookie
  if (ref) {
    // 30 days expiry
    const expiryDate = new Date()
    expiryDate.setDate(expiryDate.getDate() + 30)

    response.cookies.set('affiliate_ref', ref, {
      expires: expiryDate,
      path: '/',
      sameSite: 'lax'
    })
  }

  // Capture 'intent' param (e.g. 'creator') for redirect logic
  const intent = searchParams.get('intent')
  if (intent) {
    response.cookies.set('signup_intent', intent, {
      path: '/',
      sameSite: 'lax',
      maxAge: 3600 // 1 hour is enough for sign up flow
    })
  }

  // Protect routes if not public
  if (!isPublicRoute(request)) {
    await auth.protect()
  }

  return response
})

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
}
