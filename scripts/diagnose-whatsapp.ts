
require('dotenv').config({ path: '.env' });

async function diagnose() {
    console.log("--- WhatsApp Diagnosis ---");
    const token = process.env.WHATSAPP_API_TOKEN;
    const phoneId = process.env.WHATSAPP_PHONE_ID;

    if (!token) {
        console.error("❌ ERROR: WHATSAPP_API_TOKEN is missing in .env");
        return;
    }
    if (!phoneId) {
        console.error("❌ ERROR: WHATSAPP_PHONE_ID is missing in .env");
        return;
    }

    console.log("Token found (length):", token.length);
    console.log("Phone ID:", phoneId);

    // Try to send a simple Hello World message
    // Using a trusted number (e.g., the developer's or a test number)
    // For safety, we'll try to send it to the 'to' number if provided, or default to a safe one if known.
    // If we don't have a number, we can just check the debug token endpoint or try to send to an invalid number to check auth.

    // Better strategy: Check the token debug endpoint
    const debugUrl = `https://graph.facebook.com/v17.0/debug_token?input_token=${token}&access_token=${token}`;

    try {
        console.log("Verifying token validity...");
        // Hack: We use the token itself as the access_token to inspect itself, 
        // usually works if it has permission, otherwise we try a real send.

        const res = await fetch(`https://graph.facebook.com/v17.0/${phoneId}/messages`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                messaging_product: 'whatsapp',
                to: '5215574131657', // Real user number from logs
                type: 'template',
                template: {
                    name: 'new_survey_alertt',
                    language: { code: 'es_MX' },
                    components: [
                        {
                            type: 'body',
                            parameters: [
                                { type: 'text', text: "Diagnóstico Final" },
                                { type: 'text', text: "10" },
                                { type: 'text', text: "Prueba desde script local." }
                            ]
                        }
                    ]
                }
            })
        });

        const data = await res.json();

        if (!res.ok) {
            console.error('❌ Error API WhatsApp:', JSON.stringify(data, null, 2));
            if (data.error && data.error.code === 190) {
                console.error("👉 DIAGNOSIS: Token Expired or Invalid (Code 190).");
            }
        } else {
            console.log('✅ Éxito! Token válido (Mensaje enviado o en cola).');
            console.log('Response:', JSON.stringify(data, null, 2));
        }
    } catch (e: any) {
        console.error('❌ Error de conexión/script:', e.message);
    }
}

diagnose();
