
import { Stripe } from 'stripe';
import * as dotenv from 'dotenv';
dotenv.config();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
    apiVersion: '2024-11-20.acacia',
});

const PLANS = {
    GROWTH: {
        name: 'Growth 1K',
        monthly: 2400, // $24.00
        yearly: 29000 // $290.00
    },
    POWER: {
        name: 'Power 3X',
        monthly: 6600, // $66.00
        yearly: 79000 // $790.00
    },
    CHAIN: {
        name: 'Chain Master',
        monthly: 29900, // $299.00
        yearly: 299000 // $2990.00
    }
};

async function main() {
    if (!process.env.STRIPE_SECRET_KEY) {
        console.error('❌ STRIPE_SECRET_KEY is missing from .env');
        process.exit(1);
    }

    console.log('🚀 Seeding Stripe Products...');

    const results: Record<string, string> = {};

    for (const [key, plan] of Object.entries(PLANS)) {
        console.log(`\nProcessing ${plan.name}...`);

        // 1. Create Product
        // Check if exists by name (fuzzy) or just create new. Ideally search.
        const search = await stripe.products.search({ query: `name:'${plan.name}'` });
        let product = search.data[0];

        if (!product) {
            product = await stripe.products.create({
                name: plan.name,
                metadata: { planKey: key }
            });
            console.log(`✅ Created Product: ${product.name} (${product.id})`);
        } else {
            console.log(`ℹ️ Found Existing Product: ${product.name} (${product.id})`);
        }

        // 2. Create Prices
        // Monthly
        const priceMonth = await stripe.prices.create({
            product: product.id,
            unit_amount: plan.monthly,
            currency: 'usd',
            recurring: { interval: 'month' },
            nickname: `${plan.name} Monthly`
        });
        console.log(`✅ Created Monthly Price: ${priceMonth.id}`);
        results[`STRIPE_PRICE_${key}_MONTHLY`] = priceMonth.id;

        // Yearly
        const priceYear = await stripe.prices.create({
            product: product.id,
            unit_amount: plan.yearly,
            currency: 'usd',
            recurring: { interval: 'year' },
            nickname: `${plan.name} Yearly`
        });
        console.log(`✅ Created Yearly Price: ${priceYear.id}`);
        results[`STRIPE_PRICE_${key}_YEARLY`] = priceYear.id;
    }

    console.log('\n\nCopy these to your Vercel Environment Variables:');
    console.log('=================================================');
    Object.entries(results).forEach(([k, v]) => {
        console.log(`${k}=${v}`);
    });
    console.log('=================================================');
}

main().catch(console.error);
