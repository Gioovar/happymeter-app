
import { Stripe } from 'stripe';
import * as dotenv from 'dotenv';
dotenv.config();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
    apiVersion: '2024-11-20.acacia',
});

const PLANS_MXN = {
    GROWTH: {
        name: 'Growth 1K',
        monthly: 49900, // $499.00 MXN
        yearly: 499000 // $4,990.00 MXN (2 months free approx)
    },
    POWER: {
        name: 'Power 3X',
        monthly: 129900, // $1,299.00 MXN
        yearly: 1299000 // $12,990.00 MXN
    },
    CHAIN: {
        name: 'Chain Master',
        monthly: 599900, // $5,999.00 MXN
        yearly: 5999000 // $59,990.00 MXN
    }
};

async function main() {
    if (!process.env.STRIPE_SECRET_KEY) {
        console.error('❌ STRIPE_SECRET_KEY is missing from .env');
        process.exit(1);
    }

    console.log('🇲🇽 Seeding Stripe Products (MXN)...');

    const results: Record<string, string> = {};

    for (const [key, plan] of Object.entries(PLANS_MXN)) {
        console.log(`\nProcessing ${plan.name}...`);

        // 1. Find Product
        const search = await stripe.products.search({ query: `name:'${plan.name}'` });
        let product = search.data[0];

        if (!product) {
            console.error(`❌ Product ${plan.name} not found! Run the main seed script first.`);
            continue;
        }

        console.log(`ℹ️ Using Product: ${product.name} (${product.id})`);

        // 2. Create Prices in MXN
        // Monthly
        const priceMonth = await stripe.prices.create({
            product: product.id,
            unit_amount: plan.monthly,
            currency: 'mxn',
            recurring: { interval: 'month' },
            nickname: `${plan.name} Monthly (MXN)`
        });
        console.log(`✅ Created Monthly Price (MXN): ${priceMonth.id}`);
        results[`STRIPE_PRICE_${key}_MONTHLY_MXN`] = priceMonth.id;

        // Yearly
        const priceYear = await stripe.prices.create({
            product: product.id,
            unit_amount: plan.yearly,
            currency: 'mxn',
            recurring: { interval: 'year' },
            nickname: `${plan.name} Yearly (MXN)`
        });
        console.log(`✅ Created Yearly Price (MXN): ${priceYear.id}`);
        results[`STRIPE_PRICE_${key}_YEARLY_MXN`] = priceYear.id;
    }

    console.log('\n\nCopy these to your Vercel Environment Variables (Overwrite the old USD ones):');
    console.log('=================================================');
    // We map them to the SAME env var names so we don't have to change the code logic,
    // just the values in Vercel.
    Object.entries(results).forEach(([k, v]) => {
        // Strip _MXN suffix for the output so user can just paste over
        const envName = k.replace('_MXN', '');
        console.log(`${envName}=${v}`);
    });
    console.log('=================================================');
}

main().catch(console.error);
