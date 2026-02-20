
import dotenv from 'dotenv';
import path from 'path';
import { Resend } from 'resend';

// Load .env
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const apiKey = process.env.RESEND_API_KEY;
const targetEmail = process.argv[2];

if (!apiKey) {
    console.error("❌ RESEND_API_KEY not found in .env");
    process.exit(1);
}

if (!targetEmail) {
    console.error("Usage: npx tsx scripts/test-email.ts <email>");
    process.exit(1);
}

const DEFAULT_SENDER = 'HappyMeter <notificaciones@happymeters.com>';
const resend = new Resend(apiKey);

console.log(`Sending test email to ${targetEmail} from ${DEFAULT_SENDER}...`);

async function main() {
    try {
        const result = await resend.emails.send({
            from: DEFAULT_SENDER,
            to: [targetEmail],
            subject: "Test Email from HappyMeter Debugger",
            text: "If you are reading this, the email configuration is working and the sender domain is valid."
        });

        if (result.error) {
            console.error("❌ Failed to send:", JSON.stringify(result.error, null, 2));
            if (result.error.name === 'validation_error' && result.error.message.includes('not verified')) {
                console.log("\n💡 TIP: Check if notificaciones@happymeters.com is a verified domain/email in Resend.");
            }
        } else {
            console.log("✅ Email sent successfully!", result.data);
        }
    } catch (error) {
        console.error("❌ Exception:", error);
    }
}

main();
