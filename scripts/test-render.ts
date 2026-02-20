
import dotenv from 'dotenv';
import path from 'path';
import { render } from '@react-email/render';
import ReservationConfirmationEmail from '../src/emails/ReservationConfirmation';
import React from 'react';

async function main() {
    console.log("--- Testing Email Rendering ---");
    try {
        const html = await render(
            React.createElement(ReservationConfirmationEmail, {
                customerName: "Test Customer",
                businessName: "Test Business",
                date: "Lunes, 1 de Enero",
                time: "14:00",
                pax: 2,
                table: "Mesa 1",
                qrCodeUrl: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==", // Tiny 1x1 base64
                reservationId: "res_123456",
                loyaltyUrl: "https://happymeters.com/loyalty/123"
            })
        );
        console.log("✅ Rendering successful!");
        console.log("HTML length:", html.length);
        // console.log(html.substring(0, 500) + "...");
    } catch (error) {
        console.error("❌ Rendering failed:", error);
    }
}

main();
