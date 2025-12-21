import { GoogleGenerativeAI } from '@google/generative-ai'

// Allow build to pass without key
const apiKey = process.env.GEMINI_API_KEY || 'dummy_key_for_build'

const genAI = new GoogleGenerativeAI(apiKey)

// Helper to get the model. Defaulting to flash for speed/cost.
export const getGeminiModel = (modelName: string = 'gemini-flash-latest', config: any = {}) => {
    const apiKey = process.env.GEMINI_API_KEY || 'dummy_key_for_build'
    const genAI = new GoogleGenerativeAI(apiKey)

    return genAI.getGenerativeModel({
        model: modelName,
        ...config
    })
}
