import { sendSMS } from '../src/lib/sms';
import * as dotenv from 'dotenv';
dotenv.config();

async function testSMS() {
    const testPhone = process.argv[2] || "+525574131657"; // Use user's phone from screenshot if not provided
    console.log(`Testing SMS to: ${testPhone}`);

    const result = await sendSMS(testPhone, "Prueba de HappyMeter: Si recibes este mensaje, Twilio está funcionando correctamente.");
    console.log("Result:", JSON.stringify(result, null, 2));

    if (result.simulated) {
        console.warn("⚠️ Twilio is NOT configured (Simulated Mode)");
    }
}

testSMS();
