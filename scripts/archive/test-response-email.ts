import 'dotenv/config';
import { resend } from '../../src/lib/resend';
import { NewResponseEmail } from '../../src/emails/NewResponseEmail';

async function sendTestEmail() {
    const targetEmail = process.argv[2];

    if (!targetEmail) {
        console.error('Please provide an email');
        process.exit(1);
    }

    console.log(`📧 Sending RESPONSE ALERT to: ${targetEmail}...`);

    try {
        const data = await resend.emails.send({
            from: 'HappyMeter <onboarding@resend.dev>',
            to: [targetEmail],
            subject: '🔔 Nueva Respuesta: NPS 8/10',
            react: NewResponseEmail({
                surveyName: 'Satisfacción Restaurante',
                npsScore: 8,
                comment: 'La comida estuvo excelente, pero el servicio un poco lento.',
                responseLink: 'https://happymeter.app/dashboard/responses/123'
            }),
        });

        console.log('Result:', data);
    } catch (error) {
        console.error('Error:', error);
    }
}

sendTestEmail();
