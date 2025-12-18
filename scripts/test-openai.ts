
import OpenAI from 'openai'
import dotenv from 'dotenv'

dotenv.config()

async function main() {
    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
        console.error("❌ OPENAI_API_KEY not found in process.env")
        process.exit(1)
    }

    console.log(`✅ Key found: ${apiKey.substring(0, 10)}...`)

    const openai = new OpenAI({ apiKey })

    try {
        console.log("🤖 Sending test request to OpenAI...")
        const completion = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [{ role: "user", content: "Say 'Hello from HappyMeter' if you can hear me." }],
        })
        console.log("\n✅ RESPONSE RECEIVED:")
        console.log(completion.choices[0].message.content)
    } catch (error) {
        console.error("❌ OpenAI Error:", error)
        process.exit(1)
    }
}

main()
