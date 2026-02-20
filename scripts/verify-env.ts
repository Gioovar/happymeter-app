
import dotenv from 'dotenv';
import path from 'path';

// Load .env from root
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

console.log("--- Checking Notification Environment Variables ---");

const keys = [
    'RESEND_API_KEY',
    'TWILIO_ACCOUNT_SID',
    'TWILIO_AUTH_TOKEN',
    'TWILIO_PHONE_NUMBER',
    'WHATSAPP_API_TOKEN',
    'WHATSAPP_PHONE_ID'
];

let missing = 0;

keys.forEach(key => {
    const value = process.env[key];
    if (!value) {
        console.error(`❌ Missing: ${key}`);
        missing++;
    } else {
        const masked = value.length > 8 ? `${value.substring(0, 4)}...${value.substring(value.length - 4)}` : 'UNKNOWN_LENGTH';
        console.log(`✅ Present: ${key} (${masked})`);
    }
});

if (missing > 0) {
    console.log("\n⚠️ Some configuration keys are missing. Notifications will fail.");
    process.exit(1);
} else {
    console.log("\n✅ All notification keys are present.");
}
