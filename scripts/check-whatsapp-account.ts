
import 'dotenv/config'

async function checkAccount() {
    const token = process.env.WHATSAPP_API_TOKEN || process.env.WHATSAPP_ACCESS_TOKEN
    const phoneId = process.env.WHATSAPP_PHONE_ID

    if (!token || !phoneId) {
        console.error("❌ Faltan credenciales en .env")
        return
    }

    console.log(`\n🔍 Inspeccionando Cuenta de WhatsApp (ID: ${phoneId})...`)

    try {
        const res = await fetch(`https://graph.facebook.com/v17.0/${phoneId}?fields=display_phone_number,verified_name,code_verification_status,quality_rating,name_status`, {
            headers: { 'Authorization': `Bearer ${token}` }
        })

        const data = await res.json()

        if (data.error) {
            console.error("❌ Error API:", data.error.message)
        } else {
            console.log("\n✅ Información de la Línea:")
            console.log("-----------------------------------------")
            console.log(`📱 Número Visible:  ${data.display_phone_number}`)
            console.log(`🏷️  Nombre:         ${data.verified_name || "No verificado"}`)
            console.log(`🚦 Estado:          ${data.code_verification_status}`)
            console.log(`🌟 Calidad:         ${data.quality_rating}`)
            console.log("-----------------------------------------")
            console.log("Si el 'Nombre' no es lo que esperabas, busca el 'Número Visible' en tu WhatsApp.\n")
        }

    } catch (e: any) {
        console.error("❌ Error de red:", e.message)
    }
}

checkAccount()
