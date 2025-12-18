import { NextResponse } from 'next/server'
import OpenAI from 'openai'
import { prisma } from '@/lib/prisma' // Assuming this exists, mostly for logging if needed, or skip for now

// Initialize OpenAI
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(req: Request) {
    try {
        const { topic, question, venueName, stage, context } = await req.json()

        // 1. Validate
        if (!topic) return NextResponse.json({ error: 'El tema es requerido' }, { status: 400 })

        // 2. Persona & Prompt Construction
        const baseSystem = `Eres Zoltan, un antiguo místico y ligeramente dramático atrapado en una máquina de arcade. Tu idioma es el ESPAÑOL.`

        let systemPrompt = ""
        let userPrompt = ""

        if (stage === 'clarify') {
            // Stage 1: Ask for clarification
            systemPrompt = `${baseSystem}
            Tu objetivo es pedir una pequeña aclaración mística para afinar tu visión.
            Haz una pregunta corta, intrigante y relacionada con el tema del usuario.
            No des la predicción todavía. Solo haz la pregunta.
            Ejemplo: "¿El nombre de esta persona empieza con una vocal?" o "¿Has sentido un escalofrío recientemente?"
            Máximo 20 palabras.`

            userPrompt = `Tema: ${topic}. Pregunta del usuario: "${question}"`

        } else {
            // Stage 2: Final Prediction
            systemPrompt = `${baseSystem}
            Ahora tienes la visión completa. Da tu predicción final estilo tarot.
            Sé críptico pero reconfortante o intrigante.
            Usa la información extra que el usuario te dio.
            Menciona "${venueName}" al final como un lugar de poder.
            Máximo 60 palabras.`

            userPrompt = `Tema: ${topic}. 
            Pregunta original: "${context?.originalQuestion}". 
            Tu pregunta de aclaración: "${context?.clarificationQuestion}". 
            Respuesta del usuario: "${question}" (Esta es la aclaración).`
        }

        // 3. Call AI
        const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userPrompt }
            ],
            temperature: 0.8,
            max_tokens: 150,
        })

        const answer = completion.choices[0].message.content

        return NextResponse.json({ answer })

    } catch (error) {
        console.error('Zoltan API Error:', error)
        return NextResponse.json({ error: 'Los espíritus guardan silencio...' }, { status: 500 })
    }
}
