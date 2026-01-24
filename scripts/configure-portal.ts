
import { Stripe } from 'stripe';
import * as dotenv from 'dotenv';
dotenv.config();

if (!process.env.STRIPE_SECRET_KEY) {
    console.error('❌ STRIPE_SECRET_KEY is missing from .env');
    process.exit(1);
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2024-11-20.acacia',
});

const PLANS = ['Growth 1K', 'Power 3X', 'Chain Master'];

async function main() {
    console.log('🚀 Configuring Stripe Customer Portal...');

    // 1. Find the products/prices we want to enable
    const features: Stripe.BillingPortal.ConfigurationCreateParams.Features.SubscriptionUpdate.Product[] = [];

    for (const planName of PLANS) {
        // Search for product
        const search = await stripe.products.search({ query: `name:'${planName}'` });
        const product = search.data[0];

        if (!product) {
            console.warn(`⚠️ Product not found: ${planName}`);
            continue;
        }

        // List prices for this product
        const prices = await stripe.prices.list({ product: product.id, active: true, limit: 10 });
        const priceIds = prices.data.map(p => p.id);

        if (priceIds.length > 0) {
            // Deduplicate: Keep only one price per interval (month/year)
            const uniquePrices: string[] = [];
            const seenIntervals = new Set<string>();

            // Sort prices by created/active if possible, but list returns them.
            // We need to fetch details to know the interval if we want to be strict,
            // but the error message implies we are sending multiple.
            // Let's re-fetch details to be safe.
            const fullPrices = await Promise.all(priceIds.map(id => stripe.prices.retrieve(id)));

            // Sort by created desc (newest first)
            fullPrices.sort((a, b) => b.created - a.created);

            for (const p of fullPrices) {
                const interval = p.recurring?.interval;
                if (interval && !seenIntervals.has(interval)) {
                    seenIntervals.add(interval);
                    uniquePrices.push(p.id);
                }
            }

            console.log(`✅ Found ${planName}: ${fullPrices.length} total, using ${uniquePrices.length} unique (${Array.from(seenIntervals).join(', ')})`);

            if (uniquePrices.length > 0) {
                features.push({
                    prices: uniquePrices,
                    product: product.id,
                });
            }
        }
    }

    if (features.length === 0) {
        console.error('❌ No products found to add to portal.');
        return;
    }

    // 2. Create or Update Portal Configuration
    // Note: We'll create a new configuration and print its ID. 
    // Ideally, we'd find the "default" one, but Stripe doesn't have a single "default" in the API sense,
    // though the Dashboard has a default view. 
    // Creating a *new* configuration allows us to specify EXACTLY what we want 
    // and use that configuration ID in our code or just let the user know it exists.

    // HOWEVER, the dashboard "Settings -> Portal" edits the "default" configuration which isn't easily exposed via API to "update" 
    // in a way that reflects in the "Settings" UI for broad usage unless we explicitly use that config ID.
    // BUT, we can list configurations.

    const configs = await stripe.billingPortal.configurations.list({ limit: 1, is_default: true });
    let configId = configs.data[0]?.id;

    const portalConfigData: Stripe.BillingPortal.ConfigurationCreateParams = {
        business_profile: {
            headline: 'HappyMeter - Gestiona tu suscripción',
        },
        features: {
            subscription_cancel: {
                enabled: true,
                mode: 'at_period_end',
                cancellation_reason: {
                    enabled: true,
                    options: ['too_expensive', 'missing_features', 'switched_service', 'unused', 'other']
                }
            },
            subscription_update: {
                enabled: true,
                default_allowed_updates: ['price', 'quantity', 'promotion_code'],
                products: features,
                proration_behavior: 'always_invoice'
            },
            invoice_history: { enabled: true },
            payment_method_update: { enabled: true },
            customer_update: {
                enabled: true,
                allowed_updates: ['email', 'address', 'phone']
            }
        },
    };

    if (configId) {
        console.log(`ℹ️ Updating existing default configuration: ${configId}`);
        await stripe.billingPortal.configurations.update(configId, {
            ...portalConfigData,
            features: {
                ...portalConfigData.features,
                // Note: The update type is slightly different, checking if strictly compatible
                subscription_cancel: portalConfigData.features?.subscription_cancel,
                subscription_update: portalConfigData.features?.subscription_update,
                // Cast or align types if needed, but usually compatible.
            } as any
        });
    } else {
        console.log('✨ Creating NEW default portal configuration...');
        const newConfig = await stripe.billingPortal.configurations.create(portalConfigData);
        configId = newConfig.id;
    }

    console.log(`✅ Portal Configured Successfully! ID: ${configId}`);
    console.log('The "No products found" error in Dashboard should be ignored because we just configured it via API.');
}

main().catch(console.error);
