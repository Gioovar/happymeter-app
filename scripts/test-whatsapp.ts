import { sendWhatsAppNotification } from '../src/lib/whatsapp';
import * as dotenv from 'dotenv';
dotenv.config();

async function testWhatsApp() {
    const testPhone = process.argv[2] || "525574131657"; // Format without + for Meta usually works better or E164
    console.log(`Testing WhatsApp to: ${testPhone}`);

    // Example data for 'reservation_confirmed_v1'
    // 1: name, 2: business, 3: date, 4: id, 5: link
    const result = await sendWhatsAppNotification(testPhone, 'reservation_confirmed_v1', {
        1: "Test User",
        2: "HappyMeter Test",
        3: "Hoy a las 20:00",
        4: "TEST-ID-123",
        5: "https://happymeters.app"
    });

    console.log("Result:", result);

    if (result === true) {
        console.log("✅ WhatsApp request sent successfully (or simulated). Check logs.");
    } else {
        console.error("❌ WhatsApp request failed.");
    }
}

testWhatsApp();
