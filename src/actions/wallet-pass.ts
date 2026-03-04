import { PKPass } from 'passkit-generator';
import { prisma } from '@/lib/prisma';
import fs from 'fs';
import path from 'path';

export async function generateAppleWalletPass(customerId: string) {
    try {
        const customer = await prisma.loyaltyCustomer.findUnique({
            where: { id: customerId },
            include: {
                program: true,
                tier: true
            }
        });

        if (!customer) return { success: false, error: "Customer not found" };

        // For this to work in production, we need the Apple certificates
        // This is a placeholder for the actual certificate generation.
        if (!process.env.APPLE_WALLET_PASS_CERT) {
            return { success: false, error: "Servicio de Apple Wallet no configurado (Faltan certificados)" }
        }

        const pass = new PKPass({
            "passTypeIdentifier": process.env.APPLE_WALLET_PASS_IDENTIFIER || "pass.com.happymeters.loyalty",
            "teamIdentifier": process.env.APPLE_TEAM_ID || "A1B2C3D4E5",
            "organizationName": customer.program.businessName,
            "description": `Tarjeta de Lealtad - ${customer.program.businessName}`,
            "backgroundColor": customer.program.themeColor || "#000000",
            "foregroundColor": "#ffffff",
            "labelColor": "#ffffff",
            "logoText": customer.program.businessName,
        }, {
            "wwdr": fs.readFileSync(path.resolve('./certs/wwdr.pem')),
            "signerCert": fs.readFileSync(path.resolve('./certs/signerCert.pem')),
            "signerKey": fs.readFileSync(path.resolve('./certs/signerKey.pem')),
            "signerKeyPassphrase": process.env.APPLE_WALLET_KEY_PASSWORD || "",
        });

        // GEOLOCATION TRIGGER
        // This is the core engine for triggering a native push notification
        // when the user steps into the geofence radius. Apple handles it passively.
        if (customer.program.isGeofenceActive && customer.program.latitude && customer.program.longitude) {
            pass.addLocation({
                latitude: customer.program.latitude,
                longitude: customer.program.longitude,
                // Apple Wallet will pop up a notification with this text
                relevantText: `¡Sabemos que estás cerca de ${customer.program.businessName}! Abre tu tarjeta para ganar visitas y recompensas.`
            });
        }

        pass.type = "storeCard";

        // Add Fields
        pass.setBarcodes({
            format: "PKBarcodeFormatQR",
            message: `R:${customer.magicToken || customer.id}`,
            messageEncoding: "iso-8859-1"
        });

        pass.primaryFields.push({
            key: "balance",
            label: customer.program.pointsPercentage > 0 ? "PUNTOS" : "VISITAS",
            value: (customer.program.pointsPercentage > 0 ? customer.currentPoints : customer.currentVisits).toString()
        });

        pass.secondaryFields.push({
            key: "tier",
            label: "NIVEL",
            value: customer.tier?.name || "Miembro"
        });

        const buffer = await pass.getAsBuffer();

        return { success: true, buffer };
    } catch (error) {
        console.error("Wallet Pass Error:", error);
        return { success: false, error: "Error de servidor al compilar la tarjeta Wallet" }
    }
}
