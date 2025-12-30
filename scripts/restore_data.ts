
import { prisma } from '../src/lib/prisma';

async function main() {
    console.log('--- RESTORING CLEAN DATA ---');

    // 1. Create a "Real" Client
    const clientId = 'user_client_restaurante_01';

    // Clean up if exists locally to avoid dup
    await prisma.userSettings.deleteMany({ where: { userId: clientId } });

    await prisma.userSettings.create({
        data: {
            userId: clientId,
            plan: 'GROWTH',
            role: 'USER',
            businessName: 'Restaurante El Buen Sazón',
            isOnboarded: true,
            subscriptionStatus: 'active',
            subscriptionPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // +30 days
        }
    });
    console.log('Created Client: Restaurante El Buen Sazón');

    // 2. Create the Sale ($499 MXN)
    await prisma.sale.create({
        data: {
            userId: clientId,
            amount: 499,
            currency: 'mxn',
            plan: 'GROWTH_MONTHLY',
            status: 'COMPLETED',
            createdAt: new Date() // Today
        }
    });
    console.log('Restored Sale: $499 MXN');

    // 3. Create a Survey with a few responses (Realism)
    const survey = await prisma.survey.create({
        data: {
            userId: clientId,
            title: 'Encuesta de Satisfacción',
            isActive: true,
            questions: {
                create: [
                    { text: '¿Qué te pareció la comida?', type: 'RATING', order: 0 },
                    { text: '¿Cómo fue el servicio?', type: 'RATING', order: 1 }
                ]
            }
        }
    });

    // Add 5 realistic responses
    for (let i = 0; i < 5; i++) {
        await prisma.response.create({
            data: {
                surveyId: survey.id,
                customerName: `Cliente ${i + 1}`,
                customerSource: 'QR_TABLE',
                answers: {
                    create: [
                        { questionId: (await prisma.question.findFirst({ where: { surveyId: survey.id } }))!.id, value: '5' }
                    ]
                }
            }
        });
    }
    console.log('Restored Activity: 1 Survey, 5 Responses');

}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
