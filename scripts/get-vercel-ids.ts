
import { Stripe } from 'stripe';
import * as dotenv from 'dotenv';
dotenv.config();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2024-11-20.acacia',
});

const PLANS = ['Growth 1K', 'Power 3X', 'Chain Master'];

async function main() {
    console.log('🔍 Fetching Active Price IDs for Vercel...');

    const results = {};

    for (const planName of PLANS) {
        const search = await stripe.products.search({ query: `name:'${planName}'` });
        const product = search.data[0];
        if (!product) continue;

        const prices = await stripe.prices.list({ product: product.id, active: true, limit: 10 });

        // Sort by created desc
        prices.data.sort((a, b) => b.created - a.created);

        const monthly = prices.data.find(p => p.recurring?.interval === 'month');
        const yearly = prices.data.find(p => p.recurring?.interval === 'year');

        if (planName === 'Growth 1K') {
            results['STRIPE_PRICE_GROWTH_MONTHLY'] = monthly?.id;
            results['STRIPE_PRICE_GROWTH_YEARLY'] = yearly?.id;
        } else if (planName === 'Power 3X') {
            results['STRIPE_PRICE_POWER_MONTHLY'] = monthly?.id;
            results['STRIPE_PRICE_POWER_YEARLY'] = yearly?.id;
        } else if (planName === 'Chain Master') {
            results['STRIPE_PRICE_CHAIN_MONTHLY'] = monthly?.id;
            results['STRIPE_PRICE_CHAIN_YEARLY'] = yearly?.id;
        }
    }

    console.log('\n👇 COPIA Y PEGA ESTO EN VERCEL (Environment Variables):');
    Object.entries(results).forEach(([key, value]) => {
        console.log(`${key} = ${value}`);
    });
}

main().catch(console.error);
