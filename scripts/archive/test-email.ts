import 'dotenv/config';
import { resend } from '../../src/lib/resend';
import { WelcomeEmail } from '../../src/emails/WelcomeEmail';

async function sendTestEmail() {
    const testEmail = 'gioovar@gmail.com'; // Defaulting to a likely developer email or placeholder
    // Ideally, I should ask the user, but for the script I need a target.
    // I will use 'delivery@resend.dev' which is the only allowed "To" address for Resend *Test Mode* unless domain is verified.
    // Wait, if the user gave me a live key but domain isn't verified, only their team emails work.
    // If it's a test key (re_...), it can only send to 'onboarding@resend.dev' or verified emails.

    // Let's try sending to the user's likely email or a safe test one.
    // I'll ask the user for the email address to send the test to.

    console.log('Use: npx tsx scripts/test-email.ts <email>');

    const targetEmail = process.argv[2];

    if (!targetEmail) {
        console.error('❌ Error: Please provide an email address as an argument.');
        process.exit(1);
    }

    console.log(`📧 Sending test email to: ${targetEmail}...`);

    try {
        const data = await resend.emails.send({
            from: 'HappyMeter <onboarding@resend.dev>', // Default testing domain
            to: [targetEmail],
            subject: 'Test Email from HappyMeter',
            react: WelcomeEmail({ firstName: 'Tester' }),
        });

        if (data.error) {
            console.error('❌ Resend Error:', data.error);
        } else {
            console.log('✅ Email sent successfully!', data);
        }
    } catch (error) {
        console.error('❌ Script Error:', error);
    }
}

sendTestEmail();
