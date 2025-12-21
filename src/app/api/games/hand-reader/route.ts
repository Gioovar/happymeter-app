import { NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY || 'dummy_key_for_build',
})

export async function POST(req: Request) {
    try {
        const { image } = await req.json()

        if (!image) {
            return NextResponse.json({ error: 'Imagen requerida' }, { status: 400 })
        }

        const response = await openai.chat.completions.create({
            model: "gpt-4o", // Vision model
            messages: [
                {
                    role: "system",
                    content: "Eres una vieja gitana mística y sabia experta en quiromancia (lectura de manos). Tu objetivo es analizar la palma de la mano de la imagen proporcionada. Habla en español con un tono misterioso, cálido y envolvente. Analiza brevemente las líneas principales (vida, corazón, cabeza) y da una predicción positiva sobre el futuro, el amor o el éxito. Mantén la respuesta en menos de 80 palabras."
                },
                {
                    role: "user",
                    content: [
                        { type: "text", text: "Lee mi fortuna en esta mano." },
                        {
                            type: "image_url",
                            image_url: {
                                "url": image, // Expecting base64 data url
                            },
                        },
                    ],
                },
            ],
            max_tokens: 150,
        })

        const reading = response.choices[0].message.content

        return NextResponse.json({ reading })

    } catch (error) {
        console.error('Hand Reader API Error:', error)
        return NextResponse.json({ error: 'La energía es difusa... intenta otra foto.' }, { status: 500 })
    }
}
