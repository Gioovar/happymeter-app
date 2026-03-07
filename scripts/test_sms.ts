import { PrismaClient } from '@prisma/client'
import Twilio from 'twilio'
import dotenv from 'dotenv'
dotenv.config()

const prisma = new PrismaClient()

async function main() {
    let twilioClient = null;
    if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
        twilioClient = Twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
        console.log("Twilio client initialized:", process.env.TWILIO_ACCOUNT_SID);
    } else {
        console.log("Missing Twilio credentials in .env");
        return;
    }

    const settings = await prisma.userSettings.findMany({
        where: { isActive: true },
        select: { userId: true, businessName: true, phone: true }
    });

    let sent = 0;

    for (const ownerSettings of settings) {
        if (!ownerSettings.phone) continue;

        let targetPhone = ownerSettings.phone.replace(/[\s\-\(\)]/g, '');

        if (!targetPhone.startsWith('+')) {
            if (targetPhone.length === 10) {
                targetPhone = `+52${targetPhone}`;
            } else if (targetPhone.startsWith('52') && targetPhone.length === 12) {
                targetPhone = `+${targetPhone}`;
            } else {
                targetPhone = `+52${targetPhone}`;
            }
        }

        console.log(`Sending SMS to ${ownerSettings.businessName} at ${targetPhone}...`);

        try {
            await twilioClient.messages.create({
                body: `Este es un mensaje de prueba de HappyMeter para ${ownerSettings.businessName}.`,
                from: process.env.TWILIO_PHONE_NUMBER,
                to: targetPhone
            });
            console.log("Success!");
            sent++;
        } catch (e: any) {
            console.error("Failed to send:", e.message);
        }
    }

    console.log(`Total SMS sent: ${sent}`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
