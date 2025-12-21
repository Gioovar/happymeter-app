import { NextResponse } from 'next/server'
import { getGeminiModel } from '@/lib/gemini'

export async function POST(req: Request) {
    try {
        const { image } = await req.json()

        if (!image) {
            return NextResponse.json({ error: 'Imagen requerida' }, { status: 400 })
        }

        if (!process.env.GEMINI_API_KEY) {
            return NextResponse.json({ reading: "Modo demo: Veo que tienes una gran suerte... (Configura GEMINI_API_KEY para ver más)." })
        }

        // Extract base64 and mime type
        // Format: data:image/jpeg;base64,.....
        const matches = image.match(/^data:(.+);base64,(.+)$/)
        if (!matches || matches.length < 3) {
            return NextResponse.json({ error: 'Formato de imagen inválido' }, { status: 400 })
        }

        const mimeType = matches[1]
        const base64Data = matches[2]

        const model = getGeminiModel('gemini-flash-latest', {
            systemInstruction: "Eres una vieja gitana mística y sabia experta en quiromancia (lectura de manos). Tu objetivo es analizar la palma de la mano de la imagen proporcionada. Habla en español con un tono misterioso, cálido y envolvente. Analiza brevemente las líneas principales (vida, corazón, cabeza) y da una predicción positiva sobre el futuro, el amor o el éxito. Mantén la respuesta en menos de 80 palabras."
        })

        const result = await model.generateContent({
            contents: [
                {
                    role: 'user',
                    parts: [
                        { text: "Lee mi fortuna en esta mano." },
                        {
                            inlineData: {
                                mimeType: mimeType,
                                data: base64Data
                            }
                        }
                    ]
                }
            ]
        })

        const reading = result.response.text()

        return NextResponse.json({ reading })

    } catch (error) {
        console.error('Hand Reader API Error:', error)
        const errorMessage = error instanceof Error ? error.message : String(error)
        return new NextResponse(JSON.stringify({ error: errorMessage }), { status: 500 })
    }
}
