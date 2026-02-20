
import dotenv from 'dotenv';
import path from 'path';

// Load .env
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

// Mock Next.js cache
require('next/cache').revalidatePath = () => { };

import { createReservation } from '../src/actions/reservations';

async function main() {
    console.log("--- Simulating Reservation Creation ---");

    // Using a test email address
    const testEmail = "test@happymeters.com"; // Verified domain

    const bookingData = {
        reservations: [
            {
                tableId: "4d4995fa-d7e6-4e94-a46a-edc99c865bb4",
                date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
                partySize: 2
            }
        ],
        customer: {
            name: "Debugger Test",
            email: testEmail,
            phone: "+5212345678" // Dummy phone
        }
    };

    try {
        const result = await createReservation(bookingData);
        console.log("--- Result ---");
        console.log(JSON.stringify(result, null, 2));
    } catch (error) {
        console.error("--- Execution Error ---");
        console.error(error);
    }
}

main();
