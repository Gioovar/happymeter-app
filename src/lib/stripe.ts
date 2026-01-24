import Stripe from 'stripe'

// Prevent build failure if env var is missing, but ensure it fails at runtime if used.
const apiKey = process.env.STRIPE_SECRET_KEY || 'dummy_key_for_build'

export const stripe = new Stripe(apiKey, {
    typescript: true,
})
