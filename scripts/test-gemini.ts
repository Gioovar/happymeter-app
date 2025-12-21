import { GoogleGenerativeAI } from '@google/generative-ai'
import dotenv from 'dotenv'

dotenv.config()

async function main() {
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
        console.error("❌ GEMINI_API_KEY not found")
        process.exit(1)
    }

    const genAI = new GoogleGenerativeAI(apiKey)

    try {
        console.log("🤖 Sending test request to Gemini 2.0 Flash...")
        const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" })
        const result = await model.generateContent("Say 'Hello from HappyMeter 2.0' if you can hear me.")

        console.log("\n✅ RESPONSE RECEIVED:")
        console.log(result.response.text())
    } catch (error) {
        console.error("❌ Gemini Error:", error)
        process.exit(1)
    }
}

main()
